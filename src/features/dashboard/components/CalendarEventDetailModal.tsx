import type {
  CalendarItem,
  CalendarSource,
} from "../../../shared/types/calendar";
import type { EstimateAccuracy, TimerMood } from "../../../shared/types/timer";
import { Button } from "../../../shared/ui/Button";

type CalendarEventDetailModalProps = {
  item: CalendarItem | null;
  onClose: () => void;
  onDeleteItem?: (item: CalendarItem) => void;
  onEditTask?: (item: CalendarItem) => void;
  onRemovePlannedTask?: (item: CalendarItem) => void;
  onMarkTaskDone?: (item: CalendarItem) => void;
  onEditWorkingBlocks?: () => void;
};

const moodIconMap: Record<TimerMood, string> = {
  overwhelmed: "😫",
  meh: "😐",
  satisfied: "🙂",
  proud: "😄",
  energized: "🚀",
};

const sourceIconMap: Record<CalendarSource, string> = {
  timed: "⏱️",
  pomodoro: "🍅",
  manual: "✍️",
  task: "📌",
  "working-block": "🕰️",
  "planned-task": "🧩",
};

const estimateAccuracyLabels: Record<EstimateAccuracy, string> = {
  "too-short": "Too short",
  "about-right": "About right",
  "too-long": "Too long",
};

function getSourceLabel(source: CalendarSource) {
  if (source === "timed") return "Timed focus session";
  if (source === "pomodoro") return "Focus bloom session";
  if (source === "task") return "Due-date task";
  if (source === "working-block") return "Working block";
  if (source === "planned-task") return "Planned task block";
  return "Manual work log";
}

function getTimingLabel(item: CalendarItem) {
  if (item.isAllDay) {
    return "All day / due item";
  }

  if (
    (item.source === "working-block" || item.source === "planned-task") &&
    item.time &&
    item.endTime
  ) {
    return `${item.time}-${item.endTime}`;
  }

  return item.time || "No time listed";
}

function formatDuration(totalSeconds: number | undefined) {
  if (!totalSeconds) {
    return undefined;
  }

  const minutes = Math.round(totalSeconds / 60);

  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder === 0 ? `${hours} hours` : `${hours}h ${remainder}m`;
}

export function CalendarEventDetailModal({
  item,
  onClose,
  onDeleteItem,
  onEditTask,
  onRemovePlannedTask,
  onMarkTaskDone,
  onEditWorkingBlocks,
}: CalendarEventDetailModalProps) {
  if (!item) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card calendar-detail-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-detail-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Calendar Item</p>
            <h2 id="calendar-detail-title">{item.title}</h2>
          </div>

          <button className="text-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="calendar-detail-body">
          <div className="calendar-detail-icon-row">
            <span>{sourceIconMap[item.source]}</span>

            {item.completed && <span>✅</span>}

            {item.mood && <span>{moodIconMap[item.mood]}</span>}
          </div>

          <dl className="calendar-detail-list">
            <div>
              <dt>Type</dt>
              <dd>{getSourceLabel(item.source)}</dd>
            </div>

            <div>
              <dt>Category</dt>
              <dd>{item.category}</dd>
            </div>

            <div>
              <dt>Time</dt>
              <dd>{getTimingLabel(item)}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>
                {item.source === "working-block"
                  ? item.workingBlockStatus ?? "planned"
                  : item.source === "planned-task"
                    ? item.plannedTaskBlockStatus ?? "planned"
                  : item.completed
                    ? "Completed"
                    : "Open / logged"}
              </dd>
            </div>

            {item.source === "working-block" ? (
              <>
                <div>
                  <dt>Planned tasks</dt>
                  <dd>{item.plannedTaskIds?.length ?? 0}</dd>
                </div>

                <div>
                  <dt>Actual sessions</dt>
                  <dd>{item.actualSessionIds?.length ?? 0}</dd>
                </div>
              </>
            ) : null}

            {item.source === "planned-task" ? (
              <>
                <div>
                  <dt>Estimate</dt>
                  <dd>
                    {item.estimatedMinutes
                      ? `${item.estimatedMinutes} minutes`
                      : "No estimate"}
                  </dd>
                </div>

                <div>
                  <dt>Spoons</dt>
                  <dd>{item.spoonCost ? `${item.spoonCost} spoons` : "Not set"}</dd>
                </div>
              </>
            ) : null}

            {item.source === "timed" ||
            item.source === "pomodoro" ||
            item.source === "manual" ? (
              <>
                <div>
                  <dt>Duration</dt>
                  <dd>{formatDuration(item.durationSeconds) ?? "Not timed"}</dd>
                </div>

                <div>
                  <dt>Task link</dt>
                  <dd>{item.taskId ? "Linked to task" : "No task link"}</dd>
                </div>

                <div>
                  <dt>Finished task</dt>
                  <dd>
                    {item.completedTask === undefined
                      ? "Not answered"
                      : item.completedTask
                        ? "Yes"
                        : "No / partly"}
                  </dd>
                </div>

                <div>
                  <dt>Estimate</dt>
                  <dd>
                    {item.estimateAccuracy
                      ? estimateAccuracyLabels[item.estimateAccuracy]
                      : "Not answered"}
                  </dd>
                </div>

                <div>
                  <dt>Hidden setup</dt>
                  <dd>
                    {item.hadHiddenSetup === undefined
                      ? "Not answered"
                      : item.hadHiddenSetup
                        ? "Yes"
                        : "No"}
                  </dd>
                </div>

                <div>
                  <dt>Interrupted</dt>
                  <dd>
                    {item.wasInterrupted === undefined
                      ? "Not answered"
                      : item.wasInterrupted
                        ? "Yes"
                        : "No"}
                  </dd>
                </div>

                <div>
                  <dt>Working block</dt>
                  <dd>
                    {item.workingBlockId
                      ? "Linked to working block"
                      : "No working-block link"}
                  </dd>
                </div>

                <div>
                  <dt>Planned block</dt>
                  <dd>
                    {item.plannedTaskBlockId
                      ? "Linked to planned task"
                      : "No planned-task link"}
                  </dd>
                </div>
              </>
            ) : null}

            {item.mood && (
              <div>
                <dt>Mood</dt>
                <dd>
                  {moodIconMap[item.mood]} {item.mood}
                </dd>
              </div>
            )}
          </dl>

          {item.notes ? (
            <p className="muted-text">
              <strong>Notes:</strong> {item.notes}
            </p>
          ) : (
            <p className="muted-text">
              {item.source === "working-block"
                ? "Working blocks are planned availability containers, not completed work."
                : item.source === "planned-task"
                  ? "Planned task blocks are intentions inside available time. Actual work comes later."
                : "Editing and deletion controls come next. For now, this confirms the calendar knows what each item is."}
            </p>
          )}
        </div>

<div className="modal-actions calendar-detail-actions">
  {item.source === "task" && onEditTask && (
    <Button type="button" onClick={() => onEditTask(item)}>
      Edit task
    </Button>
  )}

  {item.source === "planned-task" && onEditTask && (
    <Button type="button" onClick={() => onEditTask(item)}>
      Edit task
    </Button>
  )}

  {item.source === "planned-task" && onMarkTaskDone && (
    <Button type="button" onClick={() => onMarkTaskDone(item)}>
      Mark done
    </Button>
  )}

  {item.source === "planned-task" && onRemovePlannedTask && (
    <Button type="button" variant="soft" onClick={() => onRemovePlannedTask(item)}>
      Remove from block
    </Button>
  )}

  {item.source !== "task" &&
    item.source !== "working-block" &&
    item.source !== "planned-task" &&
    onDeleteItem && (
    <Button type="button" variant="soft" onClick={() => onDeleteItem(item)}>
      Delete log
    </Button>
  )}

  {item.source === "working-block" && onEditWorkingBlocks && (
    <Button type="button" onClick={onEditWorkingBlocks}>
      Edit Today Check-In
    </Button>
  )}

  <Button type="button" variant="soft" onClick={onClose}>
    Close
  </Button>
</div>
      </div>
    </div>
  );
}
