import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

const authDomain = (() => {
  if (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) {
    return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.hostname;
  }
  return `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`;
})();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: "000000000000"
};

console.log("[Firebase] Using authDomain:", authDomain);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function signInWithGoogle(): Promise<FirebaseUser> {
  console.log("Starting Google sign-in popup...");
  const result = await signInWithPopup(auth, googleProvider);
  console.log("Google sign in successful:", result.user.displayName);
  return result.user;
}

export function signOutUser() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
