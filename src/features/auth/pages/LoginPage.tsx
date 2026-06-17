import { Cloud, LogIn, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthUser } from "../../../shared/auth/useAuthUser";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";
import "../../settings/settings.css";
import "./auth.css";

export function LoginPage() {
  const {
    user,
    loading,
    isConfigured,
    missingConfigKeys,
    error,
    signInWithGoogle,
    signOut,
  } = useAuthUser();

  return (
    <section className="page-stack auth-page">
      <PageHeader
        eyebrow="Account"
        title="Cloud foundation"
        description="Sign in is optional. Scholarly Spoon Garden stays usable in local mode, and cloud sync does not start until a future sync pass explicitly enables it."
      />

      <div className="settings-back-row">
        <Link className="text-button" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>

      <Card className="auth-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Firebase Auth</p>
            <h2>{user ? "Signed in" : "Optional sign-in"}</h2>
          </div>
          <span className="pill">{isConfigured ? "Configured" : "Local-only"}</span>
        </div>

        <div className="auth-status-box">
          <Cloud size={20} aria-hidden="true" />
          <p>
            Local mode still works. Cloud sync is not active yet, and a backup is
            recommended before the first real sync.
          </p>
        </div>

        {!isConfigured ? (
          <p className="settings-backup-status is-warning">
            Firebase is not configured for this build. Add the Vite Firebase
            environment variables to enable Google sign-in. Missing:{" "}
            {missingConfigKeys.join(", ")}.
          </p>
        ) : null}

        {user ? (
          <div className="auth-user-panel">
            <div>
              <p className="eyebrow">Current user</p>
              <h3>{user.displayName ?? user.email ?? "Signed-in user"}</h3>
              {user.email ? <p className="muted-text">{user.email}</p> : null}
            </div>
            <Button type="button" variant="soft" onClick={signOut}>
              <LogOut size={16} aria-hidden="true" /> Sign out
            </Button>
          </div>
        ) : (
          <div className="auth-actions">
            <Button
              type="button"
              onClick={signInWithGoogle}
              disabled={!isConfigured || loading}
            >
              <LogIn size={16} aria-hidden="true" /> Sign in with Google
            </Button>
          </div>
        )}

        {error ? <p className="settings-backup-status is-error">{error}</p> : null}
      </Card>
    </section>
  );
}
