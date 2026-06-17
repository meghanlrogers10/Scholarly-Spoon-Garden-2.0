import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  useCallback,
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

function getFriendlyAuthError(authError: unknown, fallback: string) {
  const code =
    typeof authError === "object" &&
    authError !== null &&
    "code" in authError &&
    typeof authError.code === "string"
      ? authError.code
      : "";

  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "That email and password did not match an account.";
  }

  if (code === "auth/user-not-found") {
    return "No account was found for that email.";
  }

  if (code === "auth/email-already-in-use") {
    return "An account already exists for that email. Try signing in instead.";
  }

  if (code === "auth/weak-password") {
    return "Please use a password with at least 6 characters.";
  }

  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was closed before it finished.";
  }

  if (code === "auth/operation-not-allowed") {
    return "This sign-in method is not enabled yet in Firebase Console.";
  }

  return authError instanceof Error ? authError.message : fallback;
}

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

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) {
      setError("Firebase is not configured for this app build.");
      return false;
    }

    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (authError) {
      setError(
        getFriendlyAuthError(authError, "Email sign-in did not complete.")
      );
      return false;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) {
      setError("Firebase is not configured for this app build.");
      return false;
    }

    setError(null);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (authError) {
      setError(
        getFriendlyAuthError(authError, "Account creation did not complete.")
      );
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
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
        getFriendlyAuthError(authError, "Google sign-in did not complete.")
      );
    }
  }, []);

  const signOut = useCallback(async () => {
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
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      missingConfigKeys: missingFirebaseEnvKeys,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [
      clearError,
      error,
      loading,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      signUpWithEmail,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
