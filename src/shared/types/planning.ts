import type { TaskArea } from "./task";

export type PlanningMode =
  | "balanced"
  | "research-push"
  | "teaching-survival"
  | "service-triage"
  | "low-energy"
  | "deadline-emergency"
  | "small-task-cleanup";

export type WorkingBlockStatus =
  | "planned"
  | "partially-used"
  | "used"
  | "missed"
  | "cancelled";

export type WorkingBlock = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: WorkingBlockStatus;
  plannedTaskIds?: string[];
  actualSessionIds?: string[];
  notes?: string;
};

export type DailyCheckIn = {
  id: string;
  date: string;
  availableSpoons: 1 | 2 | 3 | 4 | 5;
  planningMode: PlanningMode;
  workingBlocks: WorkingBlock[];
  avoidNotes?: string;
  protectNotes?: string;
  preferLowEnergyTasks?: boolean;
  avoidHighEmotionTasks?: boolean;
  hardStopTime?: string;
  createdAt: string;
  updatedAt: string;
};

export type TodayBuilderWarningType =
  | "time-overload"
  | "spoon-overload"
  | "too-many-anchors"
  | "missing-next-action"
  | "too-big-task"
  | "low-energy-day"
  | "deadline-pressure"
  | "no-working-blocks"
  | "empty-plan"
  | "high-emotion-load";

export type TodayBuilderWarning = {
  id: string;
  type: TodayBuilderWarningType;
  severity: "info" | "warning" | "strong";
  message: string;
  taskId?: string;
};

export type TodayPlanBucket = {
  anchorTaskIds: string[];
  backupTaskIds: string[];
  postponeTaskIds: string[];
  quickWinTaskIds: string[];
};

export type TodayBuilderResult = {
  date: string;
  availableMinutes: number;
  availableSpoons: number;
  plannedMinutes: number;
  plannedSpoons: number;
  mode: PlanningMode;
  buckets: TodayPlanBucket;
  warnings: TodayBuilderWarning[];
  generatedAt: string;
};

export type PlannedTaskBlockStatus =
  | "planned"
  | "started"
  | "partially-done"
  | "done"
  | "moved"
  | "skipped";

export type PlannedTaskBlock = {
  id: string;
  date: string;
  workingBlockId: string;
  taskId: string;
  titleSnapshot: string;
  area?: TaskArea;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  spoonCost?: number;
  status: PlannedTaskBlockStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type EndOfDayReview = {
  id: string;
  date: string;
  completedTaskIds: string[];
  rolloverTaskIds: string[];
  droppedTaskIds: string[];
  protectedTomorrow?: string;
  underestimatedNotes?: string;
  interruptionNotes?: string;
  generalNotes?: string;
  energyEnd?: 1 | 2 | 3 | 4 | 5;
  tomorrowSeedTaskIds?: string[];
  createdAt: string;
  updatedAt: string;
};
