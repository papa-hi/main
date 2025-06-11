import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [testLoading, setTestLoading] = useState(false);

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: "Meldingen uitgeschakeld",
          description: "Je ontvangt geen push meldingen meer",
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: "Meldingen ingeschakeld",
          description: "Je ontvangt nu push meldingen",
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
        title: "Test melding verstuurd",
        description: "Controleer je apparaat voor de melding",
      });
    } else {
      toast({
        title: "Test mislukt",
        description: "Kon geen test melding versturen",
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
            Push Meldingen
          </CardTitle>
          <CardDescription>
            Push meldingen worden niet ondersteund door jouw browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Gebruik een moderne browser voor push meldingen</span>
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
          Push Meldingen
        </CardTitle>
        <CardDescription>
          Ontvang meldingen over nieuwe playdates, berichten en updates
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
              Push Meldingen
            </Label>
            <p className="text-sm text-muted-foreground">
              Krijg meldingen zelfs als de app gesloten is
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
              <span>Push meldingen zijn actief</span>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Melding Voorkeuren</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Playdate Herinneringen</Label>
                    <p className="text-xs text-muted-foreground">
                      Krijg een herinnering voor aankomende playdates
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Nieuwe Berichten</Label>
                    <p className="text-xs text-muted-foreground">
                      Meldingen voor nieuwe chat berichten
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Playdate Updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Wijzigingen in playdates waar je aan deelneemt
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Nieuwe Locaties</Label>
                    <p className="text-xs text-muted-foreground">
                      Meldingen over nieuwe speelplekken in jouw buurt
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
              {testLoading ? 'Versturen...' : 'Test Melding Versturen'}
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
              {loading ? 'Inschakelen...' : 'Meldingen Inschakelen'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}