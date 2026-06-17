import type { PlannedTaskBlock } from "../../../shared/types/planning";
import type { Task, TaskArea, TaskType } from "../../../shared/types/task";
import type {
  EstimateAccuracy,
  TimerCategory,
  TimerSession,
} from "../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../shared/types/workLog";

export type TimeRealitySource = "timer" | "manual";

export type TimeRealitySession = {
  id: string;
  storageId: string;
  title: string;
  source: TimeRealitySource;
  category: TimerCategory | string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  taskId?: string;
  taskTitle?: string;
  workingBlockId?: string;
  plannedTaskBlockId?: string;
  completedTask?: boolean;
  estimateAccuracy?: EstimateAccuracy;
  hadHiddenSetup?: boolean;
  wasInterrupted?: boolean;
  reflection?: string;
  mood?: string;
  mode?: string;
};

export type TimeRealitySummary = {
  totalActualMinutes: number;
  totalEstimatedMinutes: number;
  estimateRatio?: number;
  completedSessions: number;
  interruptedSessions: number;
  hiddenSetupSessions: number;
  sessionsWithPlannedBlock: number;
  sessionsWithoutPlannedBlock: number;
};

export type TimeRealityGroupSummary = {
  key: string;
  label: string;
  totalActualMinutes: number;
  totalEstimatedMinutes?: number;
  sessionCount: number;
  estimateRatio?: number;
  interruptedCount: number;
  hiddenSetupCount: number;
};

export type PlannedBlockCoverage = {
  sessionsWithPlannedBlock: number;
  sessionsWithWorkingBlock: number;
  sessionsWithoutPlanningContext: number;
  plannedBlocksWithActualWork: number;
};

function getManualStartedAt(entry: ManualWorkLogEntry) {
  return `${entry.date}T${entry.startTime || "00:00"}`;
}

function getManualEndedAt(entry: ManualWorkLogEntry) {
  return entry.endTime ? `${entry.date}T${entry.endTime}` : undefined;
}

function getManualDurationMinutes(entry: ManualWorkLogEntry) {
  if (!entry.endTime) {
    return 0;
  }

  const startedAt = new Date(getManualStartedAt(entry));
  const endedAt = new Date(getManualEndedAt(entry)!);
  const minutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000);

  return minutes > 0 ? minutes : 0;
}

export function normalizeTimerSession(session: TimerSession): TimeRealitySession {
  return {
    id: `timer-${session.id}`,
    storageId: session.id,
    title: session.label,
    source: "timer",
    category: session.category,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMinutes: getSessionDurationMinutes(session),
    taskId: session.taskId,
    taskTitle: session.taskTitle,
    workingBlockId: session.workingBlockId,
    plannedTaskBlockId: session.plannedTaskBlockId,
    completedTask: session.completedTask,
    estimateAccuracy: session.estimateAccuracy,
    hadHiddenSetup: session.hadHiddenSetup,
    wasInterrupted: session.wasInterrupted,
    reflection: session.reflection,
    mood: session.mood,
    mode: session.mode,
  };
}

export function normalizeManualWorkLog(
  entry: ManualWorkLogEntry,
): TimeRealitySession {
  return {
    id: `manual-${entry.id}`,
    storageId: entry.id,
    title: entry.title,
    source: "manual",
    category: entry.category,
    startedAt: getManualStartedAt(entry),
    endedAt: getManualEndedAt(entry),
    durationMinutes: getManualDurationMinutes(entry),
    taskId: entry.taskId,
    taskTitle: entry.taskTitle,
    workingBlockId: entry.workingBlockId,
    plannedTaskBlockId: entry.plannedTaskBlockId,
    completedTask: entry.completedTask,
    estimateAccuracy: entry.estimateAccuracy,
    hadHiddenSetup: entry.hadHiddenSetup,
    wasInterrupted: entry.wasInterrupted,
    reflection: entry.reflection,
    mood: entry.mood,
    mode: "manual",
  };
}

export function getSessionDurationMinutes(
  session: TimerSession | TimeRealitySession,
) {
  if ("durationMinutes" in session) {
    return session.durationMinutes;
  }

  return Math.max(0, Math.round(session.durationSeconds / 60));
}

export function getSessionDate(session: TimeRealitySession) {
  const date = new Date(session.startedAt);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toISOString().slice(0, 10);
}

export function getSessionArea(
  session: TimeRealitySession,
  taskMap: Map<string, Task>,
): TaskArea | "MindSpace" | "Writing" | "Admin" | "Other" {
  const taskArea = session.taskId ? taskMap.get(session.taskId)?.area : undefined;

  if (taskArea) {
    return taskArea;
  }

  if (
    session.category === "Research" ||
    session.category === "Teaching" ||
    session.category === "Service" ||
    session.category === "MindSpace" ||
    session.category === "Writing" ||
    session.category === "Admin"
  ) {
    return session.category;
  }

  return "Other";
}

export function getSessionTaskType(
  session: TimeRealitySession,
  taskMap: Map<string, Task>,
): TaskType | "unknown" {
  return session.taskId
    ? taskMap.get(session.taskId)?.taskType ?? "unknown"
    : "unknown";
}

export function getSessionEstimateMinutes(
  session: TimeRealitySession,
  taskMap: Map<string, Task>,
) {
  const task = session.taskId ? taskMap.get(session.taskId) : undefined;

  return task?.adjustedEstimatedMinutes ?? task?.estimatedMinutes;
}

export function getEstimateRatio(
  actualMinutes: number,
  estimatedMinutes: number | undefined,
) {
  if (!estimatedMinutes || estimatedMinutes <= 0 || actualMinutes <= 0) {
    return undefined;
  }

  return actualMinutes / estimatedMinutes;
}

export function groupSessionsByDate(sessions: TimeRealitySession[]) {
  return groupBy(sessions, getSessionDate);
}

export function groupSessionsByArea(
  sessions: TimeRealitySession[],
  tasks: Task[],
) {
  const taskMap = createTaskMap(tasks);

  return summarizeGroups(sessions, (session) =>
    String(getSessionArea(session, taskMap)),
  );
}

export function groupSessionsByTaskType(
  sessions: TimeRealitySession[],
  tasks: Task[],
) {
  const taskMap = createTaskMap(tasks);

  return summarizeGroups(
    sessions,
    (session) => getSessionTaskType(session, taskMap),
    taskMap,
  );
}

export function calculateTotalActualMinutes(sessions: TimeRealitySession[]) {
  return sessions.reduce(
    (totalMinutes, session) => totalMinutes + session.durationMinutes,
    0,
  );
}

export function calculateEstimatedVsActual(
  sessions: TimeRealitySession[],
  tasks: Task[],
) {
  const taskMap = createTaskMap(tasks);
  const totalActualMinutes = calculateTotalActualMinutes(sessions);
  const totalEstimatedMinutes = sessions.reduce((totalMinutes, session) => {
    return totalMinutes + (getSessionEstimateMinutes(session, taskMap) ?? 0);
  }, 0);

  return {
    totalActualMinutes,
    totalEstimatedMinutes,
    estimateRatio: getEstimateRatio(totalActualMinutes, totalEstimatedMinutes),
  };
}

export function calculateInterruptionCount(sessions: TimeRealitySession[]) {
  return sessions.filter((session) => session.wasInterrupted).length;
}

export function calculateHiddenSetupCount(sessions: TimeRealitySession[]) {
  return sessions.filter((session) => session.hadHiddenSetup).length;
}

export function calculateCompletedSessionCount(sessions: TimeRealitySession[]) {
  return sessions.filter((session) => session.completedTask).length;
}

export function calculatePlannedBlockCoverage(
  sessions: TimeRealitySession[],
  plannedBlocks: PlannedTaskBlock[],
): PlannedBlockCoverage {
  const actualPlannedBlockIds = new Set(
    sessions
      .map((session) => session.plannedTaskBlockId)
      .filter((id): id is string => Boolean(id)),
  );

  return {
    sessionsWithPlannedBlock: sessions.filter(
      (session) => Boolean(session.plannedTaskBlockId),
    ).length,
    sessionsWithWorkingBlock: sessions.filter((session) =>
      Boolean(session.workingBlockId),
    ).length,
    sessionsWithoutPlanningContext: sessions.filter(
      (session) => !session.workingBlockId && !session.plannedTaskBlockId,
    ).length,
    plannedBlocksWithActualWork: plannedBlocks.filter((block) =>
      actualPlannedBlockIds.has(block.id),
    ).length,
  };
}

export function calculateTimeRealitySummary(
  sessions: TimeRealitySession[],
  tasks: Task[],
  plannedBlocks: PlannedTaskBlock[],
): TimeRealitySummary {
  const estimateSummary = calculateEstimatedVsActual(sessions, tasks);
  const plannedCoverage = calculatePlannedBlockCoverage(sessions, plannedBlocks);

  return {
    ...estimateSummary,
    completedSessions: calculateCompletedSessionCount(sessions),
    interruptedSessions: calculateInterruptionCount(sessions),
    hiddenSetupSessions: calculateHiddenSetupCount(sessions),
    sessionsWithPlannedBlock: plannedCoverage.sessionsWithPlannedBlock,
    sessionsWithoutPlannedBlock: sessions.length - plannedCoverage.sessionsWithPlannedBlock,
  };
}

export function getEstimateRealityCounts(sessions: TimeRealitySession[]) {
  return {
    tooShort: sessions.filter((session) => session.estimateAccuracy === "too-short")
      .length,
    aboutRight: sessions.filter(
      (session) => session.estimateAccuracy === "about-right",
    ).length,
    tooLong: sessions.filter((session) => session.estimateAccuracy === "too-long")
      .length,
  };
}

export function getEstimateRatioLabel(ratio: number | undefined) {
  if (ratio === undefined) return "no estimate";
  if (ratio > 1.25) return "runs long";
  if (ratio < 0.8) return "overestimated";
  return "about right";
}

export function createTaskMap(tasks: Task[]) {
  return new Map(tasks.map((task) => [task.id, task]));
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = [...(groups[key] ?? []), item];

    return groups;
  }, {});
}

function summarizeGroups(
  sessions: TimeRealitySession[],
  getKey: (session: TimeRealitySession) => string,
  taskMap = new Map<string, Task>(),
): TimeRealityGroupSummary[] {
  const groups = groupBy(sessions, getKey);

  return Object.entries(groups)
    .map(([key, groupSessions]) => {
      const totalActualMinutes = calculateTotalActualMinutes(groupSessions);
      const totalEstimatedMinutes = groupSessions.reduce(
        (totalMinutes, session) =>
          totalMinutes + (getSessionEstimateMinutes(session, taskMap) ?? 0),
        0,
      );
      const estimateRatio = getEstimateRatio(
        totalActualMinutes,
        totalEstimatedMinutes,
      );

      return {
        key,
        label: key === "unknown" ? "No task type" : formatLabel(key),
        totalActualMinutes,
        totalEstimatedMinutes,
        sessionCount: groupSessions.length,
        estimateRatio,
        interruptedCount: calculateInterruptionCount(groupSessions),
        hiddenSetupCount: calculateHiddenSetupCount(groupSessions),
      };
    })
    .sort((a, b) => b.totalActualMinutes - a.totalActualMinutes);
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
