import { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import { auth, onAuthChange, signInWithGoogle, signOutUser, handleRedirectResult } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isLoading: boolean;
  isProcessingRedirect: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
    
    handleRedirectResult().then(async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Redirect sign-in completed:", firebaseUser.email);
        try {
          const response = await apiRequest("POST", "/api/firebase-auth", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          if (response.ok) {
            const user = await response.json();
            queryClient.setQueryData(["/api/user"], user);
            toast({
              title: t("auth:signInSuccess", "Sign-in successful"),
              description: t("auth:welcomeMessage", "Welcome back!"),
            });
          }
        } catch (err) {
          console.error("Server auth after redirect failed:", err);
        }
      }
    }).catch((err) => {
      console.error("Redirect result error:", err);
    }).finally(() => {
      setIsProcessingRedirect(false);
    });
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      const user = await signInWithGoogle();
      return user;
    } catch (e) {
      const error = e as Error;
      setError(error);
      toast({
        title: t('auth.errorSigningIn', 'Error signing in'),
        description: error.message,
        variant: 'destructive',
      });
      return null;
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
      const error = e as Error;
      setError(error);
      toast({
        title: t('auth.errorSigningOut', 'Error signing out'),
        description: error.message,
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}