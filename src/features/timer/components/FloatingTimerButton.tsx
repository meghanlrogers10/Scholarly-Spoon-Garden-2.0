import "../timer.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type {
  ActiveTimer,
  EstimateAccuracy,
  TimerCategory,
  TimerMode,
  TimerMood,
  TimerSession,
} from "../../../shared/types/timer";
import { TIMER_SESSIONS_STORAGE_KEY } from "../../../shared/constants/timerStorage";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import { useAppSettings } from "../../../shared/hooks/useAppSettings";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { DrSpoonbloomMascot } from "../../../shared/brand/DrSpoonbloomMascot";
import { Button } from "../../../shared/ui/Button";
import { useDailyCheckIn } from "../../dashboard/hooks/useDailyCheckIn";
import { usePlannedTaskBlocks } from "../../dashboard/hooks/usePlannedTaskBlocks";
import {
  getActualSessionDurationMinutes,
  getCurrentWorkingBlock,
  getPlannedBlocksForCurrentWorkingBlock,
  linkActualWorkToPlanningContext,
} from "../../dashboard/utils/actualWorkPlanning";
import { formatWorkingBlockTimeRange } from "../../dashboard/utils/workingBlockCalendar";

const categoryOptions: TimerCategory[] = [
  "Research",
  "Teaching",
  "Service",
  "MindSpace",
  "Writing",
  "Admin",
  "Other",
];

const moodOptions: Array<{
  value: TimerMood;
  emoji: string;
  label: string;
}> = [
  { value: "overwhelmed", emoji: "😫", label: "Overwhelmed" },
  { value: "meh", emoji: "😐", label: "Meh" },
  { value: "satisfied", emoji: "🙂", label: "Satisfied" },
  { value: "proud", emoji: "😄", label: "Proud" },
  { value: "energized", emoji: "🚀", label: "Energized" },
];

type TimerPosition = {
  x: number;
  y: number;
};

type TaskCompletionChoice = "yes" | "partly" | "no";
type BooleanChoice = "yes" | "no";

const TIMER_BUTTON_WIDTH = 104;
const TIMER_BUTTON_HEIGHT = 88;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultTimerPosition(): TimerPosition {
  return {
    x: Math.max(16, window.innerWidth - TIMER_BUTTON_WIDTH - 24),
    y: 88,
  };
}

function getTimerPanelStyle(position: TimerPosition) {
  const panelWidth = 380;
  const panelHeightEstimate = 460;

  return {
    left: `${clampNumber(
      position.x - panelWidth + TIMER_BUTTON_WIDTH,
      16,
      Math.max(16, window.innerWidth - panelWidth - 16),
    )}px`,
    top: `${clampNumber(
      position.y + TIMER_BUTTON_HEIGHT + 12,
      16,
      Math.max(16, window.innerHeight - panelHeightEstimate),
    )}px`,
  };
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getElapsedSeconds(timer: ActiveTimer) {
  const runningSeconds =
    timer.lastResumedAt && !timer.isPaused
      ? Math.floor(
          (Date.now() - new Date(timer.lastResumedAt).getTime()) / 1000,
        )
      : 0;

  return Math.max(0, timer.elapsedBeforePauseSeconds + runningSeconds);
}

function getPomodoroRemainingSeconds(
  timer: ActiveTimer,
  elapsedSeconds: number,
) {
  if (timer.mode !== "pomodoro") {
    return null;
  }

  const totalSeconds = (timer.pomodoroMinutes || 25) * 60;

  return Math.max(0, totalSeconds - elapsedSeconds);
}

function clampSpoons(value: number) {
  if (value < 1) return 1;
  if (value > 7) return 7;
  return value;
}

function playTimerBeep() {
  try {
    const audioWindow = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextClass =
      audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 740;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);
  } catch {
    // Audio is optional; the visual alert still carries the completion state.
  }
}

export function FloatingTimerButton() {
  const { settings } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [tick, setTick] = useState(0);
  const [completionAlertTimerId, setCompletionAlertTimerId] = useState("");
  const [longRunningDismissedTimerId, setLongRunningDismissedTimerId] =
    useState("");
  const [longRunningSnoozeUntilSeconds, setLongRunningSnoozeUntilSeconds] =
    useState(0);

  const [timerPosition, setTimerPosition] = useLocalStorage<TimerPosition>(
    "ssg2.timerPosition",
    getDefaultTimerPosition(),
  );

  const [isDraggingTimer, setIsDraggingTimer] = useState(false);

  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  } | null>(null);

  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<TimerCategory>("Research");
  const [mode, setMode] = useState<TimerMode>("continuous");
  const [pomodoroMinutes, setPomodoroMinutes] = useState(
    settings.timerPomodoroMinutes,
  );
  const [estimatedSpoons, setEstimatedSpoons] = useState(3);
  const [preNote, setPreNote] = useState("");
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [selectedPlannedBlockId, setSelectedPlannedBlockId] = useState("");

  const [spoonsUsed, setSpoonsUsed] = useState(3);
  const [mood, setMood] = useState<TimerMood | "">("");
  const [reflection, setReflection] = useState("");
  const [taskCompletionChoice, setTaskCompletionChoice] = useState<
    TaskCompletionChoice | ""
  >("");
  const [estimateAccuracy, setEstimateAccuracy] = useState<
    EstimateAccuracy | ""
  >("");
  const [hiddenSetupChoice, setHiddenSetupChoice] = useState<
    BooleanChoice | ""
  >("");
  const [interruptedChoice, setInterruptedChoice] = useState<
    BooleanChoice | ""
  >("");

  const [activeTimer, setActiveTimer] = useLocalStorage<ActiveTimer | null>(
    "ssg2.activeTimer",
    null,
  );

  const [timerSessions, setTimerSessions] = useLocalStorage<TimerSession[]>(
    TIMER_SESSIONS_STORAGE_KEY,
    [],
  );

  const {
    tasks: todayTasks,
    updateTasks,
    addActualMinutesToTask,
  } = useTaskBridge();
  const { todayCheckIn } = useDailyCheckIn();
  const { plannedBlocks, updatePlannedTaskBlock } = usePlannedTaskBlocks();

  const activeTasks = todayTasks.filter((task) => task.status !== "done");
  const currentWorkingBlock = getCurrentWorkingBlock(
    new Date(),
    todayCheckIn?.workingBlocks ?? [],
  );
  const currentPlannedBlocks = getPlannedBlocksForCurrentWorkingBlock(
    currentWorkingBlock?.id,
    plannedBlocks,
  );

  useEffect(() => {
    function keepTimerOnScreen() {
      setTimerPosition((currentPosition) => ({
        x: clampNumber(
          currentPosition.x,
          8,
          window.innerWidth - TIMER_BUTTON_WIDTH - 8,
        ),
        y: clampNumber(
          currentPosition.y,
          64,
          window.innerHeight - TIMER_BUTTON_HEIGHT - 8,
        ),
      }));
    }

    keepTimerOnScreen();
    window.addEventListener("resize", keepTimerOnScreen);

    return () => window.removeEventListener("resize", keepTimerOnScreen);
  }, [setTimerPosition]);

  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTick((currentTick) => currentTick + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeTimer]);

  const elapsedSeconds = useMemo(() => {
    if (!activeTimer) {
      return 0;
    }

    return tick >= 0 ? getElapsedSeconds(activeTimer) : 0;
  }, [activeTimer, tick]);

  const remainingPomodoroSeconds = activeTimer
    ? getPomodoroRemainingSeconds(activeTimer, elapsedSeconds)
    : null;

  useEffect(() => {
    if (
      !activeTimer ||
      activeTimer.mode !== "pomodoro" ||
      activeTimer.isPaused ||
      remainingPomodoroSeconds === null ||
      remainingPomodoroSeconds > 0
    ) {
      return;
    }

    if (completionAlertTimerId === activeTimer.id) {
      return;
    }

    if (settings.timerSoundAlerts) {
      playTimerBeep();
    }

    if (
      settings.timerVisualAlerts &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Focus bloom complete", {
        body: `${activeTimer.label} is ready to reflect on.`,
      });
    }

    /* eslint-disable react-hooks/set-state-in-effect */
    setCompletionAlertTimerId(activeTimer.id);

    if (settings.timerVisualAlerts) {
      resetStopForm(activeTimer);
      setShowStopModal(true);
      setIsOpen(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [
    activeTimer,
    completionAlertTimerId,
    remainingPomodoroSeconds,
    settings.timerSoundAlerts,
    settings.timerVisualAlerts,
  ]);

  const longRunningThresholdSeconds =
    settings.longRunningTimerWarningMinutes > 0
      ? settings.longRunningTimerWarningMinutes * 60
      : 0;
  const shouldShowLongRunningWarning = Boolean(
    activeTimer &&
      activeTimer.mode === "continuous" &&
      !activeTimer.isPaused &&
      longRunningThresholdSeconds > 0 &&
      elapsedSeconds >= longRunningThresholdSeconds &&
      elapsedSeconds >= longRunningSnoozeUntilSeconds &&
      longRunningDismissedTimerId !== activeTimer.id,
  );

  function resetStartForm() {
    setLabel("");
    setCategory("Research");
    setMode("continuous");
    setPomodoroMinutes(settings.timerPomodoroMinutes);
    setEstimatedSpoons(3);
    setPreNote("");
    setLinkedTaskId("");
    setSelectedPlannedBlockId("");
  }

  function resetStopForm(timer: ActiveTimer | null) {
    setSpoonsUsed(clampSpoons(timer?.estimatedSpoons || 3));
    setMood("");
    setReflection("");
    setTaskCompletionChoice("");
    setEstimateAccuracy("");
    setHiddenSetupChoice("");
    setInterruptedChoice("");
  }

  function openStartModal() {
    resetStartForm();
    setShowStartModal(true);
    setIsOpen(false);
  }

  function closeStartModal() {
    setShowStartModal(false);
  }

  function openStopModal() {
    resetStopForm(activeTimer);
    setShowStopModal(true);
    setIsOpen(false);
  }

  function handleLinkedTaskChange(taskId: string) {
    setLinkedTaskId(taskId);
    setSelectedPlannedBlockId("");

    const selectedTask = todayTasks.find((task) => task.id === taskId);

    if (selectedTask && !label.trim()) {
      setLabel(selectedTask.title);
      setCategory(
        selectedTask.area === "Personal" ? "Other" : selectedTask.area,
      );
      setEstimatedSpoons(selectedTask.spoonCost);
    }
  }

  function handlePlannedTaskChange(plannedBlockId: string) {
    setSelectedPlannedBlockId(plannedBlockId);

    const plannedBlock = plannedBlocks.find((block) => block.id === plannedBlockId);
    const selectedTask = plannedBlock
      ? todayTasks.find((task) => task.id === plannedBlock.taskId)
      : undefined;

    if (!plannedBlock) {
      return;
    }

    setLinkedTaskId(plannedBlock.taskId);
    setLabel(plannedBlock.titleSnapshot);

    if (selectedTask) {
      setCategory(
        selectedTask.area === "Personal" ? "Other" : selectedTask.area,
      );
      setEstimatedSpoons(selectedTask.spoonCost);
    } else if (plannedBlock.area) {
      setCategory(plannedBlock.area === "Personal" ? "Other" : plannedBlock.area);
      setEstimatedSpoons(clampSpoons(plannedBlock.spoonCost ?? estimatedSpoons));
    }
  }

  function handleStartTimer() {
    const selectedTask = todayTasks.find((task) => task.id === linkedTaskId);
    const planningContext = linkActualWorkToPlanningContext({
      taskId: selectedTask?.id,
      workingBlockId: currentWorkingBlock?.id ?? selectedTask?.workingBlockId,
      plannedTaskBlockId: selectedPlannedBlockId,
      workingBlocks: todayCheckIn?.workingBlocks ?? [],
      plannedBlocks,
    });
    const cleanedLabel =
      label.trim() || selectedTask?.title || "Untitled focus session";
    const now = new Date().toISOString();

    const newTimer: ActiveTimer = {
      id: crypto.randomUUID(),
      label: cleanedLabel,
      category,
      mode,
      pomodoroMinutes: mode === "pomodoro" ? pomodoroMinutes : undefined,
      startedAt: now,
      lastResumedAt: now,
      elapsedBeforePauseSeconds: 0,
      isPaused: false,
      estimatedSpoons: clampSpoons(estimatedSpoons),
      preNote: preNote.trim(),
      taskId: planningContext.taskId,
      taskTitle:
        selectedTask?.title ??
        plannedBlocks.find((block) => block.id === planningContext.plannedTaskBlockId)
          ?.titleSnapshot,
      workingBlockId: planningContext.workingBlockId,
      plannedTaskBlockId: planningContext.plannedTaskBlockId,
    };

    setCompletionAlertTimerId("");
    setLongRunningDismissedTimerId("");
    setLongRunningSnoozeUntilSeconds(0);
    setActiveTimer(newTimer);
    setShowStartModal(false);
  }

  function handlePauseResume() {
    if (!activeTimer) {
      return;
    }

    if (activeTimer.isPaused) {
      setActiveTimer({
        ...activeTimer,
        isPaused: false,
        lastResumedAt: new Date().toISOString(),
      });

      return;
    }

    setActiveTimer({
      ...activeTimer,
      isPaused: true,
      elapsedBeforePauseSeconds: getElapsedSeconds(activeTimer),
      lastResumedAt: null,
    });
  }

  function handleSaveStop() {
    if (!activeTimer) {
      return;
    }

    const endedAt = new Date().toISOString();
    const completedTask =
      taskCompletionChoice === "yes"
        ? true
        : taskCompletionChoice === "partly" || taskCompletionChoice === "no"
          ? false
          : undefined;
    const hadHiddenSetup =
      hiddenSetupChoice === "yes"
        ? true
        : hiddenSetupChoice === "no"
          ? false
          : undefined;
    const wasInterrupted =
      interruptedChoice === "yes"
        ? true
        : interruptedChoice === "no"
          ? false
          : undefined;

    const completedSession: TimerSession = {
      id: activeTimer.id,
      label: activeTimer.label,
      category: activeTimer.category,
      mode: activeTimer.mode,
      pomodoroMinutes: activeTimer.pomodoroMinutes,
      startedAt: activeTimer.startedAt,
      endedAt,
      durationSeconds: getElapsedSeconds(activeTimer),
      estimatedSpoons: activeTimer.estimatedSpoons,
      spoonsUsed: clampSpoons(spoonsUsed),
      preNote: activeTimer.preNote,
      reflection: reflection.trim(),
      mood: mood || undefined,
      completed: completedTask,
      completedTask,
      estimateAccuracy: estimateAccuracy || undefined,
      hadHiddenSetup,
      wasInterrupted,
      taskId: activeTimer.taskId,
      taskTitle: activeTimer.taskTitle,
      workingBlockId: activeTimer.workingBlockId,
      plannedTaskBlockId: activeTimer.plannedTaskBlockId,
      source: "timer",
    };

    setTimerSessions((currentSessions) => [
      completedSession,
      ...currentSessions,
    ]);

    if (activeTimer.taskId) {
      addActualMinutesToTask(
        activeTimer.taskId,
        getActualSessionDurationMinutes(completedSession),
      );
    }

    if (activeTimer.plannedTaskBlockId) {
      updatePlannedTaskBlock(activeTimer.plannedTaskBlockId, {
        status:
          completedTask === true
            ? "done"
            : taskCompletionChoice === "partly" || completedTask === false
              ? "partially-done"
              : "started",
      });
    }

    if (activeTimer.taskId && completedTask === true) {
      updateTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === activeTimer.taskId
            ? {
                ...task,
                status: "done",
                updatedAt: endedAt,
              }
            : task,
        ),
      );
    }

    setActiveTimer(null);
    setCompletionAlertTimerId("");
    setLongRunningDismissedTimerId("");
    setLongRunningSnoozeUntilSeconds(0);
    setShowStopModal(false);
    setIsOpen(true);
  }

  function handleCancelStop() {
    setShowStopModal(false);
    setIsOpen(true);
  }

  function handleDismissLongRunningWarning() {
    if (!activeTimer) {
      return;
    }

    setLongRunningDismissedTimerId(activeTimer.id);
  }

  function handleSnoozeLongRunningWarning() {
    setLongRunningSnoozeUntilSeconds(elapsedSeconds + 10 * 60);
  }

  function handleTimerPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: timerPosition.x,
      initialY: timerPosition.y,
      moved: false,
    };

    setIsDraggingTimer(true);
  }

  function handleTimerPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragState.moved = true;
    }

    setTimerPosition({
      x: clampNumber(
        dragState.initialX + deltaX,
        8,
        window.innerWidth - TIMER_BUTTON_WIDTH - 8,
      ),
      y: clampNumber(
        dragState.initialY + deltaY,
        64,
        window.innerHeight - TIMER_BUTTON_HEIGHT - 8,
      ),
    });
  }

  function handleTimerPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);

    const wasClick = !dragState.moved;

    dragStateRef.current = null;
    setIsDraggingTimer(false);

    if (wasClick) {
      setIsOpen((current) => !current);
    }
  }

  function handleTimerPointerCancel() {
    dragStateRef.current = null;
    setIsDraggingTimer(false);
  }

  function handleTimerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((current) => !current);
    }
  }

  const latestSessions = timerSessions.slice(0, 3);
  const timerPanelStyle = getTimerPanelStyle(timerPosition);
  const showLightStopReflection = settings.timerReflectionLevel !== "none";
  const showFullStopReflection = settings.timerReflectionLevel === "full";

  return (
    <>
      <button
        className={[
          "floating-timer-button",
          activeTimer ? "is-running" : "",
          settings.timerVisualAlerts &&
          completionAlertTimerId &&
          activeTimer?.id === completionAlertTimerId
            ? "is-complete"
            : "",
          isDraggingTimer ? "is-dragging" : "",
        ].join(" ")}
        style={{
          left: `${timerPosition.x}px`,
          top: `${timerPosition.y}px`,
        }}
        onPointerDown={handleTimerPointerDown}
        onPointerMove={handleTimerPointerMove}
        onPointerUp={handleTimerPointerUp}
        onPointerCancel={handleTimerPointerCancel}
        onKeyDown={handleTimerKeyDown}
        aria-label="Open Focus Bloom timer"
        title="Drag to move. Click to open Focus Bloom."
      >
        <span className="timer-bloom-mark" aria-hidden="true" />
        <strong>{activeTimer ? formatDuration(elapsedSeconds) : "Bloom"}</strong>
      </button>

      {isOpen && (
        <aside
          className="timer-panel"
          style={timerPanelStyle}
          aria-label="Focus timer panel"
        >
          <div className="timer-panel-header">
            <div className="timer-panel-title">
              <DrSpoonbloomMascot
                className="timer-panel-mascot"
                interactive
                size="compact"
              />
              <div>
                <p className="eyebrow">Focus Bloom</p>
                <h2>Spoon Timer</h2>
              </div>
            </div>

            <button className="text-button" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>

          {activeTimer ? (
            <div className="active-timer-box">
              <div className="timer-mode-line">
                <span>
                  {activeTimer.mode === "pomodoro"
                    ? `Focus bloom ${activeTimer.pomodoroMinutes}m`
                    : "Open-ended bloom"}
                </span>

                {activeTimer.isPaused && <strong>Paused</strong>}
              </div>

              <p className="timer-time">{formatDuration(elapsedSeconds)}</p>

              {remainingPomodoroSeconds !== null && (
                <p className="muted-text">
                  Remaining: {formatDuration(remainingPomodoroSeconds)}
                </p>
              )}

              {settings.timerVisualAlerts && completionAlertTimerId === activeTimer.id && (
                <div className="timer-alert-box" role="status">
                  Focus bloom complete. Stop and reflect, or keep going if that is
                  what today needs.
                </div>
              )}

              {shouldShowLongRunningWarning && (
                <div className="timer-alert-box is-gentle" role="status">
                  <strong>Still going.</strong>
                  <span>
                    This session has passed{" "}
                    {settings.longRunningTimerWarningMinutes} minutes. Check the
                    runway before momentum gets expensive.
                  </span>
                  <div className="timer-alert-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={handleDismissLongRunningWarning}
                    >
                      Keep going
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={handleSnoozeLongRunningWarning}
                    >
                      Add 10 min
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={openStopModal}
                    >
                      Session reflection
                    </button>
                  </div>
                </div>
              )}

              <strong>{activeTimer.label}</strong>
              <span>
                {activeTimer.category} · estimated {activeTimer.estimatedSpoons}{" "}
                spoons
              </span>

              {activeTimer.taskTitle && (
                <p className="muted-text">Linked task: {activeTimer.taskTitle}</p>
              )}

              {activeTimer.workingBlockId && (
                <p className="muted-text">Linked to today’s working block</p>
              )}

              {activeTimer.preNote && (
                <p className="timer-note-preview">“{activeTimer.preNote}”</p>
              )}

              <div className="timer-action-row">
                <Button variant="soft" onClick={handlePauseResume}>
                  {activeTimer.isPaused ? "Grow this session" : "Pause the bloom"}
                </Button>
                <Button onClick={openStopModal}>Rest the sprout</Button>
              </div>
            </div>
          ) : (
            <div className="timer-empty-box">
              <p className="muted-text">
                Start a session, link it to a task, and log how it actually went.
              </p>
              <Button onClick={openStartModal}>Begin a focus bloom</Button>
            </div>
          )}

          <div className="timer-recent-sessions">
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">Recent</p>
                <h3>Bloom Log</h3>
              </div>
              <span className="pill">{timerSessions.length}</span>
            </div>

            {latestSessions.length === 0 ? (
              <p className="muted-text">
                No sessions yet. The timer is waiting politely.
              </p>
            ) : (
              <div className="timer-session-list">
                {latestSessions.map((session) => (
                  <div key={session.id} className="timer-session-item">
                    <div>
                      <strong>{session.label}</strong>
                      <p>
                        {session.category}
                        {session.mood ? ` · ${session.mood}` : ""}
                      </p>
                    </div>
                    <span>{formatDuration(session.durationSeconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {showStartModal && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-card timer-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="timer-start-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Focus Bloom</p>
                <h2 id="timer-start-title">Begin a focus bloom</h2>
              </div>

              <button className="text-button" onClick={closeStartModal}>
                Close
              </button>
            </div>

            <div className="timer-form">
              {currentWorkingBlock ? (
                <div className="timer-context-box">
                  <strong>
                    You’re in a working block{" "}
                    {formatWorkingBlockTimeRange(currentWorkingBlock)}
                  </strong>
                  {currentPlannedBlocks.length > 0 ? (
                    <label>
                      <span>Start one of the planned tasks?</span>
                      <select
                        value={selectedPlannedBlockId}
                        onChange={(event) =>
                          handlePlannedTaskChange(event.target.value)
                        }
                      >
                        <option value="">Choose another task or start unlinked</option>
                        {currentPlannedBlocks.map((plannedBlock) => (
                          <option key={plannedBlock.id} value={plannedBlock.id}>
                            {plannedBlock.titleSnapshot}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="muted-text">
                      No planned tasks are inside this block yet. You can still
                      link another task or start unlinked.
                    </p>
                  )}
                </div>
              ) : null}

              <label>
                <span>Link existing task</span>
                <select
                  value={linkedTaskId}
                  onChange={(event) => handleLinkedTaskChange(event.target.value)}
                >
                  <option value="">None</option>
                  {activeTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.area})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Task / session label</span>
                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="What are you working on?"
                />
              </label>

              <div className="form-grid">
                <label>
                  <span>Category</span>
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as TimerCategory)
                    }
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Estimated spoons</span>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={estimatedSpoons}
                    onChange={(event) =>
                      setEstimatedSpoons(clampSpoons(Number(event.target.value)))
                    }
                  />
                </label>

                <label>
                  <span>Mode</span>
                  <select
                    value={mode}
                    onChange={(event) => setMode(event.target.value as TimerMode)}
                  >
                    <option value="continuous">Open-ended bloom</option>
                    <option value="pomodoro">Timed focus bloom</option>
                  </select>
                </label>
              </div>

              {mode === "pomodoro" && (
                <label>
                  <span>Bloom minutes</span>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    value={pomodoroMinutes}
                    onChange={(event) =>
                      setPomodoroMinutes(Number(event.target.value))
                    }
                  />
                </label>
              )}

              <label>
                <span>Before-you-start note</span>
                <textarea
                  value={preNote}
                  onChange={(event) => setPreNote(event.target.value)}
                  placeholder="What are you actually trying to grow here?"
                  rows={3}
                />
              </label>

              <div className="modal-actions">
                <Button type="button" variant="soft" onClick={closeStartModal}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleStartTimer}>
                  Grow this session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStopModal && activeTimer && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-card timer-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="timer-stop-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Session reflection</p>
                <h2 id="timer-stop-title">What did this actually take?</h2>
              </div>

              <button className="text-button" onClick={handleCancelStop}>
                Close
              </button>
            </div>

            <div className="timer-form">
              <div className="timer-stop-summary">
                <strong>{activeTimer.label}</strong>
                <span>{formatDuration(elapsedSeconds)}</span>
              </div>

              {showLightStopReflection ? (
                <>
                  <fieldset className="timer-fieldset timer-feedback-fieldset">
                    <legend>Did this finish the task?</legend>
                    <div className="timer-feedback-options">
                      {[
                        ["yes", "Yes"],
                        ["partly", "Partly"],
                        ["no", "No"],
                      ].map(([value, labelText]) => (
                        <label
                          key={value}
                          className={`timer-feedback-option ${
                            taskCompletionChoice === value ? "selected" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="taskCompletion"
                            value={value}
                            checked={taskCompletionChoice === value}
                            onChange={() =>
                              setTaskCompletionChoice(value as TaskCompletionChoice)
                            }
                          />
                          <span>{labelText}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {showFullStopReflection ? (
                    <>
                      <fieldset className="timer-fieldset timer-feedback-fieldset">
                        <legend>How was the estimate?</legend>
                        <div className="timer-feedback-options">
                          {[
                            ["too-short", "Too short"],
                            ["about-right", "About right"],
                            ["too-long", "Too long"],
                          ].map(([value, labelText]) => (
                            <label
                              key={value}
                              className={`timer-feedback-option ${
                                estimateAccuracy === value ? "selected" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="estimateAccuracy"
                                value={value}
                                checked={estimateAccuracy === value}
                                onChange={() =>
                                  setEstimateAccuracy(value as EstimateAccuracy)
                                }
                              />
                              <span>{labelText}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <div className="timer-feedback-grid">
                        <fieldset className="timer-fieldset timer-feedback-fieldset">
                          <legend>Any hidden setup time?</legend>
                          <div className="timer-feedback-options is-compact">
                            {[
                              ["yes", "Yes"],
                              ["no", "No"],
                            ].map(([value, labelText]) => (
                              <label
                                key={value}
                                className={`timer-feedback-option ${
                                  hiddenSetupChoice === value ? "selected" : ""
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="hiddenSetup"
                                  value={value}
                                  checked={hiddenSetupChoice === value}
                                  onChange={() =>
                                    setHiddenSetupChoice(value as BooleanChoice)
                                  }
                                />
                                <span>{labelText}</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>

                        <fieldset className="timer-fieldset timer-feedback-fieldset">
                          <legend>Interrupted?</legend>
                          <div className="timer-feedback-options is-compact">
                            {[
                              ["yes", "Yes"],
                              ["no", "No"],
                            ].map(([value, labelText]) => (
                              <label
                                key={value}
                                className={`timer-feedback-option ${
                                  interruptedChoice === value ? "selected" : ""
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="interrupted"
                                  value={value}
                                  checked={interruptedChoice === value}
                                  onChange={() =>
                                    setInterruptedChoice(value as BooleanChoice)
                                  }
                                />
                                <span>{labelText}</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                    </>
                  ) : null}

                  <label>
                    <span>Spoons used</span>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={spoonsUsed}
                      onChange={(event) =>
                        setSpoonsUsed(clampSpoons(Number(event.target.value)))
                      }
                    />
                  </label>

                  {showFullStopReflection ? (
                    <fieldset className="timer-fieldset">
                      <legend>Mood</legend>
                      <div className="timer-mood-scale">
                        {moodOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`timer-mood-option ${
                              mood === option.value ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="timerMood"
                              value={option.value}
                              checked={mood === option.value}
                              onChange={() => setMood(option.value)}
                            />
                            <span aria-hidden="true">{option.emoji}</span>
                            <small>{option.label}</small>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  <label>
                    <span>Anything worth remembering?</span>
                    <textarea
                      value={reflection}
                      onChange={(event) => setReflection(event.target.value)}
                      placeholder="Optional note"
                      rows={2}
                    />
                  </label>
                </>
              ) : (
                <p className="muted-text">
                  Stop reflection is off. This will save the session without extra
                  prompts.
                </p>
              )}

              <div className="modal-actions">
                <Button type="button" variant="soft" onClick={handleCancelStop}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveStop}>
                  Save session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
