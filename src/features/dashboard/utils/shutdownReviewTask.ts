import type { Task } from "../../../shared/types/task";

export const SHUTDOWN_REVIEW_TASK_TITLE = "Shutdown Review";
export const SHUTDOWN_REVIEW_TASK_SOURCE = "daily-planning";
export const SHUTDOWN_REVIEW_TASK_TYPE = "shutdown-review";

export function getShutdownReviewTaskId(date: string) {
  return `shutdown-review-${date}`;
}

export function isShutdownReviewTask(task: Task) {
  return (
    task.taskType === SHUTDOWN_REVIEW_TASK_TYPE ||
    (task.source === SHUTDOWN_REVIEW_TASK_SOURCE &&
      Boolean(task.sourceId) &&
      task.title === SHUTDOWN_REVIEW_TASK_TITLE)
  );
}

function getShutdownReviewTaskInput(date: string, reviewComplete: boolean): Task {
  const now = new Date().toISOString();

  return {
    id: getShutdownReviewTaskId(date),
    title: SHUTDOWN_REVIEW_TASK_TITLE,
    area: "Other",
    taskType: SHUTDOWN_REVIEW_TASK_TYPE,
    source: SHUTDOWN_REVIEW_TASK_SOURCE,
    sourceId: date,
    today: true,
    status: reviewComplete ? "done" : "todo",
    priority: "Medium",
    estimatedMinutes: 5,
    estimateSource: "default",
    spoonCost: 1,
    lowEnergyFriendly: true,
    nextAction:
      "Capture what happened, what rolls over, and what tomorrow should protect.",
    notes:
      "System task for the Shutdown Review data loop: planned vs actual work, rollover, dropped tasks, estimate accuracy, spoons, day mode, and tomorrow protection.",
    createdAt: now,
    updatedAt: now,
  };
}

function matchesShutdownReviewTaskForDate(task: Task, date: string) {
  return (
    isShutdownReviewTask(task) &&
    (task.sourceId === date || task.id === getShutdownReviewTaskId(date))
  );
}

export function findShutdownReviewTask(tasks: Task[], date: string) {
  return tasks.find((task) => matchesShutdownReviewTaskForDate(task, date));
}

export function ensureShutdownReviewTaskForToday(
  tasks: Task[],
  date: string,
  reviewComplete: boolean,
) {
  const now = new Date().toISOString();
  const template = getShutdownReviewTaskInput(date, reviewComplete);
  const existingTask = findShutdownReviewTask(tasks, date);

  if (!existingTask) {
    return [template, ...tasks];
  }

  const nextTask: Task = {
    ...existingTask,
    title: template.title,
    area: template.area,
    taskType: template.taskType,
    source: template.source,
    sourceId: template.sourceId,
    today: true,
    status: reviewComplete ? "done" : "todo",
    priority: existingTask.priority ?? template.priority,
    estimatedMinutes: existingTask.estimatedMinutes ?? template.estimatedMinutes,
    estimateSource: existingTask.estimateSource ?? template.estimateSource,
    spoonCost: existingTask.spoonCost ?? template.spoonCost,
    lowEnergyFriendly: true,
    nextAction: existingTask.nextAction ?? template.nextAction,
    notes: existingTask.notes ?? template.notes,
  };

  if (JSON.stringify(existingTask) === JSON.stringify(nextTask)) {
    return tasks;
  }

  return tasks.map((task) =>
    task.id === existingTask.id ? { ...nextTask, updatedAt: now } : task,
  );
}

export function markShutdownReviewTaskDone(tasks: Task[], date: string) {
  return ensureShutdownReviewTaskForToday(tasks, date, true);
}

export function maybeReopenShutdownReviewTaskIfReviewIncomplete(
  tasks: Task[],
  date: string,
  reviewComplete: boolean,
) {
  return ensureShutdownReviewTaskForToday(tasks, date, reviewComplete);
}
