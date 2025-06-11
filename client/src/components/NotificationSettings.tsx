import { useState, useEffect } from 'react';
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
  const [retryAvailable, setRetryAvailable] = useState(false);

  // Auto-reset loading state after 8 seconds to prevent getting stuck
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setRetryAvailable(true);
      }, 8000);
      
      return () => clearTimeout(timeout);
    } else {
      setRetryAvailable(false);
    }
  }, [loading]);

  const handleManualPermissionRequest = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Force page reload to reset state
        window.location.reload();
      } else {
        toast({
          title: t('settings.notifications.subscriptionFailed'),
          description: 'Permission was not granted. Please check your browser settings.',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('settings.notifications.subscriptionFailed'),
        description: 'Unable to request permission. Try enabling notifications in your browser settings.',
        variant: "destructive"
      });
    }
  };

  const handleToggleNotifications = async () => {
    console.log('🔔 Toggle notifications clicked');
    console.log('Current state:', { isSubscribed, loading, error });
    console.log('Notification permission:', Notification.permission);
    console.log('User agent:', navigator.userAgent);

    if (isSubscribed) {
      console.log('📤 Attempting to unsubscribe...');
      const success = await unsubscribe();
      if (success) {
        toast({
          title: t('settings.notifications.unsubscribed'),
          description: t('settings.notifications.unsubscribedDesc'),
        });
      }
    } else {
      console.log('📥 Attempting to subscribe...');
      
      // Check if permission is already denied
      if (Notification.permission === 'denied') {
        console.log('❌ Permission already denied');
        toast({
          title: t('settings.notifications.subscriptionFailed'),
          description: t('settings.notifications.permissionDeniedDesc'),
          variant: "destructive"
        });
        return;
      }

      // For Android devices, add a small delay to ensure user gesture is preserved
      if (/Android/i.test(navigator.userAgent)) {
        console.log('📱 Android device detected, adding delay...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('🚀 Calling subscribe function...');
      const success = await subscribe();
      console.log('✅ Subscribe result:', success);
      
      if (success) {
        console.log('🎉 Subscription successful');
        toast({
          title: t('settings.notifications.subscribed'),
          description: t('settings.notifications.subscribedDesc'),
        });
      } else {
        console.log('❌ Subscription failed, error:', error);
        if (error) {
          toast({
            title: t('settings.notifications.subscriptionFailed'),
            description: error,
            variant: "destructive"
          });
        }
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
              disabled={loading && !retryAvailable}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {loading && !retryAvailable ? t('settings.notifications.enabling') : 
               retryAvailable ? 'Retry Enabling Notifications' :
               t('settings.notifications.enablePush')}
            </Button>
            
            {/* Show retry help if stuck */}
            {retryAvailable && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-red-600">
                  Taking too long? Try the manual option below:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualPermissionRequest}
                  className="w-full"
                >
                  Manual Permission Request
                </Button>
              </div>
            )}
            
            {/* Show additional help for Android devices */}
            {/Android/i.test(navigator.userAgent) && !retryAvailable && (
              <p className="text-xs text-muted-foreground mt-2">
                If the permission dialog doesn't appear, try enabling notifications in your browser's site settings.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}