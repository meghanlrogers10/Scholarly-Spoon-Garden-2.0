import type { Task, TaskType } from "../../../shared/types/task";
import type {
  DailyCheckIn,
  PlanningMode,
  TodayBuilderResult,
  TodayBuilderWarning,
  TodayBuilderWarningType,
  WorkingBlock,
} from "../../../shared/types/planning";
import { getWorkingBlockDurationMinutes } from "./workingBlockCalendar";

type ScoredTask = {
  task: Task;
  estimateMinutes: number;
  spoonCost: number;
  score: number;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
};

type TodayBuilderContext = {
  date: string;
  mode: PlanningMode;
  availableMinutes: number;
  availableSpoons: number;
  checkIn?: DailyCheckIn;
};

export type TodayBuilderOptions = {
  defaultMode?: PlanningMode;
  lowEnergyModeDefault?: boolean;
  maxDailySpoonsWarning?: number;
  maxDailyTaskWarning?: number;
};

export const taskEstimateDefaults: Record<TaskType, number> = {
  writing: 60,
  reading: 45,
  grading: 60,
  "class-prep": 60,
  "email-admin": 20,
  "meeting-prep": 30,
  analysis: 75,
  coding: 75,
  service: 45,
  advising: 30,
  teaching: 45,
  research: 60,
  mindspace: 20,
  other: 30,
};

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateDistanceInDays(date?: string, todayDate = getTodayDateKey()) {
  if (!date) {
    return undefined;
  }

  const today = new Date(`${todayDate}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);
  const timestamp = target.getTime();

  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return Math.round((timestamp - today.getTime()) / 86_400_000);
}

export function calculateAvailableMinutes(blocks: WorkingBlock[]) {
  return blocks.reduce(
    (totalMinutes, block) => totalMinutes + getWorkingBlockDurationMinutes(block),
    0,
  );
}

export function getTaskEstimateMinutes(task: Task) {
  return (
    task.adjustedEstimatedMinutes ??
    task.estimatedMinutes ??
    taskEstimateDefaults[task.taskType ?? "other"] ??
    30
  );
}

export function getTaskSpoonCost(task: Task) {
  if (task.spoonCost) {
    return task.spoonCost;
  }

  if (task.lowEnergyFriendly) return 1;
  if (task.taskType === "email-admin" || task.source === "quick-capture") return 1;
  if (task.taskType === "writing" || task.taskType === "analysis") return 3;
  if (task.taskType === "coding") return 3;
  if (
    task.taskType === "service" ||
    task.taskType === "advising" ||
    task.taskType === "class-prep" ||
    task.taskType === "teaching"
  ) {
    return 2;
  }

  return 2;
}

function isActiveTask(task: Task) {
  return Boolean(task.title?.trim()) && task.status !== "done" && task.status !== "archived";
}

function isWaitingTask(task: Task) {
  const haystack = `${task.title} ${task.notes ?? ""} ${task.nextAction ?? ""}`.toLowerCase();

  return haystack.includes("waiting on") || haystack.includes("blocked by");
}

function matchesMode(task: Task, mode: PlanningMode) {
  if (mode === "research-push") {
    return (
      task.area === "Research" ||
      task.taskType === "writing" ||
      task.taskType === "analysis" ||
      task.taskType === "coding" ||
      task.taskType === "research"
    );
  }

  if (mode === "teaching-survival") {
    return (
      task.area === "Teaching" ||
      task.taskType === "grading" ||
      task.taskType === "class-prep" ||
      task.source === "announcement" ||
      task.source === "ta-follow-up"
    );
  }

  if (mode === "service-triage") {
    return (
      task.area === "Service" ||
      task.taskType === "service" ||
      task.taskType === "advising" ||
      task.source === "committee-item" ||
      task.source === "admin-other"
    );
  }

  if (mode === "low-energy") {
    return task.lowEnergyFriendly || getTaskSpoonCost(task) <= 2;
  }

  if (mode === "deadline-emergency") {
    const distance = getDateDistanceInDays(task.dueDate);
    return distance !== undefined && distance <= 3;
  }

  if (mode === "small-task-cleanup") {
    return (
      getTaskEstimateMinutes(task) <= 25 ||
      task.taskType === "email-admin" ||
      Boolean(task.nextAction)
    );
  }

  return true;
}

export function scoreTaskForToday(task: Task, context: TodayBuilderContext) {
  const distance = getDateDistanceInDays(task.dueDate, context.date);
  let score = 0;

  if (task.today !== false) score += 35;
  if (task.priority === "High") score += 22;
  if (task.priority === "Medium") score += 10;
  if (distance !== undefined && distance < 0) score += 32;
  if (distance === 0) score += 30;
  if (distance !== undefined && distance > 0 && distance <= 3) score += 18;
  if (distance !== undefined && distance > 3 && distance <= 7) score += 8;
  if (matchesMode(task, context.mode)) score += 18;
  if (task.nextAction) score += 7;
  if (task.lowEnergyFriendly) score += context.mode === "low-energy" ? 16 : 5;

  const estimate = getTaskEstimateMinutes(task);
  const spoons = getTaskSpoonCost(task);

  if (estimate <= 20) score += 5;
  if (estimate > Math.max(context.availableMinutes / 2, 45)) score -= 16;
  if (spoons > context.availableSpoons) score -= 12;
  if (isWaitingTask(task)) score -= 40;

  return score;
}

function getCandidateTasks(tasks: Task[], date: string) {
  return tasks.filter((task) => {
    if (!isActiveTask(task) || isWaitingTask(task)) {
      return false;
    }

    const distance = getDateDistanceInDays(task.dueDate, date);

    return (
      task.today !== false ||
      task.priority === "High" ||
      (distance !== undefined && distance <= 7)
    );
  });
}

function addWarning(
  warnings: TodayBuilderWarning[],
  type: TodayBuilderWarningType,
  severity: TodayBuilderWarning["severity"],
  message: string,
  taskId?: string,
) {
  warnings.push({
    id: `${type}-${warnings.length + 1}-${taskId ?? "plan"}`,
    type,
    severity,
    message,
    taskId,
  });
}

export function buildTodayPlan(
  tasks: Task[],
  checkIn: DailyCheckIn | undefined,
  options: TodayBuilderOptions = {},
): TodayBuilderResult {
  const date = checkIn?.date ?? getTodayDateKey();
  const mode =
    checkIn?.planningMode ??
    (options.lowEnergyModeDefault ? "low-energy" : options.defaultMode) ??
    "balanced";
  const workingBlocks = checkIn?.workingBlocks ?? [];
  const availableMinutes = calculateAvailableMinutes(workingBlocks);
  const availableSpoons = checkIn?.availableSpoons ?? 0;
  const context: TodayBuilderContext = {
    date,
    mode,
    availableMinutes,
    availableSpoons,
    checkIn,
  };
  const warnings: TodayBuilderWarning[] = [];
  const candidates = getCandidateTasks(tasks, date);
  const scoredTasks: ScoredTask[] = candidates
    .map((task) => {
      const distance = getDateDistanceInDays(task.dueDate, date);

      return {
        task,
        estimateMinutes: getTaskEstimateMinutes(task),
        spoonCost: getTaskSpoonCost(task),
        score: scoreTaskForToday(task, context),
        isOverdue: distance !== undefined && distance < 0,
        isDueToday: distance === 0,
        isDueSoon: distance !== undefined && distance >= 0 && distance <= 7,
      };
    })
    .sort((a, b) => b.score - a.score);

  const anchorTasks: ScoredTask[] = [];
  let plannedMinutes = 0;
  let plannedSpoons = 0;

  for (const scoredTask of scoredTasks) {
    const hardLimit = Math.max(availableMinutes, 90);
    const spoonLimit = Math.max(availableSpoons, 2);

    if (anchorTasks.length >= 3) {
      continue;
    }

    if (
      plannedMinutes + scoredTask.estimateMinutes <= hardLimit &&
      plannedSpoons + scoredTask.spoonCost <= spoonLimit
    ) {
      anchorTasks.push(scoredTask);
      plannedMinutes += scoredTask.estimateMinutes;
      plannedSpoons += scoredTask.spoonCost;
    }
  }

  const selectedIds = new Set(anchorTasks.map(({ task }) => task.id));
  const quickWins = scoredTasks
    .filter(({ task, estimateMinutes, spoonCost }) => {
      return (
        !selectedIds.has(task.id) &&
        estimateMinutes <= 25 &&
        spoonCost <= 2 &&
        Boolean(task.nextAction)
      );
    })
    .slice(0, 4);
  quickWins.forEach(({ task, estimateMinutes, spoonCost }) => {
    selectedIds.add(task.id);
    plannedMinutes += estimateMinutes;
    plannedSpoons += spoonCost;
  });

  const backupTasks = scoredTasks
    .filter(({ task, estimateMinutes, spoonCost }) => {
      return (
        !selectedIds.has(task.id) &&
        (task.lowEnergyFriendly || spoonCost <= 2 || estimateMinutes <= 20)
      );
    })
    .slice(0, 4);

  const postponeTasks = scoredTasks
    .filter(({ task }) => !selectedIds.has(task.id))
    .slice(0, 5);

  if (!checkIn) {
    addWarning(
      warnings,
      "empty-plan",
      "warning",
      "No Daily Check-In is saved yet. Build the day map before trusting this plan.",
    );
  }

  if (workingBlocks.length === 0) {
    addWarning(
      warnings,
      "no-working-blocks",
      "warning",
      "No working blocks are saved for today. This plan has no time container yet.",
    );
  }

  if (candidates.length === 0) {
    addWarning(
      warnings,
      "empty-plan",
      "info",
      "No active candidates surfaced. Capture one concrete task before building today.",
    );
  }

  if (availableMinutes > 0 && plannedMinutes > availableMinutes) {
    addWarning(
      warnings,
      "time-overload",
      "strong",
      "This plan is probably too much for the time you gave yourself.",
    );
  }

  if (availableSpoons > 0 && plannedSpoons > availableSpoons) {
    addWarning(
      warnings,
      "spoon-overload",
      "strong",
      "You have more spoons assigned than you said you had.",
    );
  }

  if (
    options.maxDailySpoonsWarning &&
    plannedSpoons > options.maxDailySpoonsWarning
  ) {
    addWarning(
      warnings,
      "spoon-overload",
      "warning",
      `This draft uses ${plannedSpoons} spoons, above your ${options.maxDailySpoonsWarning}-spoon warning setting.`,
    );
  }

  const selectedTaskCount = selectedIds.size;

  if (
    options.maxDailyTaskWarning &&
    selectedTaskCount > options.maxDailyTaskWarning
  ) {
    addWarning(
      warnings,
      "too-many-anchors",
      "warning",
      `This draft includes ${selectedTaskCount} tasks, above your ${options.maxDailyTaskWarning}-task warning setting.`,
    );
  }

  if (anchorTasks.length > 2) {
    addWarning(
      warnings,
      "too-many-anchors",
      "warning",
      "Pick two anchors, not seven. Three is already a stretch.",
    );
  }

  tasks
    .filter((task) => task.today !== false && isActiveTask(task) && !task.nextAction)
    .slice(0, 4)
    .forEach((task) =>
      addWarning(
        warnings,
        "missing-next-action",
        "warning",
        "This task is too vague. Give it a next action before it gets today-energy.",
        task.id,
      ),
    );

  scoredTasks
    .filter(
      ({ estimateMinutes }) =>
        availableMinutes > 0 && estimateMinutes > availableMinutes / 2,
    )
    .slice(0, 3)
    .forEach(({ task }) =>
      addWarning(
        warnings,
        "too-big-task",
        "warning",
        "This task is bigger than half the day. Shrink it or make it an anchor.",
        task.id,
      ),
    );

  if (mode === "low-energy") {
    addWarning(
      warnings,
      "low-energy-day",
      "strong",
      "This is a low-energy day. Do not build a heroic plan.",
    );

    anchorTasks
      .filter(({ spoonCost }) => spoonCost >= 3)
      .forEach(({ task }) =>
        addWarning(
          warnings,
          "high-emotion-load",
          "warning",
          "A high-spoon anchor slipped into low-energy mode. Treat it carefully.",
          task.id,
        ),
      );
  }

  scoredTasks
    .filter(
      ({ task, isOverdue, isDueToday }) =>
        (isOverdue || isDueToday) && !selectedIds.has(task.id),
    )
    .slice(0, 3)
    .forEach(({ task }) =>
      addWarning(
        warnings,
        "deadline-pressure",
        "strong",
        "An overdue or due-today task did not fit into anchors. Choose what gives.",
        task.id,
      ),
    );

  if (checkIn?.avoidHighEmotionTasks) {
    anchorTasks
      .filter(({ task, spoonCost }) => task.priority === "High" && spoonCost >= 3)
      .forEach(({ task }) =>
        addWarning(
          warnings,
          "high-emotion-load",
          "warning",
          "You asked to avoid high-emotion work, but this anchor looks emotionally expensive.",
          task.id,
        ),
      );
  }

  return {
    date,
    availableMinutes,
    availableSpoons,
    plannedMinutes,
    plannedSpoons,
    mode,
    buckets: {
      anchorTaskIds: anchorTasks.map(({ task }) => task.id),
      backupTaskIds: backupTasks.map(({ task }) => task.id),
      postponeTaskIds: postponeTasks.map(({ task }) => task.id),
      quickWinTaskIds: quickWins.map(({ task }) => task.id),
    },
    warnings,
    generatedAt: new Date().toISOString(),
  };
}
