import { useMemo, useState } from "react";
import type {
  DailyCheckIn,
  PlannedTaskBlock,
  WorkingBlock,
} from "../../../shared/types/planning";
import type { Task } from "../../../shared/types/task";
import type { TimerSession } from "../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../shared/types/workLog";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { getManualWorkDurationMinutes } from "../utils/actualWorkPlanning";
import {
  getPlannedBlocksForWorkingBlock,
  getWorkingBlockCapacityMinutes,
  getWorkingBlockPlannedMinutes,
  getWorkingBlockRemainingMinutes,
} from "../utils/plannedTaskBlocks";
import {
  formatWorkingBlockDuration,
  formatWorkingBlockTimeRange,
} from "../utils/workingBlockCalendar";
import { getTaskEstimateMinutes } from "../utils/todayBuilder";

type TodaysWorkBlocksCardProps = {
  checkIn?: DailyCheckIn;
  tasks: Task[];
  plannedBlocks: PlannedTaskBlock[];
  timerSessions: TimerSession[];
  manualWorkLogs: ManualWorkLogEntry[];
  onStartCheckIn: () => void;
  onPlanTaskInBlock: (taskId: string, workingBlockId: string) => void;
  onRemovePlannedTaskBlock: (plannedBlockId: string) => void;
  onMarkTaskDone: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onLogWork: () => void;
};

function getOpenTasks(tasks: Task[]) {
  return tasks
    .filter((task) => task.status === "todo")
    .sort((a, b) => {
      if (a.today !== b.today) {
        return a.today ? -1 : 1;
      }

      return a.title.localeCompare(b.title);
    });
}

function getBlockActualMinutes(
  block: WorkingBlock,
  timerSessions: TimerSession[],
  manualWorkLogs: ManualWorkLogEntry[],
) {
  const timerMinutes = timerSessions.reduce((totalMinutes, session) => {
    if (session.workingBlockId !== block.id) {
      return totalMinutes;
    }

    return totalMinutes + Math.round(session.durationSeconds / 60);
  }, 0);
  const manualMinutes = manualWorkLogs.reduce((totalMinutes, entry) => {
    if (entry.workingBlockId !== block.id) {
      return totalMinutes;
    }

    return totalMinutes + getManualWorkDurationMinutes(entry);
  }, 0);

  return timerMinutes + manualMinutes;
}

function PlannedTaskRow({
  plannedBlock,
  task,
  onEditTask,
  onMarkTaskDone,
  onRemovePlannedTaskBlock,
}: {
  plannedBlock: PlannedTaskBlock;
  task?: Task;
  onEditTask: (task: Task) => void;
  onMarkTaskDone: (taskId: string) => void;
  onRemovePlannedTaskBlock: (plannedBlockId: string) => void;
}) {
  return (
    <article className="work-block-task-row">
      <div>
        <strong>{task?.title ?? plannedBlock.titleSnapshot}</strong>
        <span>
          {plannedBlock.area ?? task?.area ?? "Other"} ·{" "}
          {formatWorkingBlockDuration(plannedBlock.estimatedMinutes ?? 30)} ·{" "}
          {plannedBlock.spoonCost ?? task?.spoonCost ?? "?"} spoons ·{" "}
          {plannedBlock.status}
        </span>
      </div>

      <div className="work-block-task-actions">
        {task ? (
          <>
            <button
              className="text-button"
              type="button"
              onClick={() => onEditTask(task)}
            >
              Edit
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => onMarkTaskDone(task.id)}
            >
              Done
            </button>
          </>
        ) : null}
        <button
          className="text-button"
          type="button"
          onClick={() => onRemovePlannedTaskBlock(plannedBlock.id)}
        >
          Remove from block
        </button>
      </div>
    </article>
  );
}

export function TodaysWorkBlocksCard({
  checkIn,
  tasks,
  plannedBlocks,
  timerSessions,
  manualWorkLogs,
  onStartCheckIn,
  onPlanTaskInBlock,
  onRemovePlannedTaskBlock,
  onMarkTaskDone,
  onEditTask,
  onLogWork,
}: TodaysWorkBlocksCardProps) {
  const [selectedTaskByBlockId, setSelectedTaskByBlockId] = useState<
    Record<string, string>
  >({});
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const openTasks = useMemo(() => getOpenTasks(tasks), [tasks]);
  const workingBlocks = checkIn?.workingBlocks ?? [];

  function handleAddTaskToBlock(workingBlockId: string, fallbackTaskId: string) {
    const selectedTaskId = selectedTaskByBlockId[workingBlockId] ?? fallbackTaskId;

    if (!selectedTaskId) {
      return;
    }

    onPlanTaskInBlock(selectedTaskId, workingBlockId);
    setSelectedTaskByBlockId((currentSelections) => ({
      ...currentSelections,
      [workingBlockId]: "",
    }));
  }

  return (
    <Card className="todays-work-blocks-card">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Block-first planning</p>
          <h2>Today&apos;s Work Blocks</h2>
          <p className="muted-text">
            Available time containers with the planned tasks placed inside them.
          </p>
        </div>

        <div className="todays-work-blocks-actions">
          <Button variant="soft" onClick={onStartCheckIn}>
            {checkIn ? "Edit Daily Check-In" : "Start Daily Check-In"}
          </Button>
          <Button variant="soft" onClick={onLogWork}>
            Log work
          </Button>
        </div>
      </div>

      {!checkIn || workingBlocks.length === 0 ? (
        <div className="work-block-empty-state">
          <p className="muted-text">No work blocks saved for today yet.</p>
          <Button type="button" onClick={onStartCheckIn}>
            Start Daily Check-In
          </Button>
        </div>
      ) : (
        <div className="work-block-list">
          {workingBlocks.map((block) => {
            const blockPlannedTasks = getPlannedBlocksForWorkingBlock(
              block.id,
              plannedBlocks,
            );
            const plannedTaskIds = new Set(
              blockPlannedTasks.map((plannedBlock) => plannedBlock.taskId),
            );
            const availableTasks = openTasks.filter(
              (task) => !plannedTaskIds.has(task.id),
            );
            const capacityMinutes = getWorkingBlockCapacityMinutes(block);
            const plannedMinutes = getWorkingBlockPlannedMinutes(
              block,
              plannedBlocks,
            );
            const remainingMinutes = getWorkingBlockRemainingMinutes(
              block,
              plannedBlocks,
            );
            const actualMinutes = getBlockActualMinutes(
              block,
              timerSessions,
              manualWorkLogs,
            );
            const selectedTaskId =
              selectedTaskByBlockId[block.id] ?? availableTasks[0]?.id ?? "";
            const isOverCapacity = plannedMinutes > capacityMinutes;

            return (
              <section
                className={`work-block-card${
                  isOverCapacity ? " work-block-card--over-capacity" : ""
                }`}
                key={block.id}
              >
                <div className="work-block-card-header">
                  <div>
                    <h3>{formatWorkingBlockTimeRange(block)}</h3>
                    <p className="muted-text">
                      {formatWorkingBlockDuration(capacityMinutes)} available
                    </p>
                  </div>

                  <div className="work-block-meta">
                    <span className="pill">{block.status}</span>
                    <span>{formatWorkingBlockDuration(plannedMinutes)} planned</span>
                    <span>
                      {formatWorkingBlockDuration(Math.max(remainingMinutes, 0))} open
                    </span>
                    {actualMinutes > 0 ? (
                      <span>{formatWorkingBlockDuration(actualMinutes)} actual</span>
                    ) : null}
                  </div>
                </div>

                {block.notes ? (
                  <p className="work-block-notes">{block.notes}</p>
                ) : null}

                {isOverCapacity ? (
                  <p className="work-block-capacity-warning">
                    Over capacity by{" "}
                    {formatWorkingBlockDuration(Math.abs(remainingMinutes))}.
                  </p>
                ) : null}

                <div className="work-block-task-list">
                  {blockPlannedTasks.length === 0 ? (
                    <p className="muted-text">
                      No planned tasks in this block yet.
                    </p>
                  ) : (
                    blockPlannedTasks.map((plannedBlock) => (
                      <PlannedTaskRow
                        key={plannedBlock.id}
                        plannedBlock={plannedBlock}
                        task={taskById.get(plannedBlock.taskId)}
                        onEditTask={onEditTask}
                        onMarkTaskDone={onMarkTaskDone}
                        onRemovePlannedTaskBlock={onRemovePlannedTaskBlock}
                      />
                    ))
                  )}
                </div>

                <div className="work-block-add-task">
                  {availableTasks.length === 0 ? (
                    <p className="muted-text">No open tasks available.</p>
                  ) : (
                    <>
                      <label>
                        <span>Add task to this block</span>
                        <select
                          value={selectedTaskId}
                          onChange={(event) =>
                            setSelectedTaskByBlockId((currentSelections) => ({
                              ...currentSelections,
                              [block.id]: event.target.value,
                            }))
                          }
                        >
                          {availableTasks.map((task) => (
                            <option key={task.id} value={task.id}>
                              {task.today ? "Today: " : ""}
                              {task.title} · {task.area} ·{" "}
                              {formatWorkingBlockDuration(getTaskEstimateMinutes(task))}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button
                        type="button"
                        variant="soft"
                        disabled={!selectedTaskId}
                        onClick={() => handleAddTaskToBlock(block.id, selectedTaskId)}
                      >
                        Add
                      </Button>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Card>
  );
}
