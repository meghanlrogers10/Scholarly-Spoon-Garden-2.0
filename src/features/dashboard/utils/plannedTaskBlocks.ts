import type {
  CalendarCategory,
  CalendarItem,
} from "../../../shared/types/calendar";
import type {
  PlannedTaskBlock,
  PlannedTaskBlockStatus,
  WorkingBlock,
} from "../../../shared/types/planning";
import type { Task } from "../../../shared/types/task";
import {
  getTaskEstimateMinutes,
  getTaskSpoonCost,
} from "./todayBuilder";
import {
  formatWorkingBlockTimeRange,
  getWorkingBlockDurationMinutes,
} from "./workingBlockCalendar";

export function getPlannedBlocksForWorkingBlock(
  blockId: string,
  plannedBlocks: PlannedTaskBlock[],
) {
  return plannedBlocks.filter((block) => block.workingBlockId === blockId);
}

export function getTaskPlannedMinutes(task: Task) {
  return getTaskEstimateMinutes(task);
}

export function getWorkingBlockCapacityMinutes(block: WorkingBlock) {
  return getWorkingBlockDurationMinutes(block);
}

export function getWorkingBlockPlannedMinutes(
  block: WorkingBlock,
  plannedBlocks: PlannedTaskBlock[],
) {
  return getPlannedBlocksForWorkingBlock(block.id, plannedBlocks).reduce(
    (totalMinutes, plannedBlock) => totalMinutes + (plannedBlock.estimatedMinutes ?? 30),
    0,
  );
}

export function getWorkingBlockRemainingMinutes(
  block: WorkingBlock,
  plannedBlocks: PlannedTaskBlock[],
) {
  return (
    getWorkingBlockCapacityMinutes(block) -
    getWorkingBlockPlannedMinutes(block, plannedBlocks)
  );
}

export function createPlannedTaskBlockFromTask(
  task: Task,
  workingBlockId: string,
  date: string,
): PlannedTaskBlock {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    date,
    workingBlockId,
    taskId: task.id,
    titleSnapshot: task.title,
    area: task.area,
    estimatedMinutes: getTaskPlannedMinutes(task),
    spoonCost: getTaskSpoonCost(task),
    status: "planned",
    createdAt: now,
    updatedAt: now,
  };
}

export function getPlannedTaskBlockTimeRange(
  plannedBlock: PlannedTaskBlock,
  workingBlock?: WorkingBlock,
) {
  if (plannedBlock.startTime && plannedBlock.endTime) {
    return `${plannedBlock.startTime}-${plannedBlock.endTime}`;
  }

  return workingBlock ? formatWorkingBlockTimeRange(workingBlock) : "No time set";
}

export function mapPlannedTaskBlocksToCalendarEvents(
  plannedBlocks: PlannedTaskBlock[],
  workingBlocks: WorkingBlock[],
): CalendarItem[] {
  const workingBlockById = new Map(workingBlocks.map((block) => [block.id, block]));

  return plannedBlocks.map((plannedBlock) => {
    const workingBlock = workingBlockById.get(plannedBlock.workingBlockId);

    return {
      id: `planned-task-${plannedBlock.id}`,
      entityId: plannedBlock.id,
      dayOffset: getDayOffsetFromDateKey(plannedBlock.date),
      title: `Plan: ${plannedBlock.titleSnapshot}`,
      category: getCalendarCategory(plannedBlock.area),
      source: "planned-task",
      time: plannedBlock.startTime ?? workingBlock?.startTime,
      endTime: plannedBlock.endTime ?? workingBlock?.endTime,
      plannedTaskBlockStatus: plannedBlock.status,
      notes: plannedBlock.notes,
      taskId: plannedBlock.taskId,
      workingBlockId: plannedBlock.workingBlockId,
      estimatedMinutes: plannedBlock.estimatedMinutes,
      spoonCost: plannedBlock.spoonCost,
    };
  });
}

function getCalendarCategory(area: PlannedTaskBlock["area"]): CalendarCategory {
  if (area === "Research") return "Research";
  if (area === "Teaching") return "Teaching";
  if (area === "Service") return "Service";

  return "Other";
}

export function getDayPlannedMinutes(plannedBlocks: PlannedTaskBlock[]) {
  return plannedBlocks.reduce(
    (totalMinutes, plannedBlock) => totalMinutes + (plannedBlock.estimatedMinutes ?? 30),
    0,
  );
}

export function getDayRemainingMinutes(
  workingBlocks: WorkingBlock[],
  plannedBlocks: PlannedTaskBlock[],
) {
  const availableMinutes = workingBlocks.reduce(
    (totalMinutes, block) => totalMinutes + getWorkingBlockCapacityMinutes(block),
    0,
  );

  return availableMinutes - getDayPlannedMinutes(plannedBlocks);
}

export function getCapacityWarnings(
  workingBlocks: WorkingBlock[],
  plannedBlocks: PlannedTaskBlock[],
  isLowEnergyDay: boolean,
) {
  const warnings: string[] = [];

  workingBlocks.forEach((block) => {
    const remainingMinutes = getWorkingBlockRemainingMinutes(block, plannedBlocks);

    if (remainingMinutes < 0) {
      warnings.push(
        `${formatWorkingBlockTimeRange(block)} is over capacity by ${Math.abs(
          remainingMinutes,
        )} minutes.`,
      );
    }
  });

  const dayRemainingMinutes = getDayRemainingMinutes(workingBlocks, plannedBlocks);

  if (dayRemainingMinutes < 0) {
    warnings.push(
      `The planned day is over capacity by ${Math.abs(dayRemainingMinutes)} minutes.`,
    );
  }

  if (plannedBlocks.some((block) => !block.estimatedMinutes)) {
    warnings.push("At least one planned task is missing an estimate.");
  }

  if (isLowEnergyDay && plannedBlocks.length > 3) {
    warnings.push("This is a low-energy day. Too many planned tasks will fight you.");
  }

  return warnings;
}

function getDayOffsetFromDateKey(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function isValidPlannedTaskBlockStatus(
  value: unknown,
): value is PlannedTaskBlockStatus {
  return (
    value === "planned" ||
    value === "started" ||
    value === "partially-done" ||
    value === "done" ||
    value === "moved" ||
    value === "skipped"
  );
}
