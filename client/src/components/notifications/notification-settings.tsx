import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useTranslation } from "react-i18next";

export function NotificationSettings() {
  const { t } = useTranslation();
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe
  } = usePushNotifications();

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {t('notifications.title', 'Push Notifications')}
          </CardTitle>
          <CardDescription>
            {t('notifications.notSupported', 'Push notifications are not supported on this device or browser.')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('notifications.title', 'Push Notifications')}
        </CardTitle>
        <CardDescription>
          {t('notifications.description', 'Get notified about playdate reminders and updates')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="push-notifications">
              {t('notifications.enableTitle', 'Enable Push Notifications')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('notifications.enableDescription', 'Receive reminders for upcoming playdates and notifications when someone joins your activities')}
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </div>

        {permission === 'denied' && (
          <div className="p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">
              {t('notifications.permissionDenied', 'Notification permission was denied. Please enable notifications in your browser settings to receive alerts.')}
            </p>
          </div>
        )}

        {permission === 'default' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              {t('notifications.permissionInstructions', 'To enable notifications:')}
            </p>
            <ol className="text-sm text-blue-600 dark:text-blue-400 list-decimal list-inside space-y-1">
              <li>{t('notifications.step1', 'Tap the toggle above')}</li>
              <li>{t('notifications.step2', 'Allow notifications when prompted')}</li>
              <li>{t('notifications.step3', 'If no popup appears, check your browser settings')}</li>
            </ol>
          </div>
        )}

        {!isSubscribed && permission === 'granted' && (
          <Button 
            onClick={subscribe} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading 
              ? t('notifications.enabling', 'Enabling...')
              : t('notifications.enable', 'Enable Notifications')
            }
          </Button>
        )}

        {isSubscribed && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                {t('notifications.enabled', 'Push notifications are enabled! You\'ll receive playdate reminders and updates.')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {t('notifications.whatYouReceive', 'What you\'ll receive:')}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>{t('notifications.reminder1h', 'Reminders 1 hour before playdates')}</li>
                <li>{t('notifications.reminder30m', 'Reminders 30 minutes before playdates')}</li>
                <li>{t('notifications.newParticipant', 'Notifications when someone joins your playdate')}</li>
                <li>{t('notifications.playdateUpdates', 'Updates when playdate details change')}</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}