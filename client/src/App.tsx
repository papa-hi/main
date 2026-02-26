import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AppShell from "./components/layout/app-shell";
import HomePage from "./pages/home";
import PlaydatesPage from "./pages/playdates";
import PlaydateDetailPage from "./pages/playdate-detail";
import PlacesPage from "./pages/places";
import ProfilePage from "./pages/profile";
import UserProfilePage from "./pages/user-profile";
import DiscoverPage from "./pages/discover";
import CommunityPage from "./pages/community";
import CreatePage from "./pages/create";
import EditPlaydatePage from "./pages/edit-playdate";
import ChatPage from "./pages/chat";
import MatchesPage from "./pages/matches";
import AuthPage from "./pages/auth-page";
import ForgotPasswordPage from "./pages/forgot-password";
import ResetPasswordPage from "./pages/reset-password";
import PlaceDetailsPage from "./pages/place-details";
import EventDetailsPage from "./pages/event-details";
import SettingsPage from "./pages/SettingsPage";
import DeleteAccountPage from "./pages/delete-account";
import PrivacyPolicyPage from "./pages/privacy-policy";

import AdminDashboard from "./pages/admin";
import AdminCheck from "./pages/admin-check";
import TestCreatePlaydate from "./pages/test-create-playdate";
import SimpleTestPage from "./pages/simple-test";
import AboutPage from "./pages/about";
import DadDaysPage from "./pages/dad-days";
import { useState, useEffect } from "react";
import { PrivacyConsentDialog, InstallPWAPrompt } from "./lib/pwa";
import ErrorBoundary from "./components/shared/error-boundary";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { FirebaseAuthProvider } from "./hooks/use-firebase-auth";
import { ChatProvider } from "./hooks/use-chat";
import { AdminProvider } from "./hooks/use-admin";
import { AppConfigProvider } from "./hooks/use-app-config";
import { ProtectedRoute } from "./lib/protected-route";
import { useWelcome } from "./hooks/use-welcome";
import AnimatedWelcome from "./components/welcome/animated-welcome";
import { usePageTracking } from "./hooks/use-analytics";

function Router() {
  const { user } = useAuth();
  const { showWelcome, completeWelcome } = useWelcome();
  
  // Track page views for analytics
  usePageTracking();

  // Show welcome screen for authenticated users who haven't seen it
  if (showWelcome && user) {
    return (
      <AnimatedWelcome 
        onComplete={completeWelcome}
        userName={user.firstName}
      />
    );
  }

  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/playdates/:id" component={PlaydateDetailPage} />
      <ProtectedRoute path="/playdates" component={PlaydatesPage} />
      <Route path="/places/:id" component={PlaceDetailsPage} />
      <Route path="/places" component={PlacesPage} />
      <Route path="/events/:id" component={EventDetailsPage} />
      <Route path="/community" component={CommunityPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/create" component={CreatePage} />
      <ProtectedRoute path="/edit-playdate/:id" component={EditPlaydatePage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/chat/:id" component={ChatPage} />
      <ProtectedRoute path="/matches" component={MatchesPage} />
      <ProtectedRoute path="/discover" component={DiscoverPage} />
      <ProtectedRoute path="/dad-days" component={DadDaysPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/settings/delete-account" component={DeleteAccountPage} />
      <ProtectedRoute path="/users/:id" component={UserProfilePage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/about" component={AboutPage} />

      <ProtectedRoute path="/admin" component={AdminDashboardWithProvider} />
      <Route path="/admin-check" component={AdminCheck} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/test-create" component={TestCreatePlaydate} />
      <Route path="/simple-test" component={SimpleTestPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminDashboardWithProvider() {
  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}

function App() {
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    let reloading = false;
    
    // Register service worker for PWA capabilities
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            
            // Force check for updates every time the page loads
            registration.update();
            
            // When a new service worker is waiting, activate it immediately
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New service worker available, activating...');
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch(error => {
            console.log('ServiceWorker registration failed: ', error);
          });
      });
      
      // Listen for controller change and reload the page (only once)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
          reloading = true;
          console.log('Service worker updated, reloading...');
          window.location.reload();
        }
      });
    }

    // Check if privacy consent is already given
    const hasGivenConsent = localStorage.getItem('privacy_consent');
    if (!hasGivenConsent) {
      setShowPrivacyConsent(true);
    }

    // Capture beforeinstallprompt event for PWA installation
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the default prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      
      // Only show the prompt if the user hasn't explicitly installed
      const hasInstalled = localStorage.getItem('pwa_installed');
      if (!hasInstalled) {
        const timer = setTimeout(() => {
          setShowPWAPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa_installed', 'true');
      setShowPWAPrompt(false);
      console.log('PWA successfully installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleAcceptPrivacy = (preferences: any) => {
    localStorage.setItem('privacy_consent', 'true');
    localStorage.setItem('analytics_consent', preferences.analytics.toString());
    localStorage.setItem('marketing_consent', preferences.marketing.toString());
    localStorage.setItem('location_consent', preferences.location.toString());
    setShowPrivacyConsent(false);
  };

  const handleRejectPrivacy = () => {
    localStorage.setItem('privacy_consent', 'false');
    localStorage.setItem('analytics_consent', 'false');
    localStorage.setItem('marketing_consent', 'false');
    localStorage.setItem('location_consent', 'false');
    setShowPrivacyConsent(false);
  };

  const handleDismissPWA = () => {
    setShowPWAPrompt(false);
  };

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          localStorage.setItem('pwa_installed', 'true');
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        // Clear the saved prompt as it can't be used again
        setDeferredPrompt(null);
      });
    } else {
      // If deferredPrompt is not available, iOS or other browser might not support PWA install via prompt
      console.log('PWA installation not supported directly. Setting flag anyway.');
      localStorage.setItem('pwa_installed', 'true');
    }
    setShowPWAPrompt(false);
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppConfigProvider>
        <FirebaseAuthProvider>
          <AuthProvider>
              <ChatProvider>
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
              </ChatProvider>
          </AuthProvider>
        </FirebaseAuthProvider>
        </AppConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
