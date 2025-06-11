import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();
  
  const { toast } = useToast();
  const { t } = useTranslation();
  const [testLoading, setTestLoading] = useState(false);

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: t('settings.notifications.unsubscribed'),
          description: t('settings.notifications.unsubscribedDesc'),
        });
      }
    } else {
      // Check if permission is already denied
      if (Notification.permission === 'denied') {
        toast({
          title: t('settings.notifications.subscriptionFailed'),
          description: t('settings.notifications.permissionDeniedDesc'),
          variant: "destructive"
        });
        return;
      }

      const success = await subscribe();
      if (success) {
        toast({
          title: t('settings.notifications.subscribed'),
          description: t('settings.notifications.subscribedDesc'),
        });
      }
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    const success = await sendTestNotification();
    setTestLoading(false);
    
    if (success) {
      toast({
        title: t('settings.notifications.notificationsSent'),
        description: t('settings.notifications.checkDevice'),
      });
    } else {
      toast({
        title: t('settings.notifications.subscriptionFailed'),
        description: t('settings.notifications.subscriptionFailedDesc'),
        variant: "destructive"
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {t('settings.notifications.pushNotifications')}
          </CardTitle>
          <CardDescription>
            {t('settings.notifications.notSupportedDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{t('settings.notifications.notSupported')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('settings.notifications.pushNotifications')}
        </CardTitle>
        <CardDescription>
          {t('settings.notifications.enablePushDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="push-notifications" className="text-base font-medium">
              {t('settings.notifications.pushNotifications')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.notifications.enablePushDesc')}
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={loading}
          />
        </div>

        {isSubscribed && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle className="h-4 w-4" />
              <span>{t('settings.notifications.activeStatus')}</span>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">{t('settings.notifications.preferences')}</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{t('settings.notifications.playdateReminders')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.notifications.playdateRemindersDesc')}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{t('settings.notifications.newMessages')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.notifications.newMessagesDesc')}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{t('settings.notifications.playdateUpdates')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.notifications.playdateUpdatesDesc')}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{t('settings.notifications.newLocations')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.notifications.newLocationsDesc')}
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={testLoading}
              className="w-full"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              {testLoading ? t('settings.notifications.sendingTest') : t('settings.notifications.sendTest')}
            </Button>
          </div>
        )}

        {!isSubscribed && (
          <div className="text-center py-4">
            <Button
              onClick={handleToggleNotifications}
              disabled={loading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {loading ? t('settings.notifications.enabling') : t('settings.notifications.enablePush')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}