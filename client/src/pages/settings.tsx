import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Settings, Heart, Bell, Shield, Globe } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NotificationSettings } from "@/components/notifications/notification-settings";

interface MatchPreferences {
  id: number;
  userId: number;
  maxDistanceKm: number;
  ageFlexibility: number;
  isEnabled: boolean;
  lastMatchRun: string | null;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Fetch match preferences
  const { data: preferences, isLoading: preferencesLoading, refetch: refetchPreferences } = useQuery({
    queryKey: ["/api/match-preferences"]
  });

  const matchPrefs = preferences as MatchPreferences | undefined;

  const [maxDistance, setMaxDistance] = useState(matchPrefs?.maxDistanceKm || 20);
  const [ageFlexibility, setAgeFlexibility] = useState(matchPrefs?.ageFlexibility || 2);
  const [isEnabled, setIsEnabled] = useState(matchPrefs?.isEnabled ?? true);

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
      isEnabled: isEnabled
    });
  };

  // Update state when preferences load
  if (matchPrefs && !preferencesLoading) {
    if (maxDistance !== matchPrefs.maxDistanceKm) {
      setMaxDistance(matchPrefs.maxDistanceKm);
    }
    if (ageFlexibility !== matchPrefs.ageFlexibility) {
      setAgeFlexibility(matchPrefs.ageFlexibility);
    }
    if (isEnabled !== matchPrefs.isEnabled) {
      setIsEnabled(matchPrefs.isEnabled);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title', 'Settings')}</h1>
          <p className="text-gray-600">{t('settings.description', 'Manage your account preferences and app settings')}</p>
        </div>
      </div>

      <Tabs defaultValue="matching" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matching" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Dad Matching
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Language
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matching">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Dad Matching Preferences
              </CardTitle>
              <CardDescription>
                Configure how the system finds potential dad connections for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {preferencesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading preferences...</div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Enable Dad Matching</Label>
                        <p className="text-sm text-gray-600">
                          Allow the system to find and suggest dad connections
                        </p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={setIsEnabled}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="maxDistance" className="text-base font-medium">
                        Maximum Distance: {maxDistance}km
                      </Label>
                      <p className="text-sm text-gray-600">
                        Only show dads within this distance from your location
                      </p>
                      <Input
                        id="maxDistance"
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5km</span>
                        <span>25km</span>
                        <span>50km</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="ageFlexibility" className="text-base font-medium">
                        Age Flexibility: ±{ageFlexibility} years
                      </Label>
                      <p className="text-sm text-gray-600">
                        Match with dads whose children are within this age range of your children
                      </p>
                      <Input
                        id="ageFlexibility"
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={ageFlexibility}
                        onChange={(e) => setAgeFlexibility(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>±1 year</span>
                        <span>±3 years</span>
                        <span>±5 years</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSavePreferences}
                      disabled={updatePreferencesMutation.isPending}
                      className="min-w-24"
                    >
                      {updatePreferencesMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>

                  {matchPrefs?.lastMatchRun && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <p className="text-sm text-gray-600">
                        <strong>Last matching run:</strong> {new Date(matchPrefs.lastMatchRun).toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Manage your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Privacy settings coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Choose your preferred language and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Language settings coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}