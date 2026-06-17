import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseEnvKey =
  | "VITE_FIREBASE_API_KEY"
  | "VITE_FIREBASE_AUTH_DOMAIN"
  | "VITE_FIREBASE_PROJECT_ID"
  | "VITE_FIREBASE_APP_ID";

const requiredEnvKeys: FirebaseEnvKey[] = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

function readEnvValue(key: string) {
  const value = import.meta.env[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const missingFirebaseEnvKeys = requiredEnvKeys.filter(
  (key) => !readEnvValue(key)
);

export const isFirebaseConfigured = missingFirebaseEnvKeys.length === 0;

const firebaseConfig: FirebaseOptions | null = isFirebaseConfigured
  ? {
      apiKey: readEnvValue("VITE_FIREBASE_API_KEY"),
      authDomain: readEnvValue("VITE_FIREBASE_AUTH_DOMAIN"),
      projectId: readEnvValue("VITE_FIREBASE_PROJECT_ID"),
      appId: readEnvValue("VITE_FIREBASE_APP_ID"),
      storageBucket: readEnvValue("VITE_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: readEnvValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    }
  : null;

export const firebaseApp: FirebaseApp | null = firebaseConfig
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
