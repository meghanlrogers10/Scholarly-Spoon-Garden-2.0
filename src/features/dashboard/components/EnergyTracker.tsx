import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import { Card } from "../../../shared/ui/Card";

const MAX_SPOONS = 5;

const rainbowClasses = [
  "spoon-red",
  "spoon-orange",
  "spoon-yellow",
  "spoon-green",
  "spoon-blue",
];

function getEnergyLabel(spoons: number) {
  if (spoons <= 1) return "Bare minimum mode";
  if (spoons === 2) return "Low energy";
  if (spoons === 3) return "Steady enough";
  if (spoons === 4) return "Good working energy";
  return "High energy";
}

export function EnergyTracker() {
  const [availableSpoons, setAvailableSpoons] = useLocalStorage<number>(
    "ssg2.availableSpoons",
    3,
  );

  const safeAvailableSpoons = Math.min(
    Math.max(availableSpoons, 1),
    MAX_SPOONS,
  );

  return (
    <Card className="energy-tracker-card">
      <div className="energy-tracker-header">
        <div>
          <p className="eyebrow">Energy check</p>
          <h2>How many spoons do you have?</h2>
        </div>

        <div className="energy-tracker-count">
          <strong>{safeAvailableSpoons}</strong>
          <span>/ {MAX_SPOONS}</span>
        </div>
      </div>

      <div className="rainbow-spoon-meter" aria-label="Available spoons">
        {Array.from({ length: MAX_SPOONS }, (_, index) => {
          const spoonNumber = index + 1;
          const isActive = spoonNumber <= safeAvailableSpoons;
          const rainbowClass = rainbowClasses[index % rainbowClasses.length];

          return (
            <button
              key={spoonNumber}
              type="button"
              className={[
                "rainbow-spoon",
                rainbowClass,
                isActive ? "is-active" : "",
              ].join(" ")}
              aria-label={`Set available spoons to ${spoonNumber}`}
              aria-pressed={isActive}
              onClick={() => setAvailableSpoons(spoonNumber)}
            >
              <span aria-hidden="true">🥄</span>
            </button>
          );
        })}
      </div>

      <div className="energy-tracker-footer">
        <span>{getEnergyLabel(safeAvailableSpoons)}</span>
        <small>Pick honestly. The app should meet you where you are.</small>
      </div>
    </Card>
  );
}