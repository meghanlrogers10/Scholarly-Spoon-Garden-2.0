import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type {
  Task,
  TaskArea,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskType,
} from "../types/task";

export const TASK_STORAGE_KEY = "ssg2.todayTasks";

const taskAreas: TaskArea[] = [
  "Research",
  "Teaching",
  "Service",
  "Personal",
  "Other",
];

const taskPriorities: TaskPriority[] = ["Low", "Medium", "High"];
const taskStatuses: TaskStatus[] = ["todo", "done", "archived"];

const taskSources: TaskSource[] = [
  "manual",
  "quick-capture",
  "research-task",
  "research-log",
  "research-log-follow-up",
  "draft-next-move",
  "teaching-prep",
  "grading",
  "ta-follow-up",
  "office-hours",
  "announcement",
  "resource",
  "service-item",
  "committee-item",
  "review-letter",
  "advising-item",
  "admin-other",
  "mindspace-item",
];

type TaskUpdater = (currentTasks: Task[]) => Task[];

export type SourceTaskInput = {
  source: TaskSource;
  sourceId: string;
  title: string;
  area: TaskArea;
  spoonCost?: Task["spoonCost"];
  priority?: TaskPriority;
  dueDate?: string;
  notes?: string;
  serviceItemId?: string;
  courseId?: string;
  committeeId?: string;
  studentId?: string;
  projectId?: string;
  workingBlockId?: string;
  taskType?: TaskType;
  nextAction?: string;
  lowEnergyFriendly?: boolean;
  estimatedMinutes?: number;
  adjustedEstimatedMinutes?: number;
  estimateConfidence?: Task["estimateConfidence"];
  estimateSource?: Task["estimateSource"];
  actualMinutesTotal?: number;
  actualSessionCount?: number;
  today?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asPositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return Math.round(value);
}

function asSpoonCost(value: unknown): Task["spoonCost"] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : 1;
}

export function normalizeTaskArea(value: unknown): TaskArea {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "research") return "Research";
    if (normalized === "teaching") return "Teaching";
    if (normalized === "service") return "Service";
    if (normalized === "personal" || normalized === "mindspace") return "Personal";
    if (normalized === "other") return "Other";
  }

  return taskAreas.includes(value as TaskArea) ? (value as TaskArea) : "Other";
}

function asArea(value: unknown): TaskArea {
  return normalizeTaskArea(value);
}

function asPriority(value: unknown): TaskPriority {
  return taskPriorities.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : "Medium";
}

function asStatus(value: unknown): TaskStatus {
  return taskStatuses.includes(value as TaskStatus) ? (value as TaskStatus) : "todo";
}

function asSource(value: unknown) {
  return taskSources.includes(value as TaskSource) ? (value as TaskSource) : undefined;
}

function asTaskType(value: unknown) {
  const taskTypes: TaskType[] = [
    "writing",
    "reading",
    "grading",
    "class-prep",
    "email-admin",
    "meeting-prep",
    "analysis",
    "coding",
    "service",
    "advising",
    "teaching",
    "research",
    "mindspace",
    "other",
  ];

  return taskTypes.includes(value as TaskType) ? (value as TaskType) : undefined;
}

function normalizeDateString(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return value;
}

function hasTaskChanged(original: Task[], normalized: Task[]) {
  return JSON.stringify(original) !== JSON.stringify(normalized);
}

export function normalizeTaskRecord(value: unknown): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? asString(value.updatedAt) ?? now;

  return {
    ...(value as Partial<Task>),
    id: asString(value.id) ?? crypto.randomUUID(),
    title: asString(value.title) ?? "Untitled task",
    area: asArea(value.area),
    spoonCost: asSpoonCost(value.spoonCost),
    priority: asPriority(value.priority),
    status: asStatus(value.status),
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
    dueDate: normalizeDateString(value.dueDate),
    today: typeof value.today === "boolean" ? value.today : true,
    notes: asString(value.notes),
    courseId: asString(value.courseId),
    serviceItemId: asString(value.serviceItemId),
    committeeId: asString(value.committeeId),
    studentId: asString(value.studentId),
    source: asSource(value.source),
    sourceId: asString(value.sourceId),
    projectId: asString(value.projectId),
    workingBlockId: asString(value.workingBlockId),
    estimatedMinutes: asPositiveInteger(value.estimatedMinutes),
    adjustedEstimatedMinutes: asPositiveInteger(value.adjustedEstimatedMinutes),
    estimateConfidence:
      value.estimateConfidence === "low" ||
      value.estimateConfidence === "medium" ||
      value.estimateConfidence === "high"
        ? value.estimateConfidence
        : undefined,
    estimateSource:
      value.estimateSource === "manual" ||
      value.estimateSource === "history" ||
      value.estimateSource === "default" ||
      value.estimateSource === "imported"
        ? value.estimateSource
        : undefined,
    actualMinutesTotal: asPositiveInteger(value.actualMinutesTotal),
    actualSessionCount: asPositiveInteger(value.actualSessionCount),
    taskType: asTaskType(value.taskType),
    nextAction: asString(value.nextAction),
    lowEnergyFriendly:
      typeof value.lowEnergyFriendly === "boolean"
        ? value.lowEnergyFriendly
        : undefined,
  };
}

export function normalizeTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeTaskRecord)
    .filter((task): task is Task => Boolean(task));
}

function sourceNote(input: Pick<SourceTaskInput, "source" | "sourceId">) {
  return `[source:${input.source}:${input.sourceId}]`;
}

function isLinkedTask(task: Task, source: TaskSource, sourceId: string) {
  return (
    (task.source === source && task.sourceId === sourceId) ||
    (source === "service-item" && task.serviceItemId === sourceId) ||
    (task.notes?.includes(sourceNote({ source, sourceId })) ?? false)
  );
}

function withSourceNote(notes: string | undefined, input: SourceTaskInput) {
  const note = sourceNote(input);

  if (!notes) {
    return note;
  }

  return notes.includes(note) ? notes : `${notes}\n\n${note}`;
}

function applySourceInput(task: Task, input: SourceTaskInput, now: string): Task {
  return {
    ...task,
    title: input.title,
    area: input.area,
    spoonCost: input.spoonCost ?? task.spoonCost,
    priority: input.priority ?? task.priority,
    dueDate: input.dueDate,
    notes: input.notes ? withSourceNote(input.notes, input) : task.notes,
    serviceItemId: input.serviceItemId ?? task.serviceItemId,
    courseId: input.courseId ?? task.courseId,
    committeeId: input.committeeId ?? task.committeeId,
    studentId: input.studentId ?? task.studentId,
    projectId: input.projectId ?? task.projectId,
    workingBlockId: input.workingBlockId ?? task.workingBlockId,
    source: input.source,
    sourceId: input.sourceId,
    taskType: input.taskType ?? task.taskType,
    nextAction: input.nextAction ?? task.nextAction,
    lowEnergyFriendly: input.lowEnergyFriendly ?? task.lowEnergyFriendly,
    estimatedMinutes: input.estimatedMinutes ?? task.estimatedMinutes,
    adjustedEstimatedMinutes:
      input.adjustedEstimatedMinutes ?? task.adjustedEstimatedMinutes,
    estimateConfidence: input.estimateConfidence ?? task.estimateConfidence,
    estimateSource:
      input.estimateSource ?? (input.estimatedMinutes ? "manual" : task.estimateSource),
    actualMinutesTotal: input.actualMinutesTotal ?? task.actualMinutesTotal,
    actualSessionCount: input.actualSessionCount ?? task.actualSessionCount,
    today: input.today ?? true,
    status: "todo",
    updatedAt: now,
  };
}

export function useTaskBridge() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(TASK_STORAGE_KEY, []);

  useEffect(() => {
    const normalized = normalizeTasks(tasks);

    if (hasTaskChanged(tasks, normalized)) {
      setTasks(normalized);
    }
  }, [tasks, setTasks]);

  function updateTasks(updater: TaskUpdater) {
    setTasks((currentTasks) => updater(normalizeTasks(currentTasks)));
  }

  function isSourceOnToday(source: TaskSource, sourceId: string) {
    return tasks.some(
      (task) =>
        isLinkedTask(task, source, sourceId) &&
        task.today !== false &&
        task.status !== "done" &&
        task.status !== "archived",
    );
  }

  function createTaskFromSource(input: SourceTaskInput) {
    const now = new Date().toISOString();

    updateTasks((currentTasks) => {
      const alreadyExists = currentTasks.some((task) =>
        isLinkedTask(task, input.source, input.sourceId),
      );

      if (alreadyExists) {
        return currentTasks.map((task) =>
          isLinkedTask(task, input.source, input.sourceId)
            ? applySourceInput(task, input, now)
            : task,
        );
      }

      const newTask: Task = {
        id: crypto.randomUUID(),
        title: input.title,
        area: input.area,
        spoonCost: input.spoonCost ?? 1,
        priority: input.priority ?? "Medium",
        status: "todo",
        dueDate: input.dueDate,
        notes: withSourceNote(input.notes, input),
        serviceItemId: input.serviceItemId,
        courseId: input.courseId,
        committeeId: input.committeeId,
        studentId: input.studentId,
        projectId: input.projectId,
        workingBlockId: input.workingBlockId,
        source: input.source,
        sourceId: input.sourceId,
        taskType: input.taskType,
        nextAction: input.nextAction,
        lowEnergyFriendly: input.lowEnergyFriendly,
        estimatedMinutes: input.estimatedMinutes,
        adjustedEstimatedMinutes: input.adjustedEstimatedMinutes,
        estimateConfidence: input.estimateConfidence,
        estimateSource:
          input.estimateSource ?? (input.estimatedMinutes ? "manual" : undefined),
        actualMinutesTotal: input.actualMinutesTotal,
        actualSessionCount: input.actualSessionCount,
        createdAt: now,
        updatedAt: now,
        today: input.today ?? true,
      };

      return [newTask, ...currentTasks];
    });
  }

  function addLinkedTaskToToday(input: SourceTaskInput) {
    createTaskFromSource(input);
  }

  function markTaskToday(taskId: string, today: boolean) {
    const now = new Date().toISOString();

    updateTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              today,
              status: today ? "todo" : task.status,
              updatedAt: now,
            }
          : task,
      ),
    );
  }

  function adjustActualMinutesForTask(
    taskId: string,
    minuteDelta: number,
    sessionDelta = 0,
  ) {
    const actualMinuteDelta = Math.round(minuteDelta);
    const actualSessionDelta = Math.round(sessionDelta);

    if (actualMinuteDelta === 0 && actualSessionDelta === 0) {
      return;
    }

    const now = new Date().toISOString();

    updateTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              actualMinutesTotal: Math.max(
                0,
                (task.actualMinutesTotal ?? 0) + actualMinuteDelta,
              ),
              actualSessionCount: Math.max(
                0,
                (task.actualSessionCount ?? 0) + actualSessionDelta,
              ),
              updatedAt: now,
            }
          : task,
      ),
    );
  }

  function addActualMinutesToTask(taskId: string, minutes: number) {
    const actualMinutes = Math.max(0, Math.round(minutes));

    if (actualMinutes === 0) {
      return;
    }

    adjustActualMinutesForTask(taskId, actualMinutes, 1);
  }

  return {
    tasks: normalizeTasks(tasks),
    setTasks,
    updateTasks,
    isSourceOnToday,
    addLinkedTaskToToday,
    createTaskFromSource,
    markTaskToday,
    adjustActualMinutesForTask,
    addActualMinutesToTask,
  };
}
