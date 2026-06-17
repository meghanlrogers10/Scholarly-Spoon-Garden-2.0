import type { ReactNode } from "react";
import { FloatingTimerButton } from "../../features/timer/components/FloatingTimerButton";
import { useAppSettings } from "../../shared/hooks/useAppSettings";
import { GlobalNav } from "./GlobalNav";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { settings } = useAppSettings();
  const settingsClassNames = [
    settings.textSize === "large" ? "ssg-text-large" : "",
    settings.textSize === "extra-large" ? "ssg-text-extra-large" : "",
    settings.layoutDensity === "compact" ? "ssg-density-compact" : "",
    settings.layoutDensity === "spacious" ? "ssg-density-spacious" : "",
    settings.calendarDensity === "compact" ? "ssg-calendar-compact" : "",
    settings.reducedMotion ? "ssg-reduced-motion" : "",
    settings.highContrast ? "ssg-high-contrast" : "",
    settings.fewerEmojis ? "ssg-fewer-emojis" : "",
    settings.calmMode ? "ssg-calm-mode" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["app-shell", settingsClassNames].filter(Boolean).join(" ")}>
      <GlobalNav />
      <TopBar />
      <main className="page-content">{children}</main>
      <FloatingTimerButton />
    </div>
  );
}
