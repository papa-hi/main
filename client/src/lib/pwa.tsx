import { Fragment } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// SVG logo for Papa-Hi
const PapaHiLogo = () => (
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#4F6F52" />
    <path d="M8 10H12V22H8V10Z" fill="white" />
    <path d="M14 10H18C20.2091 10 22 11.7909 22 14C22 16.2091 20.2091 18 18 18H14V10Z" fill="white" />
    <path d="M14 14H18V18H14V14Z" fill="#4F6F52" />
    <path d="M8 16H12V20H8V16Z" fill="#4F6F52" />
    <path d="M20 18H24V22H20V18Z" fill="white" />
  </svg>
);

interface PrivacyConsentDialogProps {
  onAccept: () => void;
  onReject: () => void;
}

export function PrivacyConsentDialog({ onAccept, onReject }: PrivacyConsentDialogProps) {
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Privacy Instellingen</DialogTitle>
          <DialogDescription>
            Om je de beste ervaring te bieden, gebruiken we locatiediensten en slaan we je voorkeuren op. 
            We geven om je privacy en delen je gegevens niet met derden.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 my-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="essentialCookies" defaultChecked disabled />
            <div className="grid gap-1.5">
              <Label htmlFor="essentialCookies" className="font-medium">Essentiële Cookies</Label>
              <p className="text-sm text-muted-foreground">Noodzakelijk voor het functioneren van de app.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox id="locationServices" defaultChecked />
            <div className="grid gap-1.5">
              <Label htmlFor="locationServices" className="font-medium">Locatiediensten</Label>
              <p className="text-sm text-muted-foreground">Toestaan om plaatsen in je buurt te vinden.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox id="analyticsConsent" />
            <div className="grid gap-1.5">
              <Label htmlFor="analyticsConsent" className="font-medium">Analytics</Label>
              <p className="text-sm text-muted-foreground">Helpt ons de app te verbeteren.</p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onReject} className="flex-1">Afwijzen</Button>
          <Button onClick={onAccept} className="bg-primary hover:bg-accent text-white flex-1">Accepteren</Button>
        </DialogFooter>
        <div className="text-center">
          <a href="#" className="text-primary text-xs hover:underline">Privacybeleid bekijken</a>
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
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 bg-white rounded-xl shadow-lg p-4 z-50 transition-all duration-300">
      <div className="flex items-start">
        <PapaHiLogo />
        <div className="flex-grow ml-3">
          <h3 className="font-heading font-bold text-base mb-1">Installeer Papa-Hi</h3>
          <p className="text-sm text-dark/70 mb-3">Krijg snellere toegang en offline mogelijkheden op je toestel!</p>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onDismiss}
              className="py-2 px-4 text-sm font-medium text-dark/70"
            >
              Later
            </Button>
            <Button 
              onClick={onInstall}
              className="bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent transition"
            >
              Installeren
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Register the service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
}
