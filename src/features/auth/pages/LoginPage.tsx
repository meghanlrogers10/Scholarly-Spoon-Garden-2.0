import { Cloud, LogIn, Mail, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuthUser } from "../../../shared/auth/useAuthUser";
import { DrSpoonbloomMascot } from "../../../shared/brand/DrSpoonbloomMascot";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";
import "../../settings/settings.css";
import "./auth.css";

export function LoginPage() {
  const {
    loading,
    isConfigured,
    missingConfigKeys,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    clearError,
  } = useAuthUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState<"signin" | "signup" | null>(
    null,
  );

  const authDisabled = !isConfigured || loading || submitting !== null;

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting("signin");
    await signInWithEmail(email.trim(), password);
    setSubmitting(null);
  }

  async function handleSignUp() {
    setSubmitting("signup");
    await signUpWithEmail(email.trim(), password);
    setSubmitting(null);
  }

  async function handleGoogleSignIn() {
    setSubmitting("signin");
    await signInWithGoogle();
    setSubmitting(null);
  }

  return (
    <section className="page-stack auth-page">
      <div className="auth-hero">
        <DrSpoonbloomMascot
          caption="Professor Sprout"
          displayName="Professor Sprout"
          size="hero"
        />
        <PageHeader
          className="auth-hero-copy"
          eyebrow="Professor Sprout says hello"
          title="Scholarly Spoon Garden"
          description="A reality-based planning system for academic brains with limited spoons."
        />
        <p className="auth-helper-line">
          Work gently. Finish honestly. Publish when you can.
        </p>
      </div>

      <Card className="auth-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Account</p>
            <h2>Welcome back</h2>
          </div>
          <span className="pill">{isConfigured ? "Configured" : "Local-only"}</span>
        </div>

        <div className="auth-status-box">
          <Cloud size={20} aria-hidden="true" />
          <p>
            Cloud Save stays off until you enable it in Settings. Signing in only
            chooses the account your workspace belongs to.
          </p>
        </div>

        {!isConfigured ? (
          <p className="settings-backup-status is-warning">
            Firebase is not configured for this build. Add the Vite Firebase
            environment variables to enable sign-in. Missing:{" "}
            {missingConfigKeys.join(", ")}.
          </p>
        ) : null}

        <form className="auth-form" onSubmit={handleEmailSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                clearError();
                setEmail(event.target.value);
              }}
              disabled={authDisabled}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                clearError();
                setPassword(event.target.value);
              }}
              disabled={authDisabled}
              minLength={6}
              required
            />
          </label>

          <div className="auth-actions">
            <Button type="submit" disabled={authDisabled}>
              <LogIn size={16} aria-hidden="true" />{" "}
              {submitting === "signin" ? "Signing in..." : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="soft"
              onClick={handleSignUp}
              disabled={authDisabled || !email.trim() || password.length < 6}
            >
              <UserPlus size={16} aria-hidden="true" />{" "}
              {submitting === "signup" ? "Creating..." : "Create account"}
            </Button>
          </div>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-actions">
          <Button
            type="button"
            variant="soft"
            onClick={handleGoogleSignIn}
            disabled={authDisabled}
          >
            <Mail size={16} aria-hidden="true" /> Sign in with Google
          </Button>
        </div>

        {error ? <p className="settings-backup-status is-error">{error}</p> : null}
      </Card>
    </section>
  );
}
