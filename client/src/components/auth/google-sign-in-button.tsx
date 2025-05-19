import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function GoogleSignInButton({ onSuccess, className = "" }: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useFirebaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  async function handleSignIn() {
    try {
      setIsLoading(true);
      
      // Display Firebase configuration for debugging
      console.log("Using Firebase config:", {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Set" : "Not set",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "Set" : "Not set",
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Set" : "Not set"
      });
      
      // Show a message to the user about the configuration status
      toast({
        title: "Google Sign-In",
        description: "Attempting to sign in with Google...",
        variant: "default"
      });
      
      // Attempt Google sign-in with fallback to email/password authentication
      const firebaseUser = await signInWithGoogle().catch((error) => {
        console.error("Google sign-in error:", error);
        // Provide better error message to user
        if (error.code === 'auth/configuration-not-found') {
          toast({
            title: "Authentication Setup Required",
            description: "Google Sign-in is not configured in Firebase. Please contact the administrator or use email/password login.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Google Sign-in Failed",
            description: error.message || "Could not sign in with Google. Please try again or use email/password login.",
            variant: "destructive"
          });
        }
        return null;
      });
      
      if (firebaseUser) {
        console.log("Firebase user authenticated:", firebaseUser.email);
        // Send Firebase user data to our server to authenticate in our system
        try {
          console.log("Sending data to server:", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          
          const response = await apiRequest("POST", "/api/firebase-auth", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          
          console.log("Server response status:", response.status);
          
          if (response.ok) {
            // Successfully authenticated with our server
            const user = await response.json();
            console.log("User authenticated with server:", user);
            // Update the user data in the cache
            queryClient.setQueryData(["/api/user"], user);
            
            toast({
              title: t("auth:signInSuccess", "Sign-in successful"),
              description: t("auth:welcomeMessage", "Welcome back!"),
              variant: "default"
            });
            
            if (onSuccess) {
              onSuccess();
            }
          } else {
            // Handle server authentication error
            let errorDetails = "Unknown error";
            try {
              const errorData = await response.json();
              errorDetails = errorData.error || "Unknown error";
              console.error("Server authentication error:", errorData);
            } catch (e) {
              console.error("Could not parse error response:", e);
            }
            
            toast({
              title: t("auth:googleAuthError", "Google authentication error"),
              description: errorDetails,
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Server authentication error:", error);
          toast({
            title: t("auth:serverError", "Server error"),
            description: t("auth:serverAuthError", "Could not authenticate with the server"),
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: t("auth:googleSignInError", "Google sign-in error"),
        description: error instanceof Error ? error.message : t("auth:unknownError", "An unknown error occurred"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      onClick={handleSignIn}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{isLoading ? t('auth.signingIn', 'Signing in...') : t('auth.continueWithGoogle', 'Continue with Google')}</span>
    </Button>
  );
}