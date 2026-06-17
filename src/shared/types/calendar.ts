import type { TimerMood } from "./timer";
import type { EstimateAccuracy } from "./timer";
import type {
  PlannedTaskBlockStatus,
  WorkingBlockStatus,
} from "./planning";

export type CalendarCategory =
  | "Research"
  | "Teaching"
  | "Service"
  | "MindSpace"
  | "Writing"
  | "Admin"
  | "Other";

export type CalendarSource =
  | "timed"
  | "pomodoro"
  | "manual"
  | "task"
  | "working-block"
  | "planned-task";

export type CalendarItem = {
  id: string;
  isSampleData?: boolean;
  dayOffset: number;
  title: string;
  category: CalendarCategory;
  source: CalendarSource;
  time?: string;
  endTime?: string;
  isAllDay?: boolean;
  completed?: boolean;
  mood?: TimerMood;
  entityId?: string;
  workingBlockStatus?: WorkingBlockStatus;
  plannedTaskBlockStatus?: PlannedTaskBlockStatus;
  notes?: string;
  plannedTaskIds?: string[];
  actualSessionIds?: string[];
  taskId?: string;
  workingBlockId?: string;
  plannedTaskBlockId?: string;
  estimatedMinutes?: number;
  spoonCost?: number;
  durationSeconds?: number;
  completedTask?: boolean;
  estimateAccuracy?: EstimateAccuracy;
  hadHiddenSetup?: boolean;
  wasInterrupted?: boolean;
};
