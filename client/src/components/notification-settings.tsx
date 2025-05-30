import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/lib/notifications';
import { Bell, BellOff } from 'lucide-react';

export function NotificationSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    setPermissionGranted(Notification.permission === 'granted');
    
    await notificationService.initialize();
    const subscribed = await notificationService.isSubscribed();
    setIsSubscribed(subscribed);
  };

  const handleToggleNotifications = async () => {
    setIsLoading(true);
    
    try {
      if (!isSubscribed) {
        // Request permission first if not granted
        if (!permissionGranted) {
          const granted = await notificationService.requestPermission();
          if (!granted) {
            toast({
              title: "Toestemming vereist",
              description: "Schakel notificaties in via je browserinstellingen om herinneringen te ontvangen.",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
          setPermissionGranted(true);
        }

        // Subscribe to notifications
        const success = await notificationService.subscribeToPushNotifications();
        if (success) {
          setIsSubscribed(true);
          toast({
            title: "Notificaties ingeschakeld",
            description: "Je ontvangt nu herinneringen voor je speelafspraken."
          });
        } else {
          toast({
            title: "Fout bij inschakelen",
            description: "Kon notificaties niet inschakelen. Probeer het opnieuw.",
            variant: "destructive"
          });
        }
      } else {
        // Unsubscribe from notifications
        const success = await notificationService.unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
          toast({
            title: "Notificaties uitgeschakeld",
            description: "Je ontvangt geen herinneringen meer voor speelafspraken."
          });
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast({
        title: "Er ging iets mis",
        description: "Kon notificatie-instellingen niet wijzigen.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    notificationService.showLocalNotification(
      "Test notificatie",
      {
        body: "Dit is een test om te controleren of notificaties werken.",
        icon: "/favicon.ico"
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaties
        </CardTitle>
        <CardDescription>
          Ontvang herinneringen en updates over je speelafspraken
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications">Push notificaties</Label>
            <p className="text-sm text-muted-foreground">
              Ontvang herinneringen 24 uur voor je speelafspraken
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </div>

        {!permissionGranted && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <BellOff className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-700">
              Notificaties zijn uitgeschakeld in je browser. Klik op het slot-icoon in de adresbalk om ze in te schakelen.
            </p>
          </div>
        )}

        {isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={testNotification}
            className="w-full"
          >
            Test notificatie
          </Button>
        )}
      </CardContent>
    </Card>
  );
}