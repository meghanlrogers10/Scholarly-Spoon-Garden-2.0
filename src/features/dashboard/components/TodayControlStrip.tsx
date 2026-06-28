import type {
  DailyCheckIn,
  PlannedTaskBlock,
  PlanningMode,
} from "../../../shared/types/planning";
import { Button } from "../../../shared/ui/Button";
import {
  getDayPlannedMinutes,
  getDayRemainingMinutes,
  getWorkingBlockCapacityMinutes,
} from "../utils/plannedTaskBlocks";
import { formatWorkingBlockDuration } from "../utils/workingBlockCalendar";

type TodayControlStripProps = {
  checkIn?: DailyCheckIn;
  plannedBlocks: PlannedTaskBlock[];
  onModeChange: (mode: PlanningMode) => void;
  onOpenDailyPlan: () => void;
  onGenerateSuggestions: () => void;
  onLogWork: () => void;
  onShutdown: () => void;
};

const planningModeOptions: PlanningMode[] = [
  "balanced",
  "research-push",
  "teaching-survival",
  "service-triage",
  "low-energy",
  "deadline-emergency",
  "small-task-cleanup",
];

const planningModeLabels: Record<PlanningMode, string> = {
  balanced: "Balanced",
  "research-push": "Research push",
  "teaching-survival": "Teaching survival",
  "service-triage": "Service triage",
  "low-energy": "Low-energy mode",
  "deadline-emergency": "Deadline emergency",
  "small-task-cleanup": "Small-task cleanup",
};

export function TodayControlStrip({
  checkIn,
  plannedBlocks,
  onModeChange,
  onOpenDailyPlan,
  onGenerateSuggestions,
  onLogWork,
  onShutdown,
}: TodayControlStripProps) {
  const workingBlocks = checkIn?.workingBlocks ?? [];
  const availableMinutes = workingBlocks.reduce(
    (totalMinutes, block) => totalMinutes + getWorkingBlockCapacityMinutes(block),
    0,
  );
  const plannedMinutes = getDayPlannedMinutes(plannedBlocks);
  const remainingMinutes = checkIn
    ? getDayRemainingMinutes(workingBlocks, plannedBlocks)
    : 0;
  const overplannedMinutes = Math.max(Math.abs(Math.min(remainingMinutes, 0)), 0);

  return (
    <section className="today-control-strip" aria-label="Today controls">
      <label className="today-control-mode">
        <span>Mode</span>
        <select
          value={checkIn?.planningMode ?? "balanced"}
          onChange={(event) => onModeChange(event.target.value as PlanningMode)}
        >
          {planningModeOptions.map((mode) => (
            <option key={mode} value={mode}>
              {planningModeLabels[mode]}
            </option>
          ))}
        </select>
      </label>

      <div className="today-control-metrics">
        <span>
          <strong>{checkIn?.availableSpoons ?? "?"}</strong>
          spoons
        </span>
        <span>
          <strong>{formatWorkingBlockDuration(availableMinutes)}</strong>
          available
        </span>
        <span>
          <strong>{formatWorkingBlockDuration(plannedMinutes)}</strong>
          planned
        </span>
        <span className={overplannedMinutes > 0 ? "is-overplanned" : ""}>
          <strong>
            {overplannedMinutes > 0
              ? formatWorkingBlockDuration(overplannedMinutes)
              : formatWorkingBlockDuration(Math.max(remainingMinutes, 0))}
          </strong>
          {overplannedMinutes > 0 ? "over" : "open"}
        </span>
        <span>
          <strong>{workingBlocks.length}</strong>
          blocks
        </span>
        <span>
          <strong>{plannedBlocks.length}</strong>
          planned
        </span>
      </div>

      <div className="today-control-actions">
        <Button type="button" onClick={onOpenDailyPlan}>
          Open Daily Plan
        </Button>
        <Button type="button" variant="soft" onClick={onGenerateSuggestions}>
          Generate Suggestions
        </Button>
        <Button type="button" variant="soft" onClick={onLogWork}>
          Log Work
        </Button>
        <Button type="button" variant="soft" onClick={onShutdown}>
          Shutdown
        </Button>
      </div>
    </section>
  );
}
