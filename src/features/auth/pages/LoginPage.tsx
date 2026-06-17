import { Cloud, LogIn, Mail, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuthUser } from "../../../shared/auth/useAuthUser";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";
import "../../settings/settings.css";
import "./auth.css";

const sproutSvgIds = {
  pot: "professor-sprout-pot",
  cream: "professor-sprout-cream",
  shadow: "professor-sprout-shadow",
};

function ProfessorSproutMascot() {
  return (
    <figure className="professor-sprout" aria-label="Professor Sprout mascot">
      <svg
        className="professor-sprout-svg"
        viewBox="0 0 420 320"
        role="img"
        aria-labelledby="professor-sprout-title professor-sprout-desc"
      >
        <title id="professor-sprout-title">Professor Sprout</title>
        <desc id="professor-sprout-desc">
          A cheerful terracotta flowerpot with professor glasses growing rainbow
          spoon-shaped flowers.
        </desc>
        <defs>
          <linearGradient id={sproutSvgIds.pot} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#e99a47" />
            <stop offset="100%" stopColor="#b95f25" />
          </linearGradient>
          <linearGradient id={sproutSvgIds.cream} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#fffaf1" />
            <stop offset="100%" stopColor="#eee1ff" />
          </linearGradient>
          <filter id={sproutSvgIds.shadow} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow
              dx="0"
              dy="7"
              floodColor="#5e3f92"
              floodOpacity="0.14"
              stdDeviation="5"
            />
          </filter>
        </defs>

        <rect
          x="24"
          y="18"
          width="372"
          height="278"
          rx="34"
          fill={`url(#${sproutSvgIds.cream})`}
        />
        <circle cx="76" cy="86" r="6" fill="#f3c04f" opacity="0.75" />
        <circle cx="344" cy="96" r="5" fill="#a184c7" opacity="0.55" />
        <path
          d="M58 225c10-18 25-19 34-6"
          fill="none"
          stroke="#7ea348"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d="M344 230c9-17 22-18 31-8"
          fill="none"
          stroke="#7ea348"
          strokeLinecap="round"
          strokeWidth="5"
        />

        <g filter={`url(#${sproutSvgIds.shadow})`}>
          <g stroke="#47772b" strokeLinecap="round" strokeWidth="8">
            <path d="M196 188 C174 145, 139 121, 106 91" />
            <path d="M202 187 C188 136, 176 98, 169 55" />
            <path d="M209 186 C211 133, 211 88, 211 43" />
            <path d="M217 187 C231 135, 249 99, 270 56" />
            <path d="M224 189 C256 144, 286 119, 317 86" />
            <path d="M230 192 C270 160, 318 146, 360 132" />
          </g>

          <g>
            <ellipse
              cx="103"
              cy="88"
              rx="28"
              ry="44"
              fill="#e53935"
              stroke="#a92825"
              strokeWidth="5"
              transform="rotate(-33 103 88)"
            />
            <rect
              x="98"
              y="124"
              width="10"
              height="36"
              rx="5"
              fill="#d62f2c"
              transform="rotate(-33 103 142)"
            />
            <ellipse
              cx="168"
              cy="55"
              rx="28"
              ry="44"
              fill="#fb8c1f"
              stroke="#c76712"
              strokeWidth="5"
              transform="rotate(-16 168 55)"
            />
            <rect
              x="163"
              y="91"
              width="10"
              height="36"
              rx="5"
              fill="#ef7f18"
              transform="rotate(-16 168 109)"
            />
            <ellipse
              cx="211"
              cy="43"
              rx="29"
              ry="46"
              fill="#ffd23f"
              stroke="#d19b15"
              strokeWidth="5"
            />
            <rect x="206" y="80" width="10" height="38" rx="5" fill="#e3b52d" />
            <ellipse
              cx="270"
              cy="56"
              rx="28"
              ry="44"
              fill="#74a944"
              stroke="#4f7b2f"
              strokeWidth="5"
              transform="rotate(17 270 56)"
            />
            <rect
              x="265"
              y="92"
              width="10"
              height="36"
              rx="5"
              fill="#65983a"
              transform="rotate(17 270 110)"
            />
            <ellipse
              cx="318"
              cy="87"
              rx="28"
              ry="44"
              fill="#2f7ed8"
              stroke="#245fa5"
              strokeWidth="5"
              transform="rotate(30 318 87)"
            />
            <rect
              x="313"
              y="123"
              width="10"
              height="36"
              rx="5"
              fill="#2d70be"
              transform="rotate(30 318 141)"
            />
            <ellipse
              cx="360"
              cy="132"
              rx="28"
              ry="44"
              fill="#8d4bd0"
              stroke="#6637a0"
              strokeWidth="5"
              transform="rotate(48 360 132)"
            />
            <rect
              x="355"
              y="168"
              width="10"
              height="36"
              rx="5"
              fill="#7741b6"
              transform="rotate(48 360 186)"
            />
          </g>

          <g fill="#8fbe45" stroke="#5d8b32" strokeWidth="4">
            <ellipse cx="145" cy="166" rx="30" ry="15" transform="rotate(21 145 166)" />
            <ellipse cx="181" cy="137" rx="22" ry="12" transform="rotate(-34 181 137)" />
            <ellipse cx="245" cy="139" rx="22" ry="12" transform="rotate(28 245 139)" />
            <ellipse cx="280" cy="169" rx="33" ry="15" transform="rotate(-21 280 169)" />
            <ellipse cx="218" cy="162" rx="14" ry="28" transform="rotate(8 218 162)" />
            <ellipse cx="116" cy="148" rx="19" ry="10" transform="rotate(-22 116 148)" />
            <ellipse cx="336" cy="154" rx="19" ry="10" transform="rotate(21 336 154)" />
          </g>

          <ellipse cx="213" cy="224" rx="88" ry="20" fill="#6d3a1c" opacity="0.9" />
          <path
            d="M126 208h174l-18 75H144z"
            fill={`url(#${sproutSvgIds.pot})`}
            stroke="#8d451d"
            strokeWidth="5"
          />
          <path
            d="M117 190h192a17 17 0 0 1 17 17v6H100v-6a17 17 0 0 1 17-17z"
            fill="#ed9e47"
            stroke="#8d451d"
            strokeWidth="5"
          />
          <path d="M147 283h132" stroke="#8d451d" strokeLinecap="round" strokeWidth="8" />

          <g stroke="#7b4b1d" strokeWidth="4">
            <circle cx="181" cy="238" r="22" fill="none" />
            <circle cx="245" cy="238" r="22" fill="none" />
            <path d="M203 238h20" />
            <path d="M159 238h-22" />
            <path d="M267 238h22" />
          </g>
          <circle cx="181" cy="239" r="7" fill="#2c2015" />
          <circle cx="245" cy="239" r="7" fill="#2c2015" />
          <circle cx="184" cy="235" r="3" fill="#ffffff" />
          <circle cx="248" cy="235" r="3" fill="#ffffff" />
          <path
            d="M203 259c8 12 22 12 30 0"
            fill="none"
            stroke="#2c2015"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="165" cy="255" r="8" fill="#ef7b58" opacity="0.72" />
          <circle cx="261" cy="255" r="8" fill="#ef7b58" opacity="0.72" />
        </g>

        <g transform="translate(60 248)">
          <path
            d="M0 18c22-12 44-12 66 0v35c-22-12-44-12-66 0z"
            fill="#fff2cc"
            stroke="#b58d47"
            strokeWidth="3"
          />
          <path
            d="M66 18c22-12 44-12 66 0v35c-22-12-44-12-66 0z"
            fill="#fff7df"
            stroke="#b58d47"
            strokeWidth="3"
          />
          <path d="M66 18v37" stroke="#b58d47" strokeWidth="3" />
          <path d="M86 31h25M86 42h20" stroke="#d3ba81" strokeLinecap="round" strokeWidth="3" />
          <path
            d="M34 39c6-16 18-16 25 0m-13-21v30"
            fill="none"
            stroke="#7ea348"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </g>

        <g transform="translate(235 282) rotate(-8)">
          <rect x="0" y="0" width="86" height="12" rx="6" fill="#345c2d" />
          <rect x="66" y="0" width="12" height="12" fill="#f0c45c" />
          <path d="M86 6l14-6v12z" fill="#d5b06e" />
          <path d="M100 0l8 6-8 6z" fill="#4a3324" />
        </g>
      </svg>
      <figcaption>Professor Sprout</figcaption>
    </figure>
  );
}

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
        <ProfessorSproutMascot />
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
