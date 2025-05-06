import { Fragment } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

// Logo for Papa-Hi
const PapaHiLogo = () => (
  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white p-1">
    <img 
      src="/images/papa-hi.png" 
      alt="Papa-Hi Logo" 
      className="h-12 w-12 object-contain" 
    />
  </div>
);

interface PrivacyConsentDialogProps {
  onAccept: () => void;
  onReject: () => void;
}

export function PrivacyConsentDialog({ onAccept, onReject }: PrivacyConsentDialogProps) {
  const { t } = useTranslation('pwa');
  
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('privacy.title', 'Privacy Settings')}</DialogTitle>
          <DialogDescription>
            {t('privacy.description', 'To provide you with the best experience, we use location services and save your preferences. We care about your privacy and don\'t share your data with third parties.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 my-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="essentialCookies" defaultChecked disabled />
            <div className="grid gap-1.5">
              <Label htmlFor="essentialCookies" className="font-medium">
                {t('privacy.essentialCookies', 'Essential Cookies')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('privacy.essentialCookiesDesc', 'Necessary for the app to function.')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox id="locationServices" defaultChecked />
            <div className="grid gap-1.5">
              <Label htmlFor="locationServices" className="font-medium">
                {t('privacy.locationServices', 'Location Services')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('privacy.locationServicesDesc', 'Allow finding places near you.')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox id="analyticsConsent" />
            <div className="grid gap-1.5">
              <Label htmlFor="analyticsConsent" className="font-medium">
                {t('privacy.analytics', 'Analytics')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('privacy.analyticsDesc', 'Helps us improve the app.')}
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onReject} className="flex-1">
            {t('privacy.reject', 'Reject')}
          </Button>
          <Button onClick={onAccept} className="bg-primary hover:bg-accent text-white flex-1">
            {t('privacy.accept', 'Accept')}
          </Button>
        </DialogFooter>
        <div className="text-center">
          <a href="#" className="text-primary text-xs hover:underline">
            {t('privacy.viewPrivacyPolicy', 'View Privacy Policy')}
          </a>
        </div>
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
        <PapaHiLogo />
        <div className="flex-grow ml-3">
          <h3 className="font-heading font-bold text-base mb-1">
            {t('install.title', 'Install Papa-Hi')}
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


