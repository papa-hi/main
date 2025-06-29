import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, User as UserIcon, Bell, Shield, HelpCircle, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NotificationSettings from '@/components/NotificationSettings';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import type { User } from '@shared/schema';

interface MatchPreferences {
  id: number;
  userId: number;
  maxDistanceKm: number;
  ageFlexibility: number;
  isEnabled: boolean;
  lastMatchRun: string | null;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('notifications');
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // GDPR consent states
  const [analyticsConsent, setAnalyticsConsent] = useState(
    localStorage.getItem('analytics_consent') === 'true'
  );
  const [marketingConsent, setMarketingConsent] = useState(
    localStorage.getItem('marketing_consent') === 'true'
  );
  const [locationConsent, setLocationConsent] = useState(
    localStorage.getItem('location_consent') === 'true'
  );

  // Dad matching preferences states
  const [maxDistance, setMaxDistance] = useState(20);
  const [ageFlexibility, setAgeFlexibility] = useState(2);
  const [matchingEnabled, setMatchingEnabled] = useState(true);

  // GDPR data management functions
  const handleDataExport = async () => {
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `papa-hi-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: t('settings.privacy.exportSuccess', 'Data Export Complete'),
          description: t('settings.privacy.exportSuccessDesc', 'Your data has been downloaded successfully.')
        });
      }
    } catch (error) {
      toast({
        title: t('settings.privacy.exportError', 'Export Failed'),
        description: t('settings.privacy.exportErrorDesc', 'Unable to export your data. Please try again.'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAccount = () => {
    if (confirm(t('settings.privacy.deleteConfirm', 'Are you sure you want to delete your account? This action cannot be undone.'))) {
      // Navigate to dedicated account deletion page with proper warnings
      navigate('/settings/delete-account');
    }
  };

  // Update consent preferences
  const updateAnalyticsConsent = (checked: boolean) => {
    setAnalyticsConsent(checked);
    localStorage.setItem('analytics_consent', checked.toString());
    toast({
      title: t('settings.privacy.consentUpdated', 'Preferences Updated'),
      description: checked 
        ? t('settings.privacy.analyticsEnabled', 'Analytics enabled') 
        : t('settings.privacy.analyticsDisabled', 'Analytics disabled')
    });
  };

  const updateMarketingConsent = (checked: boolean) => {
    setMarketingConsent(checked);
    localStorage.setItem('marketing_consent', checked.toString());
    toast({
      title: t('settings.privacy.consentUpdated', 'Preferences Updated'),
      description: checked 
        ? t('settings.privacy.marketingEnabled', 'Marketing communications enabled') 
        : t('settings.privacy.marketingDisabled', 'Marketing communications disabled')
    });
  };

  const updateLocationConsent = (checked: boolean) => {
    setLocationConsent(checked);
    localStorage.setItem('location_consent', checked.toString());
    toast({
      title: t('settings.privacy.consentUpdated', 'Preferences Updated'),
      description: checked 
        ? t('settings.privacy.locationEnabled', 'Location services enabled') 
        : t('settings.privacy.locationDisabled', 'Location services disabled')
    });
  };

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  // Fetch match preferences
  const { data: preferences, isLoading: preferencesLoading, refetch: refetchPreferences } = useQuery({
    queryKey: ["/api/match-preferences"]
  });

  const matchPrefs = preferences as MatchPreferences | undefined;

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: { maxDistanceKm: number; ageFlexibility: number; isEnabled: boolean }) =>
      apiRequest("PATCH", "/api/match-preferences", data),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your dad matching preferences have been saved."
      });
      refetchPreferences();
      queryClient.invalidateQueries({ queryKey: ["/api/match-preferences"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive"
      });
    }
  });

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate({
      maxDistanceKm: maxDistance,
      ageFlexibility: ageFlexibility,
      isEnabled: matchingEnabled
    });
  };

  // Update state when preferences load using useEffect
  useEffect(() => {
    if (matchPrefs && !preferencesLoading) {
      setMaxDistance(matchPrefs.maxDistanceKm);
      setAgeFlexibility(matchPrefs.ageFlexibility);
      setMatchingEnabled(matchPrefs.isEnabled);
    }
  }, [matchPrefs, preferencesLoading]);

  const sections = [
    {
      id: 'dadMatching',
      title: 'Dad Matching',
      icon: Heart,
      description: 'Configure how you find other dads'
    },
    {
      id: 'notifications',
      title: t('settings.notifications.title'),
      icon: Bell,
      description: t('settings.notifications.subtitle')
    },
    {
      id: 'account',
      title: t('settings.account.title'),
      icon: UserIcon,
      description: t('settings.account.subtitle')
    },
    {
      id: 'privacy',
      title: t('settings.privacy.title'),
      icon: Shield,
      description: t('settings.privacy.subtitle')
    },
    {
      id: 'help',
      title: t('settings.help.title'),
      icon: HelpCircle,
      description: t('settings.help.subtitle')
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dadMatching':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Dad Matching Preferences
              </CardTitle>
              <CardDescription>
                Configure how we help you find other dads in your area with children of similar ages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preferencesLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Dad Matching</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow the system to find other dads for you
                      </p>
                    </div>
                    <Switch
                      checked={matchingEnabled}
                      onCheckedChange={setMatchingEnabled}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxDistance">
                        Maximum Distance: {maxDistance} km
                      </Label>
                      <input
                        id="maxDistance"
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5km</span>
                        <span>50km</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We'll look for other dads within {maxDistance} km of your location
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ageFlexibility">
                        Age Flexibility: ±{ageFlexibility} years
                      </Label>
                      <input
                        id="ageFlexibility"
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={ageFlexibility}
                        onChange={(e) => setAgeFlexibility(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>±1 year</span>
                        <span>±5 years</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Match with dads whose children are within ±{ageFlexibility} years of your children's ages
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Current Settings</p>
                      <p className="text-sm text-muted-foreground">
                        {matchingEnabled ? 'Enabled' : 'Disabled'} • {maxDistance}km radius • ±{ageFlexibility} year age range
                      </p>
                      {matchPrefs?.lastMatchRun && (
                        <p className="text-xs text-muted-foreground">
                          Last match run: {new Date(matchPrefs.lastMatchRun).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={handleSavePreferences}
                      disabled={updatePreferencesMutation.isPending}
                    >
                      {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'notifications':
        return <NotificationSettings />;
      
      case 'account':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {t('settings.account.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.account.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{t('settings.account.personalInfo')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('settings.account.name')}:</span>
                      <p>{user?.firstName || t('settings.account.notSet')} {user?.lastName || ''}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('settings.account.username')}:</span>
                      <p>{user?.username || t('settings.account.notSet')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('settings.account.email')}:</span>
                      <p>{user?.email || t('settings.account.notSet')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('settings.account.city')}:</span>
                      <p>{user?.city || t('settings.account.notSet')}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" onClick={() => navigate('/profile')}>{t('settings.account.editProfile')}</Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'privacy':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('settings.privacy.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.privacy.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{t('settings.privacy.dataPrivacy')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.privacy.dataPrivacyDesc')}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">{t('settings.privacy.chatHistory')}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('settings.privacy.chatHistoryDesc')}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">{t('settings.privacy.locationData')}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('settings.privacy.locationDataDesc')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open('/privacy', '_blank')}>
                      {t('settings.privacy.viewPolicy', 'View Privacy Policy')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDataExport()}>
                      {t('settings.privacy.exportData', 'Export My Data')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAccount()}>
                      {t('settings.privacy.deleteAccount', 'Delete Account')}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">{t('settings.privacy.consent', 'Consent Management')}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('settings.privacy.consentDesc', 'Manage your data processing preferences')}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{t('settings.privacy.analytics', 'Analytics')}</p>
                        <p className="text-xs text-muted-foreground">{t('settings.privacy.analyticsDesc', 'Help improve the app')}</p>
                      </div>
                      <Switch 
                        checked={analyticsConsent}
                        onCheckedChange={updateAnalyticsConsent}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{t('settings.privacy.marketing', 'Marketing Communications')}</p>
                        <p className="text-xs text-muted-foreground">{t('settings.privacy.marketingDesc', 'Receive updates and tips')}</p>
                      </div>
                      <Switch 
                        checked={marketingConsent}
                        onCheckedChange={updateMarketingConsent}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{t('settings.privacy.location', 'Location Services')}</p>
                        <p className="text-xs text-muted-foreground">{t('settings.privacy.locationDesc', 'Find places near you')}</p>
                      </div>
                      <Switch 
                        checked={locationConsent}
                        onCheckedChange={updateLocationConsent}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'help':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                {t('settings.help.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.help.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{t('settings.help.gettingStarted')}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('settings.help.gettingStartedDesc')}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">{t('settings.help.faq')}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('settings.help.faqDesc')}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">{t('settings.help.contactSupport')}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('settings.help.contactSupportDesc')}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = 'mailto:papa@papa-hi.com?subject=PaPa-Hi Support Request'}
                  >
                    {t('settings.help.contactUs')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Settings className="h-8 w-8" />
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                        activeSection === section.id ? 'bg-muted border-r-2 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {section.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}