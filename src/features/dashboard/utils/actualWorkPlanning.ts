import type { TimerSession } from "../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../shared/types/workLog";
import type {
  PlannedTaskBlock,
  WorkingBlock,
} from "../../../shared/types/planning";

type ActualWorkPlanningInput = {
  taskId?: string;
  workingBlockId?: string;
  plannedTaskBlockId?: string;
  workingBlocks: WorkingBlock[];
  plannedBlocks: PlannedTaskBlock[];
  now?: Date;
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMinutesFromTime(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

export function getCurrentWorkingBlock(
  now: Date,
  workingBlocks: WorkingBlock[],
) {
  const dateKey = getDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return workingBlocks.find((block) => {
    if (block.date !== dateKey || block.status === "cancelled") {
      return false;
    }

    const startMinutes = getMinutesFromTime(block.startTime);
    const endMinutes = getMinutesFromTime(block.endTime);

    return startMinutes <= currentMinutes && currentMinutes <= endMinutes;
  });
}

export function getPlannedBlocksForCurrentWorkingBlock(
  workingBlockId: string | undefined,
  plannedBlocks: PlannedTaskBlock[],
) {
  if (!workingBlockId) {
    return [];
  }

  return plannedBlocks.filter(
    (plannedBlock) => plannedBlock.workingBlockId === workingBlockId,
  );
}

export function getBestPlannedTaskMatch(
  taskId: string | undefined,
  workingBlockId: string | undefined,
  plannedBlocks: PlannedTaskBlock[],
) {
  if (taskId && workingBlockId) {
    const exactMatch = plannedBlocks.find(
      (plannedBlock) =>
        plannedBlock.taskId === taskId &&
        plannedBlock.workingBlockId === workingBlockId,
    );

    if (exactMatch) {
      return exactMatch;
    }
  }

  if (taskId) {
    const taskMatch = plannedBlocks.find(
      (plannedBlock) => plannedBlock.taskId === taskId,
    );

    if (taskMatch) {
      return taskMatch;
    }
  }

  if (workingBlockId) {
    return plannedBlocks.find(
      (plannedBlock) => plannedBlock.workingBlockId === workingBlockId,
    );
  }

  return undefined;
}

export function getActualSessionDurationMinutes(
  session: Pick<TimerSession, "durationSeconds">,
) {
  return Math.max(1, Math.round(session.durationSeconds / 60));
}

export function getManualWorkDurationMinutes(
  entry: Pick<ManualWorkLogEntry, "date" | "startTime" | "endTime">,
) {
  if (!entry.endTime) {
    return 0;
  }

  const start = new Date(`${entry.date}T${entry.startTime || "00:00"}`);
  const end = new Date(`${entry.date}T${entry.endTime}`);
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);

  return minutes > 0 ? minutes : 0;
}

export function linkActualWorkToPlanningContext({
  taskId,
  workingBlockId,
  plannedTaskBlockId,
  workingBlocks,
  plannedBlocks,
  now = new Date(),
}: ActualWorkPlanningInput) {
  const currentWorkingBlock =
    workingBlockId ||
    getCurrentWorkingBlock(now, workingBlocks)?.id;

  const selectedPlannedBlock = plannedTaskBlockId
    ? plannedBlocks.find((block) => block.id === plannedTaskBlockId)
    : getBestPlannedTaskMatch(taskId, currentWorkingBlock, plannedBlocks);

  return {
    taskId: taskId ?? selectedPlannedBlock?.taskId,
    workingBlockId: currentWorkingBlock ?? selectedPlannedBlock?.workingBlockId,
    plannedTaskBlockId: selectedPlannedBlock?.id,
  };
}
