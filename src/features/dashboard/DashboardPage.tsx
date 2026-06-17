import "./dashboard.css";
import "./calendar.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { CalendarCard } from "./components/CalendarCard";
import { CapturedItemsCard } from "./components/CapturedItemsCard";
import { DailyCheckInModal } from "./components/DailyCheckInModal";
import { DailyCheckInSummaryCard } from "./components/DailyCheckInSummaryCard";
import { DailyPlanModal } from "./components/DailyPlanModal";
import { DashboardActionsCard } from "./components/DashboardActionsCard";
import { DashboardStatusStrip } from "./components/DashboardStatusStrip";
import { EnergyTracker } from "./components/EnergyTracker";
import { EndOfDayReviewModal } from "./components/EndOfDayReviewModal";
import { LowEnergyTasksCard } from "./components/LowEnergyTasksCard";
import { ManualWorkLogModal } from "./components/ManualWorkLogModal";
import { MotivationBanner } from "./components/MotivationBanner";
import { QuickCaptureCard } from "./components/QuickCaptureCard";
import { TaskEditorModal } from "./components/TaskEditorModal";
import { TodayBuilderCard } from "./components/TodayBuilderCard";
import { TodayPlanCard } from "./components/TodayPlanCard";
import { UpcomingTasksCard } from "./components/UpcomingTasksCard";
import { WorkingSessionsCard } from "./components/WorkingSessionsCard";
import { useDailyCheckIn } from "./hooks/useDailyCheckIn";
import { useDashboardCaptures } from "./hooks/useDashboardCaptures";
import { useDashboardTasks } from "./hooks/useDashboardTasks";
import { useEndOfDayReview } from "./hooks/useEndOfDayReview";
import { useManualWorkLogs } from "./hooks/useManualWorkLogs";
import { usePlannedTaskBlocks } from "./hooks/usePlannedTaskBlocks";
import { useMindspace } from "../mindspace/hooks/useMindspace";
import type { MindspaceItem } from "../mindspace/types";
import { getManualWorkDurationMinutes } from "./utils/actualWorkPlanning";
import {
  createPlannedTaskBlockFromTask,
  getWorkingBlockRemainingMinutes,
  mapPlannedTaskBlocksToCalendarEvents,
} from "./utils/plannedTaskBlocks";
import { getTaskEstimateMinutes } from "./utils/todayBuilder";
import { mapWorkingBlocksToCalendarEvents } from "./utils/workingBlockCalendar";
import type {
  PlannedTaskBlock,
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

function getMindspaceItemAgeDays(item: MindspaceItem) {
  const date = new Date(item.lastTouchedAt ?? item.createdAt);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function isMindspaceRadarItem(item: MindspaceItem) {
  const isOpen = item.status === "inbox" || item.status === "clarify-later";

  return (
    isOpen &&
    ((getMindspaceItemAgeDays(item) >= 7 && !item.nextAction) ||
      (item.emotionalWeight ?? 0) >= 4 ||
      !item.tinyStep)
  );
}

function getTomorrowDateKey(date: string) {
  const tomorrow = new Date(`${date}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().slice(0, 10);
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
  const [isManualWorkLogOpen, setIsManualWorkLogOpen] = useState(false);
  const [isDailyPlanOpen, setIsDailyPlanOpen] = useState(false);
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
    completedTasks,
    isTaskModalOpen,
    taskToEdit,
    createTaskFromCapture,
    saveTask,
    saveDailyPlanTasks,
    toggleTaskDone,
    markTaskDone,
    addActualMinutesToTask,
    adjustActualMinutesForTask,
    addTaskToToday,
    removeTaskFromToday,
    postponeTask,
    planTaskInWorkingBlock,
    openAddTaskModal,
    openEditTaskModal,
    closeTaskModal,
  } = useDashboardTasks();
  const { manualWorkLogs, addManualWorkLog, deleteManualWorkLog } =
    useManualWorkLogs();
  const { items: mindspaceItems } = useMindspace();
  const { getReviewForDate, saveReview } = useEndOfDayReview();
  const {
    plannedBlocks,
    getPlannedBlocksForDate,
    addPlannedTaskBlock,
    updatePlannedTaskBlock,
    removePlannedTaskBlock,
    replacePlannedTaskBlocksForDate,
  } = usePlannedTaskBlocks();
  const [timerSessions, setTimerSessions] = useLocalStorage<TimerSession[]>(
    TIMER_SESSIONS_STORAGE_KEY,
    [],
  );
  const todayReview = getReviewForDate(todayDate);
  const todayPlannedBlocks = getPlannedBlocksForDate(todayDate);
  const clarifyLaterCount = mindspaceItems.filter(
    (item) => item.status === "inbox" || item.status === "clarify-later",
  ).length;
  const avoidanceRadarCount = mindspaceItems.filter(isMindspaceRadarItem).length;

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
    if (new URLSearchParams(location.search).get("shutdownReview") === "1") {
      // Open the shutdown modal when Timer Log links back with the review query.
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

  function handleUseTodayBuilderPlan(taskIds: string[]) {
    const todayWorkingBlocks = todayCheckIn?.workingBlocks ?? [];
    const nextPlannedBlocks: PlannedTaskBlock[] = [];
    const nextPlannedTaskInputs: PlannedTaskBlock[] = [];

    Array.from(new Set(taskIds)).forEach((taskId) => {
      const task = allTasks.find((item) => item.id === taskId);

      if (!task) {
        return;
      }

      const estimateMinutes = getTaskEstimateMinutes(task);
      const bestFit =
        todayWorkingBlocks.find(
          (block) =>
            getWorkingBlockRemainingMinutes(block, nextPlannedBlocks) >=
            estimateMinutes,
        ) ?? todayWorkingBlocks[0];

      if (!bestFit) {
        addTaskToToday(taskId);
        return;
      }

      const plannedBlock = createPlannedTaskBlockFromTask(
        task,
        bestFit.id,
        todayDate,
      );

      nextPlannedBlocks.push(plannedBlock);
      nextPlannedTaskInputs.push(plannedBlock);
      planTaskInWorkingBlock(taskId, bestFit.id);
    });

    replacePlannedTaskBlocksForDate(todayDate, nextPlannedTaskInputs);
  }

  function handlePlanTaskInBlock(taskId: string, workingBlockId: string) {
    const task = allTasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    addPlannedTaskBlock(
      createPlannedTaskBlockFromTask(task, workingBlockId, todayDate),
    );
    planTaskInWorkingBlock(taskId, workingBlockId);
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
    setIsEndOfDayReviewOpen(false);
  }

  return (
    <section className="dashboard-page">
      <EnergyTracker />
      <MotivationBanner />
      <DashboardStatusStrip />

      <main id="main-container">
        <div id="layout">
          <div id="taskHints">
            <TodayPlanCard
              tasks={todayTasks}
              onToggleDone={toggleTaskDone}
              onAddTask={openAddTaskModal}
              onEditTask={openEditTaskModal}
              onOpenDailyPlan={() => setIsDailyPlanOpen(true)}
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
          </div>
        </div>

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

        <div className="dashboard-support-grid dashboard-lower-layout">
          <div className="dashboard-support-column dashboard-support-column--left">
            <DailyCheckInSummaryCard
              checkIn={todayCheckIn}
              plannedBlocks={todayPlannedBlocks}
              timerSessions={timerSessions}
              manualWorkLogs={manualWorkLogs}
              onEdit={() => setIsDailyCheckInOpen(true)}
            />

            <CapturedItemsCard
              items={capturedItems}
              onDelete={deleteCapture}
              onClearAll={clearCaptures}
              onCreateTask={(item) => createTaskFromCapture(item, deleteCapture)}
            />
          </div>

          <div className="dashboard-support-column dashboard-support-column--center">
            <TodayBuilderCard
              tasks={allTasks}
              checkIn={todayCheckIn}
              plannedBlocks={todayPlannedBlocks}
              defaultPlanningMode={settings.defaultPlanningMode}
              lowEnergyModeDefault={settings.lowEnergyModeDefault}
              maxDailySpoonsWarning={settings.maxDailySpoonsWarning}
              maxDailyTaskWarning={settings.maxDailyTaskWarning}
              realisticPlanWarnings={settings.realisticPlanWarnings}
              onUsePlan={handleUseTodayBuilderPlan}
              onPlanTaskInBlock={handlePlanTaskInBlock}
            />

            <DashboardActionsCard
              todayTaskCount={todayTasks.length}
              completedTaskCount={completedTasks.length}
              timerSessionCount={timerSessions.length}
              manualWorkLogCount={manualWorkLogs.length}
              clarifyLaterCount={clarifyLaterCount}
              avoidanceRadarCount={avoidanceRadarCount}
              onLogWork={() => setIsManualWorkLogOpen(true)}
            />
          </div>

          <div className="dashboard-support-column dashboard-support-column--right">
            <QuickCaptureCard onSave={saveCapture} />

            <Card className="end-of-day-review-card">
              <div className="card-heading-row">
                <div>
                  <p className="eyebrow">Shutdown review</p>
                  <h2>{todayReview ? "Review complete" : "End the day gently"}</h2>
                </div>
                <span className="pill">{todayReview ? "saved" : "open"}</span>
              </div>

              <p className="muted-text">
                This is a map, not a moral judgment. Capture what rolls forward
                and what tomorrow should protect.
              </p>

              {todayReview?.protectedTomorrow ? (
                <p className="muted-text">
                  <strong>Tomorrow protects:</strong>{" "}
                  {todayReview.protectedTomorrow}
                </p>
              ) : null}

              <Button type="button" onClick={() => setIsEndOfDayReviewOpen(true)}>
                {todayReview ? "Edit Shutdown Review" : "Shutdown Review"}
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <TaskEditorModal
        isOpen={isTaskModalOpen}
        taskToEdit={taskToEdit}
        onClose={closeTaskModal}
        onSaveTask={saveTask}
      />

      <DailyPlanModal
        isOpen={isDailyPlanOpen}
        onClose={() => setIsDailyPlanOpen(false)}
        onSave={saveDailyPlanTasks}
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
          onSave={saveTodayCheckIn}
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
