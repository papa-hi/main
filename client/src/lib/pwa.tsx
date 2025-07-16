import { Fragment, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

// Logo for PaPa-Hi
const PaPaHiLogo = () => (
  <div className="flex items-center justify-center h-14 w-10 overflow-hidden rounded-[28px] bg-white">
    <img 
      src="/images/papa-hi.png" 
      alt="PaPa-Hi Logo" 
      className="h-full w-full object-contain scale-150" 
    />
  </div>
);

interface PrivacyConsentDialogProps {
  onAccept: (preferences: ConsentPreferences) => void;
  onReject: () => void;
}

interface ConsentPreferences {
  essential: boolean;
  location: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function PrivacyConsentDialog({ onAccept, onReject }: PrivacyConsentDialogProps) {
  const { t } = useTranslation('pwa');
  const [showCustom, setShowCustom] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    location: true,
    analytics: false,
    marketing: false
  });

  const handleAcceptAll = () => {
    const allConsent = {
      essential: true,
      location: true,
      analytics: true,
      marketing: true
    };
    onAccept(allConsent);
  };

  const handleEssentialOnly = () => {
    const essentialOnly = {
      essential: true,
      location: false,
      analytics: false,
      marketing: false
    };
    onAccept(essentialOnly);
  };

  const handleCustomAccept = () => {
    onAccept(preferences);
  };

  const updatePreference = (key: keyof ConsentPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('privacy.title', 'Privacy & Cookie Settings')}</DialogTitle>
          <DialogDescription>
            {t('privacy.description', 'We use cookies and similar technologies to provide you with the best experience. Choose your preferences below or accept all to continue.')}
          </DialogDescription>
        </DialogHeader>
        
        {!showCustom ? (
          // Simple three-button interface
          <div className="space-y-4 my-6">
            <div className="text-sm text-muted-foreground">
              {t('privacy.choose', 'Choose how we can use cookies and process your data:')}
            </div>
            
            <div className="grid gap-3">
              <Button onClick={handleAcceptAll} className="bg-primary hover:bg-primary/90 text-white">
                {t('privacy.acceptAll', 'Accept All')}
              </Button>
              
              <Button onClick={handleEssentialOnly} variant="outline">
                {t('privacy.essentialOnly', 'Essential Only')}
              </Button>
              
              <Button onClick={() => setShowCustom(true)} variant="outline">
                {t('privacy.customPreferences', 'Custom Preferences')}
              </Button>
            </div>
          </div>
        ) : (
          // Custom preferences interface
          <div className="space-y-4 my-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="essentialCookies" 
                  checked={preferences.essential}
                  disabled 
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="essentialCookies" className="font-medium">
                    {t('privacy.essentialCookies', 'Essential Cookies')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.essentialCookiesDesc', 'Necessary for the app to function properly.')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="locationServices" 
                  checked={preferences.location}
                  onCheckedChange={(checked) => updatePreference('location', checked as boolean)}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="locationServices" className="font-medium">
                    {t('privacy.locationServices', 'Location Services')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.locationServicesDesc', 'Find places and connect with people near you.')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="analyticsConsent" 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => updatePreference('analytics', checked as boolean)}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="analyticsConsent" className="font-medium">
                    {t('privacy.analytics', 'Analytics & Performance')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.analyticsDesc', 'Help us improve the app by collecting usage data.')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="marketingConsent" 
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => updatePreference('marketing', checked as boolean)}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="marketingConsent" className="font-medium">
                    {t('privacy.marketing', 'Marketing & Communications')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.marketingDesc', 'Receive updates, tips, and promotional content.')}
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowCustom(false)} className="flex-1">
                {t('privacy.back', 'Back')}
              </Button>
              <Button onClick={handleCustomAccept} className="bg-primary hover:bg-primary/90 text-white flex-1">
                {t('privacy.savePreferences', 'Save Preferences')}
              </Button>
            </DialogFooter>
          </div>
        )}
        
        {!showCustom && (
          <div className="text-center">
            <a href="/privacy" className="text-primary text-xs hover:underline">
              {t('privacy.viewPrivacyPolicy', 'View Privacy Policy')}
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface InstallPWAPromptProps {
  onDismiss: () => void;
  onInstall: () => void;
}

export function InstallPWAPrompt({ onDismiss, onInstall }: InstallPWAPromptProps) {
  const { t } = useTranslation('pwa');
  
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 bg-white rounded-xl shadow-lg p-4 z-50 transition-all duration-300">
      <div className="flex items-start">
        <PaPaHiLogo />
        <div className="flex-grow ml-3">
          <h3 className="font-heading font-bold text-base mb-1">
            {t('install.title', 'Install PaPa-Hi')}
          </h3>
          <p className="text-sm text-dark/70 mb-3">
            {t('install.description', 'Get faster access and offline capabilities on your device!')}
          </p>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onDismiss}
              className="py-2 px-4 text-sm font-medium text-dark/70"
            >
              {t('install.later', 'Later')}
            </Button>
            <Button 
              onClick={onInstall}
              className="bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent transition"
            >
              {t('install.install', 'Install')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


