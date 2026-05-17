import { NavLink } from "react-router-dom";
import { BookOpen, GraduationCap, Home, Sprout } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/research", label: "Research", icon: BookOpen },
  { to: "/teaching", label: "Teaching", icon: GraduationCap },
  { to: "/service", label: "Service", icon: Sprout },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">🥄</div>
        <div>
          <h1>Scholarly Spoon Garden 2.0</h1>
          <p>Academic life, gently organized.</p>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink key={item.to} to={item.to} className="nav-link">
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}