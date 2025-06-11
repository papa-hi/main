import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, User as UserIcon, Bell, Shield, HelpCircle } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import type { User } from '@shared/schema';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('notifications');
  const { t } = useTranslation();

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  const sections = [
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
                <Button variant="outline">{t('settings.account.editProfile')}</Button>
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
                  <Button variant="outline" size="sm">
                    {t('settings.privacy.manageData')}
                  </Button>
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
                  <Button variant="outline" size="sm">
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