import { lazy, Suspense, useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

// Layout & shell — eagerly loaded (always visible on first render)
import NotFound from "@/pages/not-found";
import AppShell from "./components/layout/app-shell";
import ErrorBoundary from "./components/shared/error-boundary";
import AnimatedWelcome from "./components/welcome/animated-welcome";
import { PrivacyConsentDialog, InstallPWAPrompt } from "./lib/pwa";

// Providers
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { FirebaseAuthProvider } from "./hooks/use-firebase-auth";
import { ChatProvider } from "./hooks/use-chat";
import { AdminProvider } from "./hooks/use-admin";
import { AppConfigProvider } from "./hooks/use-app-config";
import { ProtectedRoute } from "./lib/protected-route";
import { useWelcome } from "./hooks/use-welcome";
import { usePageTracking } from "./hooks/use-analytics";

// Pages — lazy loaded for code splitting
const HomePage           = lazy(() => import("./pages/home"));
const PlaydatesPage      = lazy(() => import("./pages/playdates"));
const PlaydateDetailPage = lazy(() => import("./pages/playdate-detail"));
const PlacesPage         = lazy(() => import("./pages/places"));
const PlaceDetailsPage   = lazy(() => import("./pages/place-details"));
const EventDetailsPage   = lazy(() => import("./pages/event-details"));
const CommunityPage      = lazy(() => import("./pages/community"));
const ProfilePage        = lazy(() => import("./pages/profile"));
const UserProfilePage    = lazy(() => import("./pages/user-profile"));
const DiscoverPage       = lazy(() => import("./pages/discover"));
const CreatePage         = lazy(() => import("./pages/create"));
const EditPlaydatePage   = lazy(() => import("./pages/edit-playdate"));
const ChatPage           = lazy(() => import("./pages/chat"));
const MatchesPage        = lazy(() => import("./pages/matches"));
const DadDaysPage        = lazy(() => import("./pages/dad-days"));
const SettingsPage       = lazy(() => import("./pages/SettingsPage"));
const DeleteAccountPage  = lazy(() => import("./pages/delete-account"));
const AuthPage           = lazy(() => import("./pages/auth-page"));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password"));
const ResetPasswordPage  = lazy(() => import("./pages/reset-password"));
const PrivacyPolicyPage  = lazy(() => import("./pages/privacy-policy"));
const ConfirmEmailChangePage = lazy(() => import("./pages/confirm-email-change"));
const AboutPage          = lazy(() => import("./pages/about"));
const AdminDashboard     = lazy(() => import("./pages/admin"));
const AdminCheck         = lazy(() => import("./pages/admin-check"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AdminDashboardWithProvider() {
  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}

function Router() {
  const { user } = useAuth();
  const { showWelcome, completeWelcome } = useWelcome();

  usePageTracking();

  if (showWelcome && user) {
    return (
      <AnimatedWelcome
        onComplete={completeWelcome}
        userName={user.firstName}
      />
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <ProtectedRoute path="/" component={HomePage} />
        <Route path="/playdates/:id" component={PlaydateDetailPage} />
        <Route path="/playdates" component={PlaydatesPage} />
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
        <Route path="/confirm-email-change" component={ConfirmEmailChangePage} />
        <Route path="/about" component={AboutPage} />
        <ProtectedRoute path="/admin" component={AdminDashboardWithProvider} />
        <Route path="/admin-check" component={AdminCheck} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    let reloading = false;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            registration.update();
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

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
          reloading = true;
          console.log('Service worker updated, reloading...');
          window.location.reload();
        }
      });
    }

    const hasGivenConsent = localStorage.getItem('privacy_consent');
    if (!hasGivenConsent) {
      setShowPrivacyConsent(true);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasInstalled = localStorage.getItem('pwa_installed');
      if (!hasInstalled) {
        const timer = setTimeout(() => {
          setShowPWAPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

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

  const handleDismissPWA = () => setShowPWAPrompt(false);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          localStorage.setItem('pwa_installed', 'true');
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    } else {
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
