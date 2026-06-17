import type { PlanningMode } from "./planning";
export type { PlanningMode } from "./planning";

export type CalendarDensity = "compact" | "comfortable";

export type TimerReflectionLevel = "none" | "light" | "full";

export type TextSize = "standard" | "large" | "extra-large";

export type LayoutDensity = "compact" | "comfortable" | "spacious";

export type AppSettings = {
  updatedAt?: string;
  calendarDayStartHour: number;
  calendarDayEndHour: number;
  defaultWorkingBlockMinutes: number;
  showWeekends: boolean;
  calendarDensity: CalendarDensity;
  showSampleCalendarEvents: boolean;

  dailyCheckInEnabled: boolean;
  defaultPlanningMode: PlanningMode;
  maxDailySpoonsWarning: number;
  maxDailyTaskWarning: number;
  lowEnergyModeDefault: boolean;
  realisticPlanWarnings: boolean;

  timerPomodoroMinutes: number;
  timerBreakMinutes: number;
  longRunningTimerWarningMinutes: number;
  timerSoundAlerts: boolean;
  timerVisualAlerts: boolean;
  timerReflectionLevel: TimerReflectionLevel;

  textSize: TextSize;
  layoutDensity: LayoutDensity;
  reducedMotion: boolean;
  highContrast: boolean;
  fewerEmojis: boolean;
  calmMode: boolean;
};

export const defaultAppSettings: AppSettings = {
  calendarDayStartHour: 9,
  calendarDayEndHour: 21,
  defaultWorkingBlockMinutes: 90,
  showWeekends: true,
  calendarDensity: "comfortable",
  showSampleCalendarEvents: false,

  dailyCheckInEnabled: true,
  defaultPlanningMode: "balanced",
  maxDailySpoonsWarning: 5,
  maxDailyTaskWarning: 6,
  lowEnergyModeDefault: false,
  realisticPlanWarnings: true,

  timerPomodoroMinutes: 25,
  timerBreakMinutes: 5,
  longRunningTimerWarningMinutes: 120,
  timerSoundAlerts: false,
  timerVisualAlerts: true,
  timerReflectionLevel: "light",

  textSize: "standard",
  layoutDensity: "comfortable",
  reducedMotion: false,
  highContrast: false,
  fewerEmojis: false,
  calmMode: false,
};
