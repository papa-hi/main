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
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
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

// Google sign in with popup
export async function signInWithGoogle() {
  try {
    // Log configuration for debugging
    console.log("Using Firebase with:", {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "API key is set" : "API key is missing",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "Project ID is missing",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "App ID is missing"
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign in successful:", result.user.displayName);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Provide more specific error messaging
    if (error.code === 'auth/configuration-not-found') {
      console.error("AUTH SETUP REQUIRED: You need to enable Google authentication in the Firebase console for this project.");
      console.error("Please make sure that:");
      console.error("1. Google Sign-In is enabled in Firebase Console > Authentication > Sign-in methods");
      console.error("2. The current domain is added to authorized domains in Firebase Console");
      console.error("3. The Firebase API key, Project ID, and App ID are correctly set as environment variables");
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
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
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