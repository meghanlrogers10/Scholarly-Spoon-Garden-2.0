import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", emoji: "🏡", label: "Dashboard" },
  { to: "/research", emoji: "📚", label: "Research" },
  { to: "/teaching", emoji: "🎓", label: "Teaching" },
  { to: "/service", emoji: "🌱", label: "Service" },
  { to: "/mindspace", emoji: "🧠", label: "Mindspace" },
  { to: "/timer-log", emoji: "🌸", label: "Focus Bloom Log" },
  { to: "/settings", emoji: "⚙️", label: "Settings" },
];

export function GlobalNav() {
  return (
    <div className="global-nav-shell">
      <nav className="global-nav-container" aria-label="Main navigation">
        <NavLink to="/dashboard" className="global-nav-brand">
          <span className="ssg-emoji" aria-hidden="true">
            🥄
          </span>{" "}
          Scholarly Spoon Garden 2.0
        </NavLink>

        <div className="global-nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive
                  ? "global-nav-link global-nav-link-active"
                  : "global-nav-link"
              }
            >
              <span className="ssg-emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
