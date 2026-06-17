import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import type {
  PlannedTaskBlock,
  PlannedTaskBlockStatus,
} from "../../../shared/types/planning";
import {
  normalizePlannedTaskBlocks,
  PLANNED_TASK_BLOCK_STORAGE_KEY,
} from "../utils/planningStorage";

type PlannedTaskBlockInput = Omit<
  PlannedTaskBlock,
  "id" | "createdAt" | "updatedAt" | "status"
> & {
  status?: PlannedTaskBlockStatus;
};

export function usePlannedTaskBlocks() {
  const [storedBlocks, setStoredBlocks] = useLocalStorage<unknown[]>(
    PLANNED_TASK_BLOCK_STORAGE_KEY,
    [],
  );
  const plannedBlocks = normalizePlannedTaskBlocks(storedBlocks);

  function getPlannedBlocksForDate(date: string) {
    return plannedBlocks.filter((block) => block.date === date);
  }

  function addPlannedTaskBlock(input: PlannedTaskBlockInput) {
    const now = new Date().toISOString();

    setStoredBlocks((currentValue) => {
      const currentBlocks = normalizePlannedTaskBlocks(currentValue);
      const existing = currentBlocks.find(
        (block) =>
          block.date === input.date &&
          block.workingBlockId === input.workingBlockId &&
          block.taskId === input.taskId,
      );

      if (existing) {
        return currentBlocks.map((block) =>
          block.id === existing.id
            ? {
                ...block,
                ...input,
                status: input.status ?? block.status,
                updatedAt: now,
              }
            : block,
        );
      }

      const nextBlock: PlannedTaskBlock = {
        ...input,
        id: crypto.randomUUID(),
        status: input.status ?? "planned",
        createdAt: now,
        updatedAt: now,
      };

      return [nextBlock, ...currentBlocks];
    });
  }

  function updatePlannedTaskBlock(
    plannedBlockId: string,
    updates: Partial<PlannedTaskBlock>,
  ) {
    const now = new Date().toISOString();

    setStoredBlocks((currentValue) =>
      normalizePlannedTaskBlocks(currentValue).map((block) =>
        block.id === plannedBlockId
          ? {
              ...block,
              ...updates,
              id: block.id,
              updatedAt: now,
            }
          : block,
      ),
    );
  }

  function movePlannedTaskBlock(
    plannedBlockId: string,
    workingBlockId: string,
  ) {
    updatePlannedTaskBlock(plannedBlockId, { workingBlockId });
  }

  function removePlannedTaskBlock(plannedBlockId: string) {
    setStoredBlocks((currentValue) =>
      normalizePlannedTaskBlocks(currentValue).filter(
        (block) => block.id !== plannedBlockId,
      ),
    );
  }

  function clearPlannedTaskBlocksForDate(date: string) {
    setStoredBlocks((currentValue) =>
      normalizePlannedTaskBlocks(currentValue).filter(
        (block) => block.date !== date,
      ),
    );
  }

  function replacePlannedTaskBlocksForDate(
    date: string,
    inputs: PlannedTaskBlockInput[],
  ) {
    const now = new Date().toISOString();
    const nextBlocks: PlannedTaskBlock[] = [];
    const seenKeys = new Set<string>();

    inputs.forEach((input) => {
      const key = `${input.date}:${input.taskId}`;

      if (input.date !== date || seenKeys.has(key)) {
        return;
      }

      seenKeys.add(key);
      nextBlocks.push({
        ...input,
        id: crypto.randomUUID(),
        status: input.status ?? "planned",
        createdAt: now,
        updatedAt: now,
      });
    });

    setStoredBlocks((currentValue) => [
      ...nextBlocks,
      ...normalizePlannedTaskBlocks(currentValue).filter(
        (block) => block.date !== date,
      ),
    ]);
  }

  return {
    plannedBlocks,
    getPlannedBlocksForDate,
    addPlannedTaskBlock,
    updatePlannedTaskBlock,
    movePlannedTaskBlock,
    removePlannedTaskBlock,
    clearPlannedTaskBlocksForDate,
    replacePlannedTaskBlocksForDate,
  };
}
