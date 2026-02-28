import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signInWithPopup, 
  getRedirectResult, 
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: "000000000000"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Track popup attempts to decide when to fall back to redirect
let popupAttempts = 0;

// Google sign in - tries popup, falls back to redirect after repeated failures
export async function signInWithGoogle() {
  try {
    console.log("Using Firebase with:", {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "API key is set" : "API key is missing",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "Project ID is missing",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "App ID is missing",
      authDomain: firebaseConfig.authDomain
    });

    // After 2 failed popup attempts, go straight to redirect
    if (popupAttempts >= 2) {
      console.log("Multiple popup failures, using redirect sign-in...");
      signInWithRedirect(auth, googleProvider);
      return null;
    }

    try {
      popupAttempts++;
      const result = await signInWithPopup(auth, googleProvider);
      popupAttempts = 0;
      console.log("Google sign in successful (popup):", result.user.displayName);
      return result.user;
    } catch (popupError: any) {
      console.error("Popup sign-in error:", popupError.code, popupError.message);
      
      if (popupError.code === 'auth/popup-blocked') {
        console.log("Popup blocked by browser, falling back to redirect...");
        signInWithRedirect(auth, googleProvider);
        return null;
      }

      if (popupError.code === 'auth/popup-closed-by-user' || 
          popupError.code === 'auth/cancelled-popup-request') {
        throw popupError;
      }

      throw popupError;
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    if (error.code === 'auth/configuration-not-found') {
      console.error("AUTH SETUP REQUIRED: Enable Google authentication in Firebase Console.");
      console.error("Also verify that your current domain is in Firebase's authorized domains list.");
    }
    
    throw error;
  }
}

// Google sign in with redirect (better for mobile)
export function signInWithGoogleRedirect() {
  signInWithRedirect(auth, googleProvider);
}

// Handle redirect result
export async function handleRedirectResult() {
  try {
    console.log("Checking for redirect sign-in result...");
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Redirect result found for user:", result.user.email);
      return result.user;
    }
    console.log("No redirect result found");
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
}

// Sign out
export function signOutUser() {
  return signOut(auth);
}

// Monitor auth state
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };