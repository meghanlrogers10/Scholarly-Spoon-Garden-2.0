import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import type {
  DailyCheckIn,
  EndOfDayReview,
  PlannedTaskBlock,
} from "../../../shared/types/planning";
import type { Task } from "../../../shared/types/task";
import type { TimerSession } from "../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../shared/types/workLog";
import {
  calculateHiddenSetupCount,
  calculateInterruptionCount,
  calculateTotalActualMinutes,
  getEstimateRatioLabel,
  getSessionDate,
  normalizeManualWorkLog,
  normalizeTimerSession,
} from "../../timer/utils/timeReality";
import {
  formatWorkingBlockDuration,
  getWorkingBlockDurationMinutes,
} from "../utils/workingBlockCalendar";
import { getDayPlannedMinutes } from "../utils/plannedTaskBlocks";

type EndOfDayReviewModalProps = {
  isOpen: boolean;
  date: string;
  review?: EndOfDayReview;
  checkIn?: DailyCheckIn;
  tasks: Task[];
  plannedBlocks: PlannedTaskBlock[];
  timerSessions: TimerSession[];
  manualWorkLogs: ManualWorkLogEntry[];
  onClose: () => void;
  onSave: (
    review: Omit<EndOfDayReview, "id" | "createdAt" | "updatedAt">,
  ) => void;
};

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

function uniqueIds(ids: Array<string | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function getTaskLabel(task: Task) {
  return `${task.title} (${task.area})`;
}

export function EndOfDayReviewModal({
  isOpen,
  date,
  review,
  checkIn,
  tasks,
  plannedBlocks,
  timerSessions,
  manualWorkLogs,
  onClose,
  onSave,
}: EndOfDayReviewModalProps) {
  const todaySessions = useMemo(() => {
    const normalizedSessions = [
      ...timerSessions.map(normalizeTimerSession),
      ...manualWorkLogs.map(normalizeManualWorkLog),
    ];

    return normalizedSessions.filter((session) => getSessionDate(session) === date);
  }, [date, timerSessions, manualWorkLogs]);

  const todayPlannedBlocks = useMemo(
    () => plannedBlocks.filter((block) => block.date === date),
    [date, plannedBlocks],
  );
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [
    tasks,
  ]);
  const completedSessionTaskIds = useMemo(
    () =>
      uniqueIds(
        todaySessions
          .filter((session) => session.completedTask)
          .map((session) => session.taskId),
      ),
    [todaySessions],
  );
  const candidateTasks = useMemo(() => {
    const candidateTaskIds = uniqueIds([
      ...tasks
        .filter((task) => task.today !== false && task.status !== "archived")
        .map((task) => task.id),
      ...todayPlannedBlocks.map((block) => block.taskId),
      ...todaySessions.map((session) => session.taskId),
    ]);

    return candidateTaskIds
      .map((id) => taskMap.get(id))
      .filter((task): task is Task => Boolean(task));
  }, [taskMap, tasks, todayPlannedBlocks, todaySessions]);
  const unfinishedTasks = candidateTasks.filter((task) => task.status !== "done");
  const totalAvailableMinutes =
    checkIn?.workingBlocks.reduce(
      (totalMinutes, block) => totalMinutes + getWorkingBlockDurationMinutes(block),
      0,
    ) ?? 0;
  const plannedMinutes = getDayPlannedMinutes(todayPlannedBlocks);
  const actualMinutes = calculateTotalActualMinutes(todaySessions);
  const hiddenSetupCount = calculateHiddenSetupCount(todaySessions);
  const interruptionCount = calculateInterruptionCount(todaySessions);
  const completedSessionCount = todaySessions.filter(
    (session) => session.completedTask,
  ).length;
  const estimateRatio =
    plannedMinutes > 0 && actualMinutes > 0 ? actualMinutes / plannedMinutes : undefined;

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [rolloverTaskIds, setRolloverTaskIds] = useState<string[]>([]);
  const [droppedTaskIds, setDroppedTaskIds] = useState<string[]>([]);
  const [protectedTomorrow, setProtectedTomorrow] = useState("");
  const [underestimatedNotes, setUnderestimatedNotes] = useState("");
  const [interruptionNotes, setInterruptionNotes] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [energyEnd, setEnergyEnd] = useState<EndOfDayReview["energyEnd"]>();
  const plannedButUnfinishedTasks = todayPlannedBlocks
    .map((block) => taskMap.get(block.taskId))
    .filter((task): task is Task => Boolean(task))
    .filter(
      (task) => task.status !== "done" && !completedTaskIds.includes(task.id),
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Sync the local form controls whenever a saved review is opened for editing.
    /* eslint-disable react-hooks/set-state-in-effect */
    setCompletedTaskIds(
      review?.completedTaskIds ??
        uniqueIds([
          ...candidateTasks
            .filter((task) => task.status === "done")
            .map((task) => task.id),
          ...completedSessionTaskIds,
        ]),
    );
    setRolloverTaskIds(review?.rolloverTaskIds ?? []);
    setDroppedTaskIds(review?.droppedTaskIds ?? []);
    setProtectedTomorrow(review?.protectedTomorrow ?? "");
    setUnderestimatedNotes(review?.underestimatedNotes ?? "");
    setInterruptionNotes(review?.interruptionNotes ?? "");
    setGeneralNotes(review?.generalNotes ?? "");
    setEnergyEnd(review?.energyEnd);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [candidateTasks, completedSessionTaskIds, isOpen, review]);

  if (!isOpen) {
    return null;
  }

  function handleSave() {
    onSave({
      date,
      completedTaskIds,
      rolloverTaskIds,
      droppedTaskIds,
      protectedTomorrow: protectedTomorrow.trim() || undefined,
      underestimatedNotes: underestimatedNotes.trim() || undefined,
      interruptionNotes: interruptionNotes.trim() || undefined,
      generalNotes: generalNotes.trim() || undefined,
      energyEnd,
      tomorrowSeedTaskIds: rolloverTaskIds,
    });
  }

  function toggleCompleted(taskId: string) {
    setCompletedTaskIds((currentIds) => toggleId(currentIds, taskId));
    setRolloverTaskIds((currentIds) => currentIds.filter((id) => id !== taskId));
    setDroppedTaskIds((currentIds) => currentIds.filter((id) => id !== taskId));
  }

  function toggleRollover(taskId: string) {
    setRolloverTaskIds((currentIds) => toggleId(currentIds, taskId));
    setDroppedTaskIds((currentIds) => currentIds.filter((id) => id !== taskId));
    setCompletedTaskIds((currentIds) => currentIds.filter((id) => id !== taskId));
  }

  function toggleDropped(taskId: string) {
    setDroppedTaskIds((currentIds) => toggleId(currentIds, taskId));
    setRolloverTaskIds((currentIds) => currentIds.filter((id) => id !== taskId));
    setCompletedTaskIds((currentIds) => currentIds.filter((id) => id !== taskId));
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card end-of-day-review-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-of-day-review-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Shutdown review</p>
            <h2 id="end-of-day-review-title">What actually happened?</h2>
          </div>

          <button className="text-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="end-of-day-review-body">
          <section className="end-of-day-review-section">
            <h3>Today Snapshot</h3>
            <div className="end-of-day-review-snapshot">
              <div>
                <strong>{checkIn?.availableSpoons ?? "No"}</strong>
                <span>spoons checked in</span>
              </div>
              <div>
                <strong>{formatWorkingBlockDuration(totalAvailableMinutes)}</strong>
                <span>available</span>
              </div>
              <div>
                <strong>{formatWorkingBlockDuration(plannedMinutes)}</strong>
                <span>planned</span>
              </div>
              <div>
                <strong>{formatWorkingBlockDuration(actualMinutes)}</strong>
                <span>actual</span>
              </div>
              <div>
                <strong>{completedSessionCount}</strong>
                <span>completed sessions</span>
              </div>
              <div>
                <strong>{hiddenSetupCount}</strong>
                <span>hidden setup</span>
              </div>
              <div>
                <strong>{interruptionCount}</strong>
                <span>interruptions</span>
              </div>
              <div>
                <strong>{getEstimateRatioLabel(estimateRatio)}</strong>
                <span>planned vs actual</span>
              </div>
            </div>
          </section>

          <section className="end-of-day-review-section">
            <h3>What got done?</h3>
            <div className="end-of-day-task-list">
              {candidateTasks.length === 0 ? (
                <p className="muted-text">No task candidates today. Still counts.</p>
              ) : (
                candidateTasks.map((task) => (
                  <label key={task.id} className="end-of-day-task-row">
                    <input
                      type="checkbox"
                      checked={completedTaskIds.includes(task.id)}
                      onChange={() => toggleCompleted(task.id)}
                    />
                    <span>{getTaskLabel(task)}</span>
                  </label>
                ))
              )}
            </div>
          </section>

          <section className="end-of-day-review-section">
            <h3>What rolls forward?</h3>
            {plannedButUnfinishedTasks.length > 0 ? (
              <p className="muted-text">
                Planned but not completed:{" "}
                {plannedButUnfinishedTasks.map((task) => task.title).join(", ")}
              </p>
            ) : (
              <p className="muted-text">
                Nothing planned is sitting here asking for a verdict.
              </p>
            )}
            <div className="end-of-day-task-list">
              {unfinishedTasks.length === 0 ? (
                <p className="muted-text">No unfinished active tasks found.</p>
              ) : (
                unfinishedTasks.map((task) => (
                  <label key={task.id} className="end-of-day-task-row">
                    <input
                      type="checkbox"
                      checked={rolloverTaskIds.includes(task.id)}
                      onChange={() => toggleRollover(task.id)}
                    />
                    <span>{getTaskLabel(task)} · roll to tomorrow if overdue/due today</span>
                  </label>
                ))
              )}
            </div>
          </section>

          <section className="end-of-day-review-section">
            <h3>What can be released?</h3>
            <p className="muted-text">
              V1 records released tasks without archiving them. Nothing disappears.
            </p>
            <div className="end-of-day-task-list">
              {unfinishedTasks.map((task) => (
                <label key={task.id} className="end-of-day-task-row">
                  <input
                    type="checkbox"
                    checked={droppedTaskIds.includes(task.id)}
                    onChange={() => toggleDropped(task.id)}
                  />
                  <span>{getTaskLabel(task)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="end-of-day-review-section">
            <h3>What did reality teach?</h3>
            <div className="end-of-day-notes-grid">
              <label>
                <span>What was underestimated?</span>
                <textarea
                  value={underestimatedNotes}
                  onChange={(event) => setUnderestimatedNotes(event.target.value)}
                  rows={2}
                />
              </label>
              <label>
                <span>What interrupted the day?</span>
                <textarea
                  value={interruptionNotes}
                  onChange={(event) => setInterruptionNotes(event.target.value)}
                  rows={2}
                />
              </label>
              <label>
                <span>What should tomorrow protect?</span>
                <textarea
                  value={protectedTomorrow}
                  onChange={(event) => setProtectedTomorrow(event.target.value)}
                  rows={2}
                />
              </label>
              <label>
                <span>General notes</span>
                <textarea
                  value={generalNotes}
                  onChange={(event) => setGeneralNotes(event.target.value)}
                  rows={2}
                />
              </label>
            </div>
          </section>

          <section className="end-of-day-review-section">
            <h3>Energy at end</h3>
            <div className="end-of-day-energy-row">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className={`end-of-day-energy-option ${
                    energyEnd === value ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="energyEnd"
                    checked={energyEnd === value}
                    onChange={() =>
                      setEnergyEnd(value as EndOfDayReview["energyEnd"])
                    }
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-actions">
          <Button type="button" variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save shutdown review
          </Button>
        </div>
      </div>
    </div>
  );
}
