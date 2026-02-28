import { createContext, useState, useEffect, useContext, useRef, type ReactNode } from 'react';
import { onAuthChange, signInWithGoogle, signOutUser, handleRedirectResult } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isLoading: boolean;
  isProcessingRedirect: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const RedirectStateContext = createContext<boolean>(true);

async function authenticateWithServer(user: FirebaseUser) {
  const idToken = await user.getIdToken(true);
  const response = await apiRequest("POST", "/api/firebase-auth", {
    idToken,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    uid: user.uid,
  });

  if (response.ok) {
    const serverUser = await response.json();
    queryClient.setQueryData(["/api/user"], serverUser);
    return serverUser;
  } else {
    const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(errorData.error || errorData.message || 'Server authentication failed');
  }
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const redirectHandled = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (redirectHandled.current) return;
    redirectHandled.current = true;

    handleRedirectResult()
      .then(async (firebaseUser) => {
        if (firebaseUser) {
          console.log("[Firebase Auth] Redirect completed for:", firebaseUser.email);
          try {
            await authenticateWithServer(firebaseUser);
            toast({
              title: t('auth.signInSuccess', 'Sign-in successful'),
              description: t('auth.welcomeMessage', 'Welcome back!'),
            });
          } catch (err) {
            console.error("[Firebase Auth] Server auth failed:", err);
            toast({
              title: t('auth.errorSigningIn', 'Error signing in'),
              description: err instanceof Error ? err.message : 'Authentication failed',
              variant: 'destructive',
            });
          }
        }
      })
      .catch((err) => {
        console.error("[Firebase Auth] Redirect result error:", err);
      })
      .finally(() => {
        setIsProcessingRedirect(false);
      });
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast({
        title: t('auth.errorSigningIn', 'Error signing in'),
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast({
        title: t('auth.signedOut', 'Signed out'),
        description: t('auth.signedOutSuccess', 'You have been signed out successfully'),
      });
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast({
        title: t('auth.errorSigningOut', 'Error signing out'),
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const value = {
    currentUser,
    isLoading,
    isProcessingRedirect,
    error,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      <RedirectStateContext.Provider value={isProcessingRedirect}>
        {children}
      </RedirectStateContext.Provider>
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

export function useIsProcessingRedirect() {
  return useContext(RedirectStateContext);
}
