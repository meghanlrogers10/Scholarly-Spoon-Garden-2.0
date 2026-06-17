import { useMemo, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import type { DailyCheckIn, PlanningMode } from "../../../shared/types/planning";
import type { PlannedTaskBlock, WorkingBlock } from "../../../shared/types/planning";
import type { Task } from "../../../shared/types/task";
import {
  buildTodayPlan,
  getTaskEstimateMinutes,
  getTaskSpoonCost,
} from "../utils/todayBuilder";
import { formatWorkingBlockDuration } from "../utils/workingBlockCalendar";
import {
  getCapacityWarnings,
  getWorkingBlockRemainingMinutes,
} from "../utils/plannedTaskBlocks";

type TodayBuilderCardProps = {
  tasks: Task[];
  checkIn?: DailyCheckIn;
  plannedBlocks: PlannedTaskBlock[];
  defaultPlanningMode: PlanningMode;
  lowEnergyModeDefault: boolean;
  maxDailySpoonsWarning: number;
  maxDailyTaskWarning: number;
  realisticPlanWarnings: boolean;
  onUsePlan: (taskIds: string[]) => void;
  onPlanTaskInBlock: (taskId: string, workingBlockId: string) => void;
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

function getSeverityLabel(severity: "info" | "warning" | "strong") {
  if (severity === "strong") return "Strong";
  if (severity === "warning") return "Warning";
  return "Info";
}

function TaskList({
  title,
  taskIds,
  taskById,
  emptyText,
  workingBlocks = [],
  plannedBlocks = [],
  canPlan = false,
  selectedBlockByTaskId,
  onSelectBlock,
  onPlanTaskInBlock,
}: {
  title: string;
  taskIds: string[];
  taskById: Map<string, Task>;
  emptyText: string;
  workingBlocks?: WorkingBlock[];
  plannedBlocks?: PlannedTaskBlock[];
  canPlan?: boolean;
  selectedBlockByTaskId?: Record<string, string>;
  onSelectBlock?: (taskId: string, workingBlockId: string) => void;
  onPlanTaskInBlock?: (taskId: string, workingBlockId: string) => void;
}) {
  return (
    <section className="today-builder-list-section">
      <h3>{title}</h3>
      {taskIds.length === 0 ? (
        <p className="muted-text">{emptyText}</p>
      ) : (
        <div className="today-builder-task-list">
          {taskIds.map((taskId) => {
            const task = taskById.get(taskId);

            if (!task) {
              return null;
            }
            const selectedWorkingBlockId =
              selectedBlockByTaskId?.[task.id] ?? workingBlocks[0]?.id ?? "";
            const alreadyPlanned = plannedBlocks.some(
              (block) => block.taskId === task.id,
            );

            return (
              <article key={task.id} className="today-builder-task-row">
                <strong>{task.title}</strong>
                <span>
                  {getTaskEstimateMinutes(task)} min · {getTaskSpoonCost(task)}{" "}
                  spoons
                  {task.nextAction ? ` · Next: ${task.nextAction}` : ""}
                </span>
                {canPlan ? (
                  <div className="today-builder-plan-row">
                    <select
                      value={selectedWorkingBlockId}
                      disabled={workingBlocks.length === 0}
                      onChange={(event) =>
                        onSelectBlock?.(task.id, event.target.value)
                      }
                    >
                      {workingBlocks.length === 0 ? (
                        <option value="">No working blocks</option>
                      ) : (
                        workingBlocks.map((block) => (
                          <option key={block.id} value={block.id}>
                            {block.startTime}-{block.endTime} ·{" "}
                            {formatWorkingBlockDuration(
                              getWorkingBlockRemainingMinutes(block, plannedBlocks),
                            )}{" "}
                            open
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      className="text-button"
                      type="button"
                      disabled={!selectedWorkingBlockId}
                      onClick={() =>
                        onPlanTaskInBlock?.(task.id, selectedWorkingBlockId)
                      }
                    >
                      {alreadyPlanned ? "Plan again" : "Plan in block"}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function TodayBuilderCard({
  tasks,
  checkIn,
  plannedBlocks,
  defaultPlanningMode,
  lowEnergyModeDefault,
  maxDailySpoonsWarning,
  maxDailyTaskWarning,
  realisticPlanWarnings,
  onUsePlan,
  onPlanTaskInBlock,
}: TodayBuilderCardProps) {
  const [, setRebuildCount] = useState(0);
  const [selectedBlockByTaskId, setSelectedBlockByTaskId] = useState<
    Record<string, string>
  >({});
  const result = buildTodayPlan(tasks, checkIn, {
    defaultMode: defaultPlanningMode,
    lowEnergyModeDefault,
    maxDailySpoonsWarning,
    maxDailyTaskWarning,
  });
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const recommendedTaskIds = [
    ...result.buckets.anchorTaskIds,
    ...result.buckets.quickWinTaskIds,
  ];
  const workingBlocks = checkIn?.workingBlocks ?? [];
  const capacityWarnings = realisticPlanWarnings
    ? getCapacityWarnings(workingBlocks, plannedBlocks, result.mode === "low-energy")
    : [];
  const visibleWarnings = realisticPlanWarnings ? result.warnings : [];

  function handleSelectBlock(taskId: string, workingBlockId: string) {
    setSelectedBlockByTaskId((currentSelections) => ({
      ...currentSelections,
      [taskId]: workingBlockId,
    }));
  }

  return (
    <Card className="today-builder-card">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Planning brain</p>
          <h2>Today Builder</h2>
          <p className="muted-text">A reality check before the day gets loud.</p>
        </div>

        <div className="today-builder-actions">
          <Button variant="soft" onClick={() => setRebuildCount((count) => count + 1)}>
            Rebuild plan
          </Button>
          <Button
            type="button"
            disabled={recommendedTaskIds.length === 0}
            onClick={() => onUsePlan(recommendedTaskIds)}
          >
            Use this plan
          </Button>
        </div>
      </div>

      <div className="today-builder-metrics">
        <span>{planningModeLabels[result.mode]}</span>
        <span>
          {formatWorkingBlockDuration(result.availableMinutes)} available
        </span>
        <span>
          {formatWorkingBlockDuration(result.plannedMinutes)} planned
        </span>
        <span>
          {result.plannedSpoons}/{result.availableSpoons || "?"} spoons
        </span>
      </div>

      {visibleWarnings.length > 0 ? (
        <div className="today-builder-warnings">
          {visibleWarnings.slice(0, 5).map((warning) => (
            <p
              key={warning.id}
              className={`today-builder-warning today-builder-warning--${warning.severity}`}
            >
              <strong>{getSeverityLabel(warning.severity)}:</strong>{" "}
              {warning.message}
            </p>
          ))}
          {capacityWarnings.map((warning) => (
            <p
              key={warning}
              className="today-builder-warning today-builder-warning--warning"
            >
              <strong>Warning:</strong> {warning}
            </p>
          ))}
        </div>
      ) : capacityWarnings.length > 0 ? (
        <div className="today-builder-warnings">
          {capacityWarnings.map((warning) => (
            <p
              key={warning}
              className="today-builder-warning today-builder-warning--warning"
            >
              <strong>Warning:</strong> {warning}
            </p>
          ))}
        </div>
      ) : (
        <p className="muted-text">This plan looks reasonably sized.</p>
      )}

      <div className="today-builder-grid">
        <TaskList
          title="Anchors"
          taskIds={result.buckets.anchorTaskIds}
          taskById={taskById}
          emptyText="No anchors yet. Add a concrete task or check-in."
          workingBlocks={workingBlocks}
          plannedBlocks={plannedBlocks}
          canPlan
          selectedBlockByTaskId={selectedBlockByTaskId}
          onSelectBlock={handleSelectBlock}
          onPlanTaskInBlock={onPlanTaskInBlock}
        />
        <TaskList
          title="Quick wins"
          taskIds={result.buckets.quickWinTaskIds}
          taskById={taskById}
          emptyText="No tiny wins surfaced."
          workingBlocks={workingBlocks}
          plannedBlocks={plannedBlocks}
          canPlan
          selectedBlockByTaskId={selectedBlockByTaskId}
          onSelectBlock={handleSelectBlock}
          onPlanTaskInBlock={onPlanTaskInBlock}
        />
        <TaskList
          title="Low-energy backup"
          taskIds={result.buckets.backupTaskIds}
          taskById={taskById}
          emptyText="No backup tasks found."
        />
        <TaskList
          title="Postpone"
          taskIds={result.buckets.postponeTaskIds}
          taskById={taskById}
          emptyText="Nothing obvious to postpone."
        />
      </div>
    </Card>
  );
}
