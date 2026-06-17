import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  auth,
  isFirebaseConfigured,
  missingFirebaseEnvKeys,
} from "../firebase/firebaseClient";
import { AuthContext, type AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      },
      (authError) => {
        setError(authError.message);
        setLoading(false);
      }
    );
  }, []);

  async function signInWithGoogle() {
    if (!auth) {
      setError("Firebase is not configured for this app build.");
      return;
    }

    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithPopup(auth, provider);
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Google sign-in did not complete."
      );
    }
  }

  async function signOut() {
    if (!auth) {
      setUser(null);
      return;
    }

    setError(null);

    try {
      await firebaseSignOut(auth);
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Sign out did not complete."
      );
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      missingConfigKeys: missingFirebaseEnvKeys,
      error,
      signInWithGoogle,
      signOut,
      clearError: () => setError(null),
    }),
    [error, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
