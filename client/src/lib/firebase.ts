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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: "000000000000"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function signInWithGoogle() {
  console.log("Using Firebase with:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "API key is set" : "API key is missing",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "Project ID is missing",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "App ID is missing",
    authDomain: firebaseConfig.authDomain
  });

  console.log("Starting Google sign-in via redirect...");
  await signInWithRedirect(auth, googleProvider);
  return null;
}

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

export function signOutUser() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
