import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useTranslation } from "react-i18next";

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationSettings() {
  console.log('📱 NOTIFICATION COMPONENT: Loading notification settings');
  const { t } = useTranslation();
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe
  } = usePushNotifications();
  
  console.log('📱 NOTIFICATION COMPONENT: Hook state:', {
    isSupported,
    isSubscribed,
    isLoading,
    permission
  });

  const handleToggleNotifications = async () => {
    console.log('🎯 BUTTON CLICKED: Toggle notifications called');
    console.log('🎯 CURRENT STATE:', { isSubscribed, isLoading });
    
    if (isSubscribed) {
      console.log('🔄 UNSUBSCRIBING...');
      await unsubscribe();
    } else {
      console.log('🔄 SUBSCRIBING...');
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

        {!isSubscribed && permission === 'granted' && (
          <div className="space-y-2">
            <Button 
              onClick={async () => {
                try {
                  // Direct notification request without React state
                  const permission = await Notification.requestPermission();
                  if (permission !== 'granted') return;
                  
                  const registration = await navigator.serviceWorker.ready;
                  const vapidResponse = await fetch('/api/push/vapid-public-key');
                  const { publicKey } = await vapidResponse.json();
                  
                  const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                  });
                  
                  await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: subscription.toJSON() })
                  });
                  
                  alert('Notifications enabled successfully!');
                  window.location.reload();
                } catch (error) {
                  alert('Failed to enable notifications: ' + (error instanceof Error ? error.message : 'Unknown error'));
                }
              }}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading 
                ? t('notifications.enabling', 'Enabling...')
                : t('notifications.enable', 'Enable Notifications')
              }
            </Button>
          </div>
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