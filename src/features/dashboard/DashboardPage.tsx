import "./dashboard.css";
import "./calendar.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TIMER_SESSIONS_STORAGE_KEY } from "../../shared/constants/timerStorage";
import { sampleCalendarItems } from "../../shared/data/sampleDashboard";
import { useAppSettings } from "../../shared/hooks/useAppSettings";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import type {
  CalendarCategory,
  CalendarItem,
} from "../../shared/types/calendar";
import type { TimerSession } from "../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../shared/types/workLog";
import { CalendarCard } from "./components/CalendarCard";
import { CapturedItemsCard } from "./components/CapturedItemsCard";
import { DailyCheckInModal } from "./components/DailyCheckInModal";
import { EnergyTracker } from "./components/EnergyTracker";
import { EndOfDayReviewModal } from "./components/EndOfDayReviewModal";
import { LowEnergyTasksCard } from "./components/LowEnergyTasksCard";
import { ManualWorkLogModal } from "./components/ManualWorkLogModal";
import { QuickCaptureCard } from "./components/QuickCaptureCard";
import { TaskEditorModal } from "./components/TaskEditorModal";
import { TodayControlStrip } from "./components/TodayControlStrip";
import { TodayPlanCard } from "./components/TodayPlanCard";
import { UpcomingTasksCard } from "./components/UpcomingTasksCard";
import { WorkingSessionsCard } from "./components/WorkingSessionsCard";
import { useDailyCheckIn } from "./hooks/useDailyCheckIn";
import { useDashboardCaptures } from "./hooks/useDashboardCaptures";
import { useDashboardTasks } from "./hooks/useDashboardTasks";
import { useEndOfDayReview } from "./hooks/useEndOfDayReview";
import { useManualWorkLogs } from "./hooks/useManualWorkLogs";
import { usePlannedTaskBlocks } from "./hooks/usePlannedTaskBlocks";
import { getManualWorkDurationMinutes } from "./utils/actualWorkPlanning";
import { mapPlannedTaskBlocksToCalendarEvents } from "./utils/plannedTaskBlocks";
import {
  findShutdownReviewTask,
  isShutdownReviewTask,
} from "./utils/shutdownReviewTask";
import { mapWorkingBlocksToCalendarEvents } from "./utils/workingBlockCalendar";
import type {
  DailyCheckIn,
  PlannedTaskBlock,
  PlanningMode,
  WorkingBlock,
  WorkingBlockStatus,
} from "../../shared/types/planning";

function getDayOffsetFromDate(dateString: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(`${dateString}T00:00:00`);
  targetDate.setHours(0, 0, 0, 0);

  return Math.round((targetDate.getTime() - today.getTime()) / 86_400_000);
}

function getDayOffsetFromDateTime(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return getDayOffsetFromDate(`${year}-${month}-${day}`);
}

function formatTimerTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTaskCalendarCategory(area: string): CalendarCategory {
  if (area === "Research") return "Research";
  if (area === "Teaching") return "Teaching";
  if (area === "Service") return "Service";
  return "Other";
}

function getTomorrowDateKey(date: string) {
  const tomorrow = new Date(`${date}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().slice(0, 10);
}

function getMinutesFromTimeString(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

function getCurrentMinutes() {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
}

function shouldShowHardStopNudge(checkIn: DailyCheckIn | undefined) {
  if (!checkIn?.hardStopTime) {
    return false;
  }

  const hardStopMinutes = getMinutesFromTimeString(checkIn.hardStopTime);
  const currentMinutes = getCurrentMinutes();

  return currentMinutes >= hardStopMinutes - 15;
}

function getDerivedWorkingBlockStatus(
  block: WorkingBlock,
  plannedBlocks: PlannedTaskBlock[],
  timerSessions: TimerSession[],
  manualWorkLogs: ManualWorkLogEntry[],
): WorkingBlockStatus {
  if (block.status === "cancelled") {
    return "cancelled";
  }

  const hasActualWork =
    timerSessions.some((session) => session.workingBlockId === block.id) ||
    manualWorkLogs.some((entry) => entry.workingBlockId === block.id);

  if (hasActualWork) {
    const linkedActuals = [
      ...timerSessions.filter((session) => session.workingBlockId === block.id),
      ...manualWorkLogs.filter((entry) => entry.workingBlockId === block.id),
    ];
    const allCompleted =
      linkedActuals.length > 0 &&
      linkedActuals.every((entry) => entry.completedTask ?? entry.completed);

    return allCompleted ? "used" : "partially-used";
  }

  const hasPlannedTasks = plannedBlocks.some(
    (plannedBlock) => plannedBlock.workingBlockId === block.id,
  );

  if (block.date < new Date().toISOString().slice(0, 10) && hasPlannedTasks) {
    return "missed";
  }

  return block.status;
}

function enrichWorkingBlocksForCalendar(
  blocks: WorkingBlock[],
  plannedBlocks: PlannedTaskBlock[],
  timerSessions: TimerSession[],
  manualWorkLogs: ManualWorkLogEntry[],
) {
  return blocks.map((block) => ({
    ...block,
    status: getDerivedWorkingBlockStatus(
      block,
      plannedBlocks,
      timerSessions,
      manualWorkLogs,
    ),
    plannedTaskIds: Array.from(
      new Set([
        ...(block.plannedTaskIds ?? []),
        ...plannedBlocks
          .filter((plannedBlock) => plannedBlock.workingBlockId === block.id)
          .map((plannedBlock) => plannedBlock.taskId),
      ]),
    ),
    actualSessionIds: Array.from(
      new Set([
        ...(block.actualSessionIds ?? []),
        ...timerSessions
          .filter((session) => session.workingBlockId === block.id)
          .map((session) => session.id),
        ...manualWorkLogs
          .filter((entry) => entry.workingBlockId === block.id)
          .map((entry) => entry.id),
      ]),
    ),
  }));
}

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isManualWorkLogOpen, setIsManualWorkLogOpen] = useState(false);
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false);
  const [isEndOfDayReviewOpen, setIsEndOfDayReviewOpen] = useState(false);
  const [hasAutoOpenedDailyCheckIn, setHasAutoOpenedDailyCheckIn] =
    useState(false);
  const { settings } = useAppSettings();
  const {
    todayDate,
    todayCheckIn,
    checkIns,
    hasCompletedTodayCheckIn,
    saveTodayCheckIn,
  } = useDailyCheckIn();
  const { capturedItems, saveCapture, deleteCapture, clearCaptures } =
    useDashboardCaptures();
  const {
    allTasks,
    todayTasks,
    isTaskModalOpen,
    taskToEdit,
    createTaskFromCapture,
    saveTask,
    toggleTaskDone,
    markTaskDone,
    addActualMinutesToTask,
    adjustActualMinutesForTask,
    addTaskToToday,
    removeTaskFromToday,
    postponeTask,
    ensureShutdownReviewTask,
    completeShutdownReviewTask,
    reopenShutdownReviewTaskIfReviewIncomplete,
    openAddTaskModal,
    openEditTaskModal,
    closeTaskModal,
  } = useDashboardTasks();
  const { manualWorkLogs, addManualWorkLog, deleteManualWorkLog } =
    useManualWorkLogs();
  const { getReviewForDate, saveReview } = useEndOfDayReview();
  const {
    plannedBlocks,
    getPlannedBlocksForDate,
    updatePlannedTaskBlock,
    removePlannedTaskBlock,
  } = usePlannedTaskBlocks();
  const [timerSessions, setTimerSessions] = useLocalStorage<TimerSession[]>(
    TIMER_SESSIONS_STORAGE_KEY,
    [],
  );
  const todayReview = getReviewForDate(todayDate);
  const todayPlannedBlocks = getPlannedBlocksForDate(todayDate);
  const shutdownReviewTask = findShutdownReviewTask(allTasks, todayDate);
  const isShutdownReviewDone = Boolean(todayReview) || shutdownReviewTask?.status === "done";
  const [clockMinute, setClockMinute] = useState(() => getCurrentMinutes());
  const [notifiedHardStopDate, setNotifiedHardStopDate] = useState<string>();
  const showHardStopNudge =
    Boolean(todayCheckIn) &&
    !isShutdownReviewDone &&
    shouldShowHardStopNudge(todayCheckIn);
  useEffect(() => {
    if (
      settings.dailyCheckInEnabled &&
      !hasCompletedTodayCheckIn &&
      !hasAutoOpenedDailyCheckIn
    ) {
      // Auto-open the optional daily planning prompt once per dashboard mount.
      /* eslint-disable react-hooks/set-state-in-effect */
      setIsDailyCheckInOpen(true);
      setHasAutoOpenedDailyCheckIn(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [
    hasAutoOpenedDailyCheckIn,
    hasCompletedTodayCheckIn,
    settings.dailyCheckInEnabled,
  ]);

  useEffect(() => {
    if (todayCheckIn) {
      reopenShutdownReviewTaskIfReviewIncomplete(todayDate, Boolean(todayReview));
    }
  }, [todayCheckIn?.id, todayCheckIn?.updatedAt, todayDate, todayReview?.id, todayReview?.updatedAt]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockMinute(getCurrentMinutes());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (
      !showHardStopNudge ||
      notifiedHardStopDate === todayDate ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    new Notification("Shutdown Review", {
      body: "Hard stop is here. Do the 5-minute Shutdown Review so tomorrow has better data.",
    });
    setNotifiedHardStopDate(todayDate);
  }, [notifiedHardStopDate, showHardStopNudge, todayDate, clockMinute]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("shutdownReview") === "1") {
      // Open the shutdown modal when Focus Bloom Log links back with the review query.
      /* eslint-disable react-hooks/set-state-in-effect */
      setIsEndOfDayReviewOpen(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [location.search]);

  const timerCalendarItems: CalendarItem[] = timerSessions.map((session) => ({
    id: `timer-${session.id}`,
    entityId: session.id,
    dayOffset: getDayOffsetFromDateTime(session.endedAt),
    time: formatTimerTime(session.startedAt),
    endTime: formatTimerTime(session.endedAt),
    title: `Actual: ${session.label}`,
    category: session.category,
    source: session.mode === "pomodoro" ? "pomodoro" : "timed",
    mood: session.mood,
    notes: session.reflection,
    completed: session.completedTask ?? session.completed,
    completedTask: session.completedTask,
    estimateAccuracy: session.estimateAccuracy,
    hadHiddenSetup: session.hadHiddenSetup,
    wasInterrupted: session.wasInterrupted,
    taskId: session.taskId,
    workingBlockId: session.workingBlockId,
    plannedTaskBlockId: session.plannedTaskBlockId,
    durationSeconds: session.durationSeconds,
  }));

  const manualWorkCalendarItems: CalendarItem[] = manualWorkLogs.map(
    (entry: ManualWorkLogEntry) => ({
      id: `manual-${entry.id}`,
      entityId: entry.id,
      dayOffset: getDayOffsetFromDate(entry.date),
      time: entry.startTime,
      endTime: entry.endTime,
      title: `Actual: ${entry.title}`,
      category: entry.category,
      source: "manual" as const,
      mood: entry.mood,
      notes: entry.reflection,
      completed: entry.completedTask ?? entry.completed,
      completedTask: entry.completedTask,
      estimateAccuracy: entry.estimateAccuracy,
      hadHiddenSetup: entry.hadHiddenSetup,
      wasInterrupted: entry.wasInterrupted,
      taskId: entry.taskId,
      workingBlockId: entry.workingBlockId,
      plannedTaskBlockId: entry.plannedTaskBlockId,
      durationSeconds: getManualWorkDurationMinutes(entry) * 60,
    }),
  );

  const taskCalendarItems: CalendarItem[] = allTasks
    .filter((task) => task.status !== "archived")
    .filter((task) => task.dueDate)
    .map((task) => ({
      id: `task-${task.id}`,
      entityId: task.id,
      dayOffset: getDayOffsetFromDate(task.dueDate!),
      title: task.title,
      category: getTaskCalendarCategory(task.area),
      source: "task" as const,
      isAllDay: true,
      completed: task.status === "done",
    }));

  const allWorkingBlocks = enrichWorkingBlocksForCalendar(
    checkIns.flatMap((checkIn) => checkIn.workingBlocks),
    plannedBlocks,
    timerSessions,
    manualWorkLogs,
  );
  const workingBlockCalendarItems =
    mapWorkingBlocksToCalendarEvents(allWorkingBlocks);
  const plannedTaskCalendarItems = mapPlannedTaskBlocksToCalendarEvents(
    plannedBlocks,
    allWorkingBlocks,
  );
  const dashboardCalendarItems: CalendarItem[] = [
    ...taskCalendarItems,
    ...workingBlockCalendarItems,
    ...plannedTaskCalendarItems,
    ...timerCalendarItems,
    ...manualWorkCalendarItems,
    ...(settings.showSampleCalendarEvents ? sampleCalendarItems : []),
  ];

  function handleDeleteCalendarItem(item: CalendarItem) {
    if (!item.entityId) {
      return;
    }

    if (item.source === "manual") {
      const matchingLog = manualWorkLogs.find((log) => log.id === item.entityId);

      if (matchingLog?.taskId) {
        const durationMinutes = getManualWorkDurationMinutes(matchingLog);

        if (durationMinutes > 0) {
          adjustActualMinutesForTask(matchingLog.taskId, -durationMinutes, -1);
        }
      }

      deleteManualWorkLog(item.entityId);
      return;
    }

    if (item.source === "timed" || item.source === "pomodoro") {
      const matchingSession = timerSessions.find(
        (session) => session.id === item.entityId,
      );

      if (matchingSession?.taskId) {
        const durationMinutes = Math.max(
          0,
          Math.round(matchingSession.durationSeconds / 60),
        );

        if (durationMinutes > 0) {
          adjustActualMinutesForTask(matchingSession.taskId, -durationMinutes, -1);
        }
      }

      setTimerSessions((currentSessions) =>
        currentSessions.filter((session) => session.id !== item.entityId),
      );
    }
  }

  function handleEditCalendarTask(item: CalendarItem) {
    const taskId = item.source === "planned-task" ? item.taskId : item.entityId;

    if (!taskId || (item.source !== "task" && item.source !== "planned-task")) {
      return;
    }

    const matchingTask = allTasks.find((task) => task.id === taskId);

    if (matchingTask) {
      openEditTaskModal(matchingTask);
    }
  }

  function handleSaveManualWorkLog(
    entry: Parameters<typeof addManualWorkLog>[0],
  ) {
    addManualWorkLog(entry);

    if (entry.taskId) {
      const durationMinutes = getManualWorkDurationMinutes(entry);

      if (durationMinutes > 0) {
        addActualMinutesToTask(entry.taskId, durationMinutes);
      }
    }

    if (entry.plannedTaskBlockId) {
      updatePlannedTaskBlock(entry.plannedTaskBlockId, {
        status: entry.completed ? "done" : "partially-done",
      });
    }

    if (entry.completed && entry.taskId) {
      markTaskDone(entry.taskId);
    }
  }

  function handleOpenDailyPlan() {
    if (todayCheckIn) {
      ensureShutdownReviewTask(todayDate, Boolean(todayReview));
    }

    navigate("/dashboard/daily-plan");
  }

  function handleSaveTodayCheckIn(
    input: Parameters<typeof saveTodayCheckIn>[0],
  ) {
    saveTodayCheckIn(input);
    ensureShutdownReviewTask(todayDate, Boolean(todayReview));
  }

  function handleToggleTodayTask(taskId: string) {
    const task = allTasks.find((item) => item.id === taskId);

    if (task && isShutdownReviewTask(task) && task.status !== "done") {
      setIsEndOfDayReviewOpen(true);
      return;
    }

    toggleTaskDone(taskId);
  }

  function handlePlanningModeChange(mode: PlanningMode) {
    if (!todayCheckIn) {
      handleSaveTodayCheckIn({
        availableSpoons: 3,
        planningMode: mode,
        workingBlocks: [],
      });
      return;
    }

    handleSaveTodayCheckIn({
      availableSpoons: todayCheckIn.availableSpoons,
      planningMode: mode,
      workingBlocks: todayCheckIn.workingBlocks,
      avoidNotes: todayCheckIn.avoidNotes,
      protectNotes: todayCheckIn.protectNotes,
      preferLowEnergyTasks: todayCheckIn.preferLowEnergyTasks,
      avoidHighEmotionTasks: todayCheckIn.avoidHighEmotionTasks,
      hardStopTime: todayCheckIn.hardStopTime,
    });
  }

  function handleRemovePlannedTask(item: CalendarItem) {
    if (item.entityId) {
      removePlannedTaskBlock(item.entityId);
    }
  }

  function handleMarkCalendarTaskDone(item: CalendarItem) {
    if (item.taskId) {
      markTaskDone(item.taskId);
    }
  }

  function handleSaveEndOfDayReview(
    review: Parameters<typeof saveReview>[0],
  ) {
    saveReview(review);
    review.completedTaskIds.forEach((taskId) => markTaskDone(taskId));
    review.rolloverTaskIds.forEach((taskId) => {
      addTaskToToday(taskId);

      const task = allTasks.find((item) => item.id === taskId);

      if (task?.dueDate && task.dueDate <= todayDate) {
        postponeTask(taskId, getTomorrowDateKey(todayDate));
      }
    });
    review.droppedTaskIds.forEach((taskId) => removeTaskFromToday(taskId));
    todayPlannedBlocks.forEach((block) => {
      if (review.completedTaskIds.includes(block.taskId)) {
        updatePlannedTaskBlock(block.id, { status: "done" });
        return;
      }

      if (review.rolloverTaskIds.includes(block.taskId)) {
        updatePlannedTaskBlock(block.id, { status: "moved" });
        return;
      }

      if (review.droppedTaskIds.includes(block.taskId)) {
        updatePlannedTaskBlock(block.id, { status: "skipped" });
      }
    });
    completeShutdownReviewTask(todayDate);
    setIsEndOfDayReviewOpen(false);
  }

  return (
    <section className="dashboard-page">
      <EnergyTracker />

      <main id="main-container">
        <TodayControlStrip
          checkIn={todayCheckIn}
          plannedBlocks={todayPlannedBlocks}
          onModeChange={handlePlanningModeChange}
          onOpenDailyPlan={handleOpenDailyPlan}
          onGenerateSuggestions={handleOpenDailyPlan}
          onLogWork={() => setIsManualWorkLogOpen(true)}
          onShutdown={() => setIsEndOfDayReviewOpen(true)}
        />

        {showHardStopNudge ? (
          <p className="shutdown-review-nudge dashboard-hard-stop-nudge">
            Hard stop is here. Do the 5-minute Shutdown Review so tomorrow has
            better data.
          </p>
        ) : null}

        <CalendarCard
          items={dashboardCalendarItems}
          dayStartHour={settings.calendarDayStartHour}
          dayEndHour={settings.calendarDayEndHour}
          showWeekends={settings.showWeekends}
          onDeleteCalendarItem={handleDeleteCalendarItem}
          onEditCalendarTask={handleEditCalendarTask}
          onRemovePlannedTask={handleRemovePlannedTask}
          onMarkCalendarTaskDone={handleMarkCalendarTaskDone}
          onEditWorkingBlocks={() => setIsDailyCheckInOpen(true)}
        />

        <div id="taskHints" className="dashboard-lower-support-grid">
          <TodayPlanCard
            tasks={todayTasks}
            onToggleDone={handleToggleTodayTask}
            onAddTask={openAddTaskModal}
            onEditTask={openEditTaskModal}
            onOpenDailyPlan={handleOpenDailyPlan}
            onOpenShutdownReview={() => setIsEndOfDayReviewOpen(true)}
          />

          <UpcomingTasksCard tasks={allTasks} />

          <LowEnergyTasksCard
            tasks={allTasks}
            onAddToToday={addTaskToToday}
          />

          <WorkingSessionsCard
            sessions={timerSessions}
            manualWorkLogs={manualWorkLogs}
          />

          <QuickCaptureCard onSave={saveCapture} />

          <CapturedItemsCard
            items={capturedItems}
            onDelete={deleteCapture}
            onClearAll={clearCaptures}
            onCreateTask={(item) => createTaskFromCapture(item, deleteCapture)}
          />
        </div>
      </main>

      <TaskEditorModal
        isOpen={isTaskModalOpen}
        taskToEdit={taskToEdit}
        onClose={closeTaskModal}
        onSaveTask={saveTask}
      />

      {isDailyCheckInOpen ? (
        <DailyCheckInModal
          checkIn={todayCheckIn}
          todayDate={todayDate}
          defaultPlanningMode={settings.defaultPlanningMode}
          defaultStartHour={settings.calendarDayStartHour}
          defaultWorkingBlockMinutes={settings.defaultWorkingBlockMinutes}
          defaultPreferLowEnergyTasks={settings.lowEnergyModeDefault}
          onClose={() => setIsDailyCheckInOpen(false)}
          onSave={handleSaveTodayCheckIn}
        />
      ) : null}

      <ManualWorkLogModal
        isOpen={isManualWorkLogOpen}
        tasks={allTasks}
        workingBlocks={todayCheckIn?.workingBlocks ?? []}
        plannedBlocks={todayPlannedBlocks}
        onClose={() => setIsManualWorkLogOpen(false)}
        onSave={handleSaveManualWorkLog}
      />

      <EndOfDayReviewModal
        isOpen={isEndOfDayReviewOpen}
        date={todayDate}
        review={todayReview}
        checkIn={todayCheckIn}
        tasks={allTasks}
        plannedBlocks={plannedBlocks}
        timerSessions={timerSessions}
        manualWorkLogs={manualWorkLogs}
        onClose={() => setIsEndOfDayReviewOpen(false)}
        onSave={handleSaveEndOfDayReview}
      />
    </section>
  );
}
