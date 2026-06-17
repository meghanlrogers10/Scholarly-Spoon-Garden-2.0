import type {
  DailyCheckIn,
  EndOfDayReview,
  PlannedTaskBlock,
  PlannedTaskBlockStatus,
  PlanningMode,
  WorkingBlock,
  WorkingBlockStatus,
} from "../../../shared/types/planning";
import type { TaskArea } from "../../../shared/types/task";
import { isValidPlannedTaskBlockStatus } from "./plannedTaskBlocks";

export const DAILY_CHECK_IN_STORAGE_KEY = "ssg2.dailyCheckIns";
export const PLANNED_TASK_BLOCK_STORAGE_KEY = "ssg2.plannedTaskBlocks";
export const END_OF_DAY_REVIEW_STORAGE_KEY = "ssg2.endOfDayReviews";

export type PlanningStorageSnapshot = {
  checkIns: DailyCheckIn[];
  plannedBlocks: PlannedTaskBlock[];
  reviews: EndOfDayReview[];
};

export type PlanningCloudSnapshot = PlanningStorageSnapshot & {
  workingBlocks: WorkingBlock[];
};

export type PlanningMergeResult = PlanningStorageSnapshot & {
  addedCount: number;
  updatedCount: number;
  dedupedCount: number;
};

const planningModes: PlanningMode[] = [
  "balanced",
  "research-push",
  "teaching-survival",
  "service-triage",
  "low-energy",
  "deadline-emergency",
  "small-task-cleanup",
];

const workingBlockStatuses: WorkingBlockStatus[] = [
  "planned",
  "partially-used",
  "used",
  "missed",
  "cancelled",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

function optionalStringArray(value: unknown) {
  const strings = asStringArray(value);

  return strings.length > 0 ? strings : undefined;
}

function asSpoons(value: unknown): DailyCheckIn["availableSpoons"] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : 3;
}

function asPlanningMode(value: unknown): PlanningMode {
  return planningModes.includes(value as PlanningMode)
    ? (value as PlanningMode)
    : "balanced";
}

function asBlockStatus(value: unknown): WorkingBlockStatus {
  return workingBlockStatuses.includes(value as WorkingBlockStatus)
    ? (value as WorkingBlockStatus)
    : "planned";
}

function asArea(value: unknown): TaskArea | undefined {
  if (
    value === "Research" ||
    value === "Teaching" ||
    value === "Service" ||
    value === "Personal" ||
    value === "Other"
  ) {
    return value;
  }

  return undefined;
}

function asEnergy(value: unknown): EndOfDayReview["energyEnd"] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : undefined;
}

function timestamp(value: { createdAt?: string; updatedAt?: string }) {
  const time = new Date(value.updatedAt || value.createdAt || "").getTime();

  return Number.isFinite(time) ? time : 0;
}

function countUpdate<T extends { createdAt?: string; updatedAt?: string }>(
  before: T,
  after: T,
) {
  return timestamp(after) !== timestamp(before) ? 1 : 0;
}

function newerByTimestamp<T extends { createdAt?: string; updatedAt?: string }>(
  localValue: T,
  cloudValue: T,
) {
  return timestamp(cloudValue) > timestamp(localValue) ? cloudValue : localValue;
}

export function normalizeWorkingBlock(
  value: unknown,
  fallbackDate?: string,
): WorkingBlock | null {
  if (!isRecord(value)) {
    return null;
  }

  const date = asString(value.date) ?? fallbackDate;
  const startTime = asString(value.startTime);
  const endTime = asString(value.endTime);

  if (!date || !startTime || !endTime) {
    return null;
  }

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    date,
    startTime,
    endTime,
    status: asBlockStatus(value.status),
    plannedTaskIds: optionalStringArray(value.plannedTaskIds),
    actualSessionIds: optionalStringArray(value.actualSessionIds),
    notes: asString(value.notes),
  };
}

export function normalizeWorkingBlocks(value: unknown): WorkingBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((block) => normalizeWorkingBlock(block))
    .filter((block): block is WorkingBlock => Boolean(block));
}

export function normalizeDailyCheckIn(value: unknown): DailyCheckIn | null {
  if (!isRecord(value)) {
    return null;
  }

  const date = asString(value.date);

  if (!date) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    date,
    availableSpoons: asSpoons(value.availableSpoons),
    planningMode: asPlanningMode(value.planningMode),
    workingBlocks: Array.isArray(value.workingBlocks)
      ? value.workingBlocks
          .map((block) => normalizeWorkingBlock(block, date))
          .filter((block): block is WorkingBlock => Boolean(block))
      : [],
    avoidNotes: asString(value.avoidNotes),
    protectNotes: asString(value.protectNotes),
    preferLowEnergyTasks:
      typeof value.preferLowEnergyTasks === "boolean"
        ? value.preferLowEnergyTasks
        : undefined,
    avoidHighEmotionTasks:
      typeof value.avoidHighEmotionTasks === "boolean"
        ? value.avoidHighEmotionTasks
        : undefined,
    hardStopTime: asString(value.hardStopTime),
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
  };
}

export function normalizeDailyCheckIns(value: unknown): DailyCheckIn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeDailyCheckIn)
    .filter((checkIn): checkIn is DailyCheckIn => Boolean(checkIn));
}

export function normalizePlannedTaskBlock(
  value: unknown,
): PlannedTaskBlock | null {
  if (!isRecord(value)) {
    return null;
  }

  const date = asString(value.date);
  const workingBlockId = asString(value.workingBlockId);
  const taskId = asString(value.taskId);
  const titleSnapshot = asString(value.titleSnapshot);

  if (!date || !workingBlockId || !taskId || !titleSnapshot) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    date,
    workingBlockId,
    taskId,
    titleSnapshot,
    area: asArea(value.area),
    startTime: asString(value.startTime),
    endTime: asString(value.endTime),
    estimatedMinutes: asNumber(value.estimatedMinutes),
    spoonCost: asNumber(value.spoonCost),
    status: isValidPlannedTaskBlockStatus(value.status)
      ? (value.status as PlannedTaskBlockStatus)
      : "planned",
    notes: asString(value.notes),
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
  };
}

export function normalizePlannedTaskBlocks(value: unknown): PlannedTaskBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizePlannedTaskBlock)
    .filter((block): block is PlannedTaskBlock => Boolean(block));
}

export function normalizeEndOfDayReview(value: unknown): EndOfDayReview | null {
  if (!isRecord(value)) {
    return null;
  }

  const date = asString(value.date);

  if (!date) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    date,
    completedTaskIds: asStringArray(value.completedTaskIds),
    rolloverTaskIds: asStringArray(value.rolloverTaskIds),
    droppedTaskIds: asStringArray(value.droppedTaskIds),
    protectedTomorrow: asString(value.protectedTomorrow),
    underestimatedNotes: asString(value.underestimatedNotes),
    interruptionNotes: asString(value.interruptionNotes),
    generalNotes: asString(value.generalNotes),
    energyEnd: asEnergy(value.energyEnd),
    tomorrowSeedTaskIds: asStringArray(value.tomorrowSeedTaskIds),
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
  };
}

export function normalizeEndOfDayReviews(value: unknown): EndOfDayReview[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeEndOfDayReview)
    .filter((review): review is EndOfDayReview => Boolean(review));
}

export function getPlanningCounts(snapshot: PlanningStorageSnapshot) {
  return {
    checkIns: snapshot.checkIns.length,
    workingBlocks: snapshot.checkIns.reduce(
      (count, checkIn) => count + checkIn.workingBlocks.length,
      0,
    ),
    plannedBlocks: snapshot.plannedBlocks.length,
    reviews: snapshot.reviews.length,
  };
}

export function flattenWorkingBlocks(checkIns: DailyCheckIn[]) {
  return checkIns.flatMap((checkIn) =>
    checkIn.workingBlocks.map((block) => ({
      ...block,
      date: block.date || checkIn.date,
    })),
  );
}

function createCheckInForWorkingBlock(block: WorkingBlock): DailyCheckIn {
  const now = new Date().toISOString();

  return {
    id: `check-in-${block.date}`,
    date: block.date,
    availableSpoons: 3,
    planningMode: "balanced",
    workingBlocks: [block],
    createdAt: now,
    updatedAt: now,
  };
}

function mergeWorkingBlocks(
  localBlocks: WorkingBlock[],
  cloudBlocks: WorkingBlock[],
) {
  const blocksById = new Map<string, WorkingBlock>();
  let addedCount = 0;
  let dedupedCount = 0;

  localBlocks.forEach((block) => {
    blocksById.set(block.id, block);
  });

  cloudBlocks.forEach((cloudBlock) => {
    const localBlock = blocksById.get(cloudBlock.id);

    if (!localBlock) {
      blocksById.set(cloudBlock.id, cloudBlock);
      addedCount += 1;
      return;
    }

    blocksById.set(localBlock.id, {
      ...cloudBlock,
      ...localBlock,
      id: localBlock.id,
      plannedTaskIds: Array.from(
        new Set([
          ...(cloudBlock.plannedTaskIds ?? []),
          ...(localBlock.plannedTaskIds ?? []),
        ]),
      ),
      actualSessionIds: Array.from(
        new Set([
          ...(cloudBlock.actualSessionIds ?? []),
          ...(localBlock.actualSessionIds ?? []),
        ]),
      ),
      status:
        localBlock.status === "cancelled" || cloudBlock.status === "cancelled"
          ? "cancelled"
          : localBlock.status,
    });
    dedupedCount += 1;
  });

  return {
    blocks: Array.from(blocksById.values()).sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    ),
    addedCount,
    dedupedCount,
  };
}

function mergeCheckIns(
  localCheckIns: DailyCheckIn[],
  cloudCheckIns: DailyCheckIn[],
  cloudWorkingBlocks: WorkingBlock[],
) {
  const checkInsByDate = new Map<string, DailyCheckIn>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localCheckIns.forEach((checkIn) => {
    checkInsByDate.set(checkIn.date, checkIn);
  });

  cloudCheckIns.forEach((cloudCheckIn) => {
    const localCheckIn = checkInsByDate.get(cloudCheckIn.date);

    if (!localCheckIn) {
      checkInsByDate.set(cloudCheckIn.date, cloudCheckIn);
      addedCount += 1;
      return;
    }

    const newerCheckIn = newerByTimestamp(localCheckIn, cloudCheckIn);
    const mergedBlocks = mergeWorkingBlocks(
      localCheckIn.workingBlocks,
      cloudCheckIn.workingBlocks,
    );
    checkInsByDate.set(localCheckIn.date, {
      ...localCheckIn,
      ...newerCheckIn,
      id: localCheckIn.id,
      date: localCheckIn.date,
      workingBlocks: mergedBlocks.blocks,
    });
    updatedCount += countUpdate(localCheckIn, newerCheckIn);
    dedupedCount += 1 + mergedBlocks.dedupedCount;
    addedCount += mergedBlocks.addedCount;
  });

  cloudWorkingBlocks.forEach((cloudBlock) => {
    const currentCheckIn = checkInsByDate.get(cloudBlock.date);

    if (!currentCheckIn) {
      checkInsByDate.set(cloudBlock.date, createCheckInForWorkingBlock(cloudBlock));
      addedCount += 1;
      return;
    }

    const mergedBlocks = mergeWorkingBlocks(
      currentCheckIn.workingBlocks,
      [cloudBlock],
    );
    checkInsByDate.set(currentCheckIn.date, {
      ...currentCheckIn,
      workingBlocks: mergedBlocks.blocks,
    });
    addedCount += mergedBlocks.addedCount;
    dedupedCount += mergedBlocks.dedupedCount;
  });

  return {
    checkIns: Array.from(checkInsByDate.values()).sort(
      (a, b) => timestamp(b) - timestamp(a),
    ),
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

function getPlannedBlockKey(block: PlannedTaskBlock) {
  return `${block.date}:${block.workingBlockId}:${block.taskId}`;
}

function mergePlannedBlocks(
  localBlocks: PlannedTaskBlock[],
  cloudBlocks: PlannedTaskBlock[],
) {
  const blocksById = new Map<string, PlannedTaskBlock>();
  const idByCompositeKey = new Map<string, string>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localBlocks.forEach((block) => {
    blocksById.set(block.id, block);
    idByCompositeKey.set(getPlannedBlockKey(block), block.id);
  });

  cloudBlocks.forEach((cloudBlock) => {
    const matchingId = blocksById.has(cloudBlock.id)
      ? cloudBlock.id
      : idByCompositeKey.get(getPlannedBlockKey(cloudBlock));
    const localBlock = matchingId ? blocksById.get(matchingId) : undefined;

    if (!localBlock) {
      blocksById.set(cloudBlock.id, cloudBlock);
      idByCompositeKey.set(getPlannedBlockKey(cloudBlock), cloudBlock.id);
      addedCount += 1;
      return;
    }

    const newerBlock = newerByTimestamp(localBlock, cloudBlock);
    const mergedBlock: PlannedTaskBlock = {
      ...localBlock,
      ...newerBlock,
      id: localBlock.id,
      workingBlockId: localBlock.workingBlockId,
      taskId: localBlock.taskId,
      status:
        localBlock.status === "done" ||
        localBlock.status === "skipped" ||
        localBlock.status === "moved"
          ? localBlock.status
          : newerBlock.status,
    };

    blocksById.set(localBlock.id, mergedBlock);
    updatedCount += countUpdate(localBlock, mergedBlock);
    dedupedCount += localBlock.id !== cloudBlock.id ? 1 : 0;
  });

  return {
    plannedBlocks: Array.from(blocksById.values()).sort(
      (a, b) => timestamp(b) - timestamp(a),
    ),
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

function mergeReviews(
  localReviews: EndOfDayReview[],
  cloudReviews: EndOfDayReview[],
) {
  const reviewsByDate = new Map<string, EndOfDayReview>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localReviews.forEach((review) => {
    reviewsByDate.set(review.date, review);
  });

  cloudReviews.forEach((cloudReview) => {
    const localReview = reviewsByDate.get(cloudReview.date);

    if (!localReview) {
      reviewsByDate.set(cloudReview.date, cloudReview);
      addedCount += 1;
      return;
    }

    const newerReview = newerByTimestamp(localReview, cloudReview);
    const mergedReview: EndOfDayReview = {
      ...localReview,
      ...newerReview,
      id: localReview.id,
      date: localReview.date,
      completedTaskIds: Array.from(
        new Set([
          ...localReview.completedTaskIds,
          ...cloudReview.completedTaskIds,
        ]),
      ),
      rolloverTaskIds: Array.from(
        new Set([...localReview.rolloverTaskIds, ...cloudReview.rolloverTaskIds]),
      ),
      droppedTaskIds: Array.from(
        new Set([...localReview.droppedTaskIds, ...cloudReview.droppedTaskIds]),
      ),
      tomorrowSeedTaskIds: Array.from(
        new Set([
          ...(localReview.tomorrowSeedTaskIds ?? []),
          ...(cloudReview.tomorrowSeedTaskIds ?? []),
        ]),
      ),
    };

    reviewsByDate.set(localReview.date, mergedReview);
    updatedCount += countUpdate(localReview, mergedReview);
    dedupedCount += 1;
  });

  return {
    reviews: Array.from(reviewsByDate.values()).sort(
      (a, b) => timestamp(b) - timestamp(a),
    ),
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

export function mergePlanningForSync(
  localSnapshot: PlanningStorageSnapshot,
  cloudSnapshot: PlanningCloudSnapshot,
): PlanningMergeResult {
  const checkIns = mergeCheckIns(
    localSnapshot.checkIns,
    cloudSnapshot.checkIns,
    cloudSnapshot.workingBlocks,
  );
  const plannedBlocks = mergePlannedBlocks(
    localSnapshot.plannedBlocks,
    cloudSnapshot.plannedBlocks,
  );
  const reviews = mergeReviews(localSnapshot.reviews, cloudSnapshot.reviews);

  return {
    checkIns: checkIns.checkIns,
    plannedBlocks: plannedBlocks.plannedBlocks,
    reviews: reviews.reviews,
    addedCount:
      checkIns.addedCount + plannedBlocks.addedCount + reviews.addedCount,
    updatedCount:
      checkIns.updatedCount + plannedBlocks.updatedCount + reviews.updatedCount,
    dedupedCount:
      checkIns.dedupedCount + plannedBlocks.dedupedCount + reviews.dedupedCount,
  };
}
