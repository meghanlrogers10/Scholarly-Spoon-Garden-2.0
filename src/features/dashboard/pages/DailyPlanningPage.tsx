import "../dashboard.css";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { TIMER_SESSIONS_STORAGE_KEY } from "../../../shared/constants/timerStorage";
import { useAppSettings } from "../../../shared/hooks/useAppSettings";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import type { PlannedTaskBlock } from "../../../shared/types/planning";
import type { TimerSession } from "../../../shared/types/timer";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { BlockSuggestionsCard } from "../components/BlockSuggestionsCard";
import { DailyCheckInModal } from "../components/DailyCheckInModal";
import { DailyCheckInSummaryCard } from "../components/DailyCheckInSummaryCard";
import { EndOfDayReviewModal } from "../components/EndOfDayReviewModal";
import { ManualWorkLogModal } from "../components/ManualWorkLogModal";
import { TaskEditorModal } from "../components/TaskEditorModal";
import { TodaysWorkBlocksCard } from "../components/TodaysWorkBlocksCard";
import { TodayBuilderCard } from "../components/TodayBuilderCard";
import { useDailyCheckIn } from "../hooks/useDailyCheckIn";
import { useDashboardTasks } from "../hooks/useDashboardTasks";
import { useEndOfDayReview } from "../hooks/useEndOfDayReview";
import { useManualWorkLogs } from "../hooks/useManualWorkLogs";
import { usePlannedTaskBlocks } from "../hooks/usePlannedTaskBlocks";
import { getManualWorkDurationMinutes } from "../utils/actualWorkPlanning";
import { buildBlockSuggestions } from "../utils/blockSuggestions";
import {
  createPlannedTaskBlockFromTask,
  getWorkingBlockRemainingMinutes,
} from "../utils/plannedTaskBlocks";
import { getTaskEstimateMinutes } from "../utils/todayBuilder";

function getTomorrowDateKey(date: string) {
  const tomorrow = new Date(`${date}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().slice(0, 10);
}

export function DailyPlanningPage() {
  const { settings } = useAppSettings();
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false);
  const [isManualWorkLogOpen, setIsManualWorkLogOpen] = useState(false);
  const [isEndOfDayReviewOpen, setIsEndOfDayReviewOpen] = useState(false);
  const {
    todayDate,
    todayCheckIn,
    saveTodayCheckIn,
  } = useDailyCheckIn();
  const {
    allTasks,
    isTaskModalOpen,
    taskToEdit,
    saveTask,
    markTaskDone,
    addTaskToToday,
    removeTaskFromToday,
    postponeTask,
    planTaskInWorkingBlock,
    addActualMinutesToTask,
    ensureShutdownReviewTask,
    completeShutdownReviewTask,
    openEditTaskModal,
    closeTaskModal,
  } = useDashboardTasks();
  const { manualWorkLogs, addManualWorkLog } = useManualWorkLogs();
  const { getReviewForDate, saveReview } = useEndOfDayReview();
  const {
    plannedBlocks,
    getPlannedBlocksForDate,
    addPlannedTaskBlock,
    updatePlannedTaskBlock,
    removePlannedTaskBlock,
    replacePlannedTaskBlocksForDate,
  } = usePlannedTaskBlocks();
  const [timerSessions] = useLocalStorage<TimerSession[]>(
    TIMER_SESSIONS_STORAGE_KEY,
    [],
  );
  const todayReview = getReviewForDate(todayDate);
  const todayPlannedBlocks = getPlannedBlocksForDate(todayDate);
  const suggestionResult = useMemo(
    () =>
      buildBlockSuggestions({
        tasks: allTasks,
        dailyCheckIn: todayCheckIn,
        workingBlocks: todayCheckIn?.workingBlocks ?? [],
        plannedBlocks: todayPlannedBlocks,
        planningMode:
          todayCheckIn?.planningMode ?? settings.defaultPlanningMode ?? "balanced",
        date: todayDate,
      }),
    [
      allTasks,
      settings.defaultPlanningMode,
      todayCheckIn,
      todayDate,
      todayPlannedBlocks,
    ],
  );

  function handleSaveTodayCheckIn(
    input: Parameters<typeof saveTodayCheckIn>[0],
  ) {
    saveTodayCheckIn(input);
    ensureShutdownReviewTask(todayDate, Boolean(todayReview));
  }

  function handlePlanTaskInBlock(taskId: string, workingBlockId: string) {
    if (
      todayPlannedBlocks.some(
        (block) =>
          block.taskId === taskId && block.workingBlockId === workingBlockId,
      )
    ) {
      return;
    }

    const task = allTasks.find((item) => item.id === taskId);

    if (!task) return;

    addPlannedTaskBlock(
      createPlannedTaskBlockFromTask(task, workingBlockId, todayDate),
    );
    planTaskInWorkingBlock(taskId, workingBlockId);
  }

  function handleUseTodayBuilderPlan(taskIds: string[]) {
    const todayWorkingBlocks = todayCheckIn?.workingBlocks ?? [];
    const nextPlannedBlocks: PlannedTaskBlock[] = [];
    const nextPlannedTaskInputs: PlannedTaskBlock[] = [];

    Array.from(new Set(taskIds)).forEach((taskId) => {
      const task = allTasks.find((item) => item.id === taskId);

      if (!task) return;

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
    <section className="daily-planning-page">
      <header className="daily-planning-header">
        <div>
          <p className="eyebrow">Daily planning</p>
          <h1>Daily Plan</h1>
          <p>
            Set today&apos;s mode, map your work blocks, and let SSG suggest
            what fits.
          </p>
        </div>

        <Link className="button button-soft" to="/dashboard">
          Back to Dashboard
        </Link>
      </header>

      <div className="daily-planning-grid">
        <DailyCheckInSummaryCard
          checkIn={todayCheckIn}
          plannedBlocks={todayPlannedBlocks}
          timerSessions={timerSessions}
          manualWorkLogs={manualWorkLogs}
          onEdit={() => setIsDailyCheckInOpen(true)}
        />

        <Card
          className={`end-of-day-review-card${
            todayReview ? " is-review-done" : " is-review-open"
          }`}
        >
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Shutdown review</p>
              <h2>{todayReview ? "Review complete" : "End the day gently"}</h2>
            </div>
            <span className="pill">{todayReview ? "done" : "open"}</span>
          </div>
          <p className="muted-text">
            Close the loop on planned vs actual work, rollover, dropped tasks,
            estimate accuracy, spoons, and tomorrow protection.
          </p>
          <Button type="button" onClick={() => setIsEndOfDayReviewOpen(true)}>
            {todayReview ? "Edit Shutdown Review" : "Shutdown Review"}
          </Button>
        </Card>
      </div>

      <BlockSuggestionsCard
        result={suggestionResult}
        onAcceptTask={handlePlanTaskInBlock}
      />

      <TodaysWorkBlocksCard
        checkIn={todayCheckIn}
        tasks={allTasks}
        plannedBlocks={todayPlannedBlocks}
        timerSessions={timerSessions}
        manualWorkLogs={manualWorkLogs}
        onStartCheckIn={() => setIsDailyCheckInOpen(true)}
        onPlanTaskInBlock={handlePlanTaskInBlock}
        onRemovePlannedTaskBlock={removePlannedTaskBlock}
        onMarkTaskDone={markTaskDone}
        onEditTask={openEditTaskModal}
        onLogWork={() => setIsManualWorkLogOpen(true)}
      />

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
