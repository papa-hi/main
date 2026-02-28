import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { onAuthChange, signInWithGoogle, signOutUser } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      const user = await signInWithGoogle();

      if (user) {
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
          toast({
            title: t('auth.signInSuccess', 'Sign-in successful'),
            description: t('auth.welcomeMessage', 'Welcome back!'),
          });
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
          throw new Error(errorData.error || errorData.message || 'Server authentication failed');
        }
      }

      return user;
    } catch (e) {
      const err = e as Error;
      setError(err);
      toast({
        title: t('auth.errorSigningIn', 'Error signing in'),
        description: err.message,
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
