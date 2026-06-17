import type { CalendarItem } from "../types/calendar";

export const sampleTodayTasks = [
  {
    id: "task-1",
    title: "Revise SCD introduction",
    area: "Research",
    spoonCost: 3,
    priority: "High",
  },
  {
    id: "task-2",
    title: "Prep SOC 6170 module outline",
    area: "Teaching",
    spoonCost: 2,
    priority: "Medium",
  },
  {
    id: "task-3",
    title: "Reply to committee follow-up",
    area: "Service",
    spoonCost: 1,
    priority: "Low",
  },
];

export const sampleWorkingSessions = [
  {
    id: "session-1",
    label: "Writing",
    duration: "45 min",
    detail: "SCD theory section",
  },
  {
    id: "session-2",
    label: "Teaching prep",
    duration: "25 min",
    detail: "Stats lecture cleanup",
  },
];

export const sampleLowEnergyTasks = [
  "Clean up one citation",
  "Rename one file",
  "Skim one abstract",
  "Write one ugly sentence",
];

export const sampleUpcomingTasks = [
  {
    id: "upcoming-1",
    title: "Finish SCD methods cleanup",
    area: "Research",
    due: "Tuesday",
  },
  {
    id: "upcoming-2",
    title: "Draft SOC 6170 first-week plan",
    area: "Teaching",
    due: "Thursday",
  },
  {
    id: "upcoming-3",
    title: "Check committee notes",
    area: "Service",
    due: "Friday",
  },
];

export const sampleCalendarItems: CalendarItem[] = [
  {
    id: "calendar-1",
    isSampleData: true,
    dayOffset: 0,
    time: "10:00 AM",
    title: "Writing block",
    category: "Research",
    source: "manual",
  },
  {
    id: "calendar-2",
    isSampleData: true,
    dayOffset: 0,
    time: "1:30 PM",
    title: "Course prep",
    category: "Teaching",
    source: "manual",
  },
  {
    id: "calendar-3",
    isSampleData: true,
    dayOffset: 0,
    time: "3:00 PM",
    title: "Admin cleanup",
    category: "Service",
    source: "manual",
  },
  {
    id: "calendar-4",
    isSampleData: true,
    dayOffset: 1,
    time: "11:00 AM",
    title: "SCD methods cleanup",
    category: "Research",
    source: "manual",
  },
  {
    id: "calendar-5",
    isSampleData: true,
    dayOffset: 2,
    time: "2:00 PM",
    title: "Stats prep",
    category: "Teaching",
    source: "manual",
  },
  {
    id: "calendar-6",
    isSampleData: true,
    dayOffset: 4,
    time: "9:30 AM",
    title: "Committee follow-up",
    category: "Service",
    source: "manual",
  },
];
