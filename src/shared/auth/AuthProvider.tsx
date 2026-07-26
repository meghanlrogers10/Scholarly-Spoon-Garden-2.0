import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
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

  if (code === "auth/popup-blocked") {
    return "The browser blocked the Google sign-in popup. Try Google sign-in again; this build now uses a redirect instead of a popup.";
  }

  if (code === "auth/operation-not-allowed") {
    return "This sign-in method is not enabled yet in Firebase Console.";
  }

  if (code === "auth/unauthorized-domain") {
    const hostname =
      typeof window === "undefined" ? "this domain" : window.location.hostname;
    return `Firebase does not authorize ${hostname} for OAuth sign-in. Add it under Firebase Console > Authentication > Settings > Authorized domains.`;
  }

  if (code === "auth/invalid-api-key") {
    return "The deployed Firebase API key is invalid. Check the Netlify Firebase environment variables.";
  }

  if (code === "auth/network-request-failed") {
    return "Firebase sign-in could not reach the network. Check your connection and try again.";
  }

  if (code === "auth/too-many-requests") {
    return "Firebase temporarily blocked sign-in attempts. Wait a little while and try again.";
  }

  return authError instanceof Error ? authError.message : fallback;
}

function getUnsupportedGoogleSignInHostMessage() {
  if (typeof window === "undefined") {
    return null;
  }

  const { hostname, protocol } = window.location;

  if (protocol === "file:") {
    return "Google sign-in cannot run from a downloaded file. Open the deployed app in your browser, or use email/password sign-in for this local copy.";
  }

  if (protocol !== "http:" && protocol !== "https:") {
    return "Google sign-in needs an http or https app address. Open the deployed app in your browser, or use email/password sign-in for this local copy.";
  }

  if (!hostname) {
    return "Google sign-in cannot validate this app address. Open the deployed app in your browser, or use email/password sign-in for this local copy.";
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }

    getRedirectResult(auth).catch((authError: unknown) => {
      setError(
        getFriendlyAuthError(authError, "Google sign-in did not complete.")
      );
      setLoading(false);
    });

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

    const unsupportedHostMessage = getUnsupportedGoogleSignInHostMessage();
    if (unsupportedHostMessage) {
      setError(unsupportedHostMessage);
      return;
    }

    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithRedirect(auth, provider);
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
