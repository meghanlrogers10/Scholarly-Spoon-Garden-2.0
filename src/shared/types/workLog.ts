import type { EstimateAccuracy, TimerCategory, TimerMood } from "./timer";

export type ManualWorkLogEntry = {
  id: string;
  title: string;
  category: TimerCategory;
  date: string;
  startTime: string;
  endTime?: string;
  mood?: TimerMood;
  reflection?: string;
  completed: boolean;
  taskId?: string;
  taskTitle?: string;
  workingBlockId?: string;
  plannedTaskBlockId?: string;
  source?: "timer" | "manual";
  completedTask?: boolean;
  estimateAccuracy?: EstimateAccuracy;
  hadHiddenSetup?: boolean;
  wasInterrupted?: boolean;
  createdAt: string;
};
