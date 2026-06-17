import { LogIn, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthUser } from "../../shared/auth/useAuthUser";

export function TopBar() {
  const { user, isConfigured, signOut } = useAuthUser();
  const accountLabel = user?.displayName ?? user?.email ?? "Signed in";

  return (
    <header className="app-header">
      <div>
        <h1>
          <span className="ssg-emoji" aria-hidden="true">
            🌸
          </span>{" "}
          Scholarly Spoon Garden 2.0
        </h1>
        <p>Academic life, gently organized.</p>
      </div>

      <div className="app-account-actions" aria-label="Account status">
        <span className="pill">{isConfigured ? "Local + cloud ready" : "Local-only"}</span>
        {user ? (
          <>
            <span className="app-account-name">{accountLabel}</span>
            <button className="text-button app-account-button" type="button" onClick={signOut}>
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </>
        ) : (
          <Link className="text-button app-account-button" to="/login">
            <LogIn size={15} aria-hidden="true" /> Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
