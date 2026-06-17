export type TimerCategory =
  | "Research"
  | "Teaching"
  | "Service"
  | "MindSpace"
  | "Writing"
  | "Admin"
  | "Other";

export type TimerMode = "continuous" | "pomodoro";

export type TimerMood =
  | "overwhelmed"
  | "meh"
  | "satisfied"
  | "proud"
  | "energized";

export type ActiveTimer = {
  id: string;
  label: string;
  category: TimerCategory;
  mode: TimerMode;
  pomodoroMinutes?: number;
  startedAt: string;
  lastResumedAt: string | null;
  elapsedBeforePauseSeconds: number;
  isPaused: boolean;
  estimatedSpoons: number;
  preNote?: string;
  taskId?: string;
  taskTitle?: string;
  workingBlockId?: string;
  plannedTaskBlockId?: string;
};

export type EstimateAccuracy = "too-short" | "about-right" | "too-long";

export type TimerSession = {
  id: string;
  label: string;
  category: TimerCategory;
  mode: TimerMode;
  pomodoroMinutes?: number;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  estimatedSpoons?: number;
  spoonsUsed?: number;
  preNote?: string;
  reflection?: string;
  mood?: TimerMood;
  completed?: boolean;
  taskId?: string;
  taskTitle?: string;
  workingBlockId?: string;
  plannedTaskBlockId?: string;
  source?: "timer" | "manual";
  completedTask?: boolean;
  estimateAccuracy?: EstimateAccuracy;
  hadHiddenSetup?: boolean;
  wasInterrupted?: boolean;
};
