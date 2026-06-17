import type { ResearchFocusLevel } from "../types";

type ResearchFocusBadgeProps = {
  focusLevel: ResearchFocusLevel;
};

const labels: Record<ResearchFocusLevel, string> = {
  primary: "Primary focus",
  secondary: "Secondary",
  paused: "Paused",
};

export function ResearchFocusBadge({ focusLevel }: ResearchFocusBadgeProps) {
  return (
    <span className={`research-focus-badge research-focus-badge--${focusLevel}`}>
      {labels[focusLevel]}
    </span>
  );
}
