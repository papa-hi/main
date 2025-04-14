import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AppShell from "./components/layout/app-shell";
import HomePage from "./pages/home";
import PlaydatesPage from "./pages/playdates";
import PlacesPage from "./pages/places";
import ProfilePage from "./pages/profile";
import CreatePage from "./pages/create";
import { useState, useEffect } from "react";
import { PrivacyConsentDialog, InstallPWAPrompt } from "./lib/pwa";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage}/>
      <Route path="/playdates" component={PlaydatesPage}/>
      <Route path="/places" component={PlacesPage}/>
      <Route path="/profile" component={ProfilePage}/>
      <Route path="/create" component={CreatePage}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);

  useEffect(() => {
    // Check if privacy consent is already given
    const hasGivenConsent = localStorage.getItem('privacy_consent');
    if (!hasGivenConsent) {
      setShowPrivacyConsent(true);
    }

    // Show PWA install prompt after a delay
    const hasInstalled = localStorage.getItem('pwa_installed');
    if (!hasInstalled) {
      const timer = setTimeout(() => {
        setShowPWAPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptPrivacy = () => {
    localStorage.setItem('privacy_consent', 'true');
    setShowPrivacyConsent(false);
  };

  const handleRejectPrivacy = () => {
    localStorage.setItem('privacy_consent', 'false');
    setShowPrivacyConsent(false);
  };

  const handleDismissPWA = () => {
    setShowPWAPrompt(false);
  };

  const handleInstallPWA = () => {
    localStorage.setItem('pwa_installed', 'true');
    setShowPWAPrompt(false);
    // Actual installation logic is handled by browser
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Router />
      </AppShell>
      <Toaster />
      
      {showPrivacyConsent && (
        <PrivacyConsentDialog 
          onAccept={handleAcceptPrivacy} 
          onReject={handleRejectPrivacy} 
        />
      )}
      
      {showPWAPrompt && (
        <InstallPWAPrompt 
          onDismiss={handleDismissPWA} 
          onInstall={handleInstallPWA} 
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
