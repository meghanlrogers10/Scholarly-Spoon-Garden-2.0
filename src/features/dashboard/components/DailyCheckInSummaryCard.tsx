import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import type {
  DailyCheckIn,
  PlannedTaskBlock,
  PlanningMode,
} from "../../../shared/types/planning";
import type { TimerSession } from "../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../shared/types/workLog";
import { getManualWorkDurationMinutes } from "../utils/actualWorkPlanning";
import {
  formatWorkingBlockDuration,
  formatWorkingBlockTimeRange,
  getNextUpcomingWorkingBlock,
  getWorkingBlockDurationMinutes,
} from "../utils/workingBlockCalendar";
import {
  getDayPlannedMinutes,
  getDayRemainingMinutes,
} from "../utils/plannedTaskBlocks";

type DailyCheckInSummaryCardProps = {
  checkIn?: DailyCheckIn;
  plannedBlocks: PlannedTaskBlock[];
  timerSessions: TimerSession[];
  manualWorkLogs: ManualWorkLogEntry[];
  onEdit: () => void;
};

const planningModeLabels: Record<PlanningMode, string> = {
  balanced: "Balanced",
  "research-push": "Research push",
  "teaching-survival": "Teaching survival",
  "service-triage": "Service triage",
  "low-energy": "Low-energy mode",
  "deadline-emergency": "Deadline emergency",
  "small-task-cleanup": "Small-task cleanup",
};

function getBlockDurationMinutes(checkIn: DailyCheckIn) {
  return checkIn.workingBlocks.reduce((totalMinutes, block) => {
    return totalMinutes + getWorkingBlockDurationMinutes(block);
  }, 0);
}

export function DailyCheckInSummaryCard({
  checkIn,
  plannedBlocks,
  timerSessions,
  manualWorkLogs,
  onEdit,
}: DailyCheckInSummaryCardProps) {
  const totalBlockMinutes = checkIn ? getBlockDurationMinutes(checkIn) : 0;
  const nextBlock = checkIn
    ? getNextUpcomingWorkingBlock(checkIn.workingBlocks)
    : undefined;
  const plannedMinutes = getDayPlannedMinutes(plannedBlocks);
  const remainingMinutes = checkIn
    ? getDayRemainingMinutes(checkIn.workingBlocks, plannedBlocks)
    : 0;
  const workingBlockIds = new Set(
    checkIn?.workingBlocks.map((block) => block.id) ?? [],
  );
  const actualMinutes =
    timerSessions.reduce((totalMinutes, session) => {
      if (!session.workingBlockId || !workingBlockIds.has(session.workingBlockId)) {
        return totalMinutes;
      }

      return totalMinutes + Math.round(session.durationSeconds / 60);
    }, 0) +
    manualWorkLogs.reduce((totalMinutes, entry) => {
      if (!entry.workingBlockId || !workingBlockIds.has(entry.workingBlockId)) {
        return totalMinutes;
      }

      return totalMinutes + getManualWorkDurationMinutes(entry);
    }, 0);

  return (
    <Card className="daily-check-in-summary-card">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Today map</p>
          <h2>Daily Check-In</h2>
        </div>
        <Button variant="soft" onClick={onEdit}>
          {checkIn ? "Edit Today Check-In" : "Rebuild Today"}
        </Button>
      </div>

      {checkIn ? (
        <>
          <p className="daily-check-in-summary-line">
            Today: {checkIn.availableSpoons} spoons ·{" "}
            {planningModeLabels[checkIn.planningMode]} ·{" "}
            {checkIn.workingBlocks.length} blocks
            {totalBlockMinutes > 0
              ? ` · ${formatWorkingBlockDuration(totalBlockMinutes)} available`
              : ""}
            {plannedBlocks.length > 0
              ? ` · ${formatWorkingBlockDuration(plannedMinutes)} planned · ${formatWorkingBlockDuration(Math.max(remainingMinutes, 0))} open · ${plannedBlocks.length} planned tasks`
              : ""}
            {actualMinutes > 0
              ? ` · ${formatWorkingBlockDuration(actualMinutes)} actual`
              : ""}
            {nextBlock
              ? ` · next block ${formatWorkingBlockTimeRange(nextBlock)}`
              : ""}
            {checkIn.hardStopTime ? ` · hard stop ${checkIn.hardStopTime}` : ""}
          </p>

          {checkIn.protectNotes ? (
            <p className="muted-text">
              <strong>Protect:</strong> {checkIn.protectNotes}
            </p>
          ) : null}

          {checkIn.avoidNotes ? (
            <p className="muted-text">
              <strong>Avoid:</strong> {checkIn.avoidNotes}
            </p>
          ) : null}
        </>
      ) : (
        <p className="muted-text">
          No map saved for today yet. Start with spoons, time windows, and what
          needs guarding.
        </p>
      )}
    </Card>
  );
}
