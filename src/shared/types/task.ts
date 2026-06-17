export type TaskArea =
  | "Research"
  | "Teaching"
  | "Service"
  | "Personal"
  | "Other";

export type TaskPriority = "Low" | "Medium" | "High";

export type TaskStatus = "todo" | "done" | "archived";

export type TaskEstimateConfidence = "low" | "medium" | "high";

export type TaskEstimateSource = "manual" | "history" | "default" | "imported";

export type TaskType =
  | "writing"
  | "reading"
  | "grading"
  | "class-prep"
  | "email-admin"
  | "meeting-prep"
  | "analysis"
  | "coding"
  | "service"
  | "advising"
  | "teaching"
  | "research"
  | "mindspace"
  | "other";

export type TaskSource =
  | "manual"
  | "quick-capture"
  | "research-task"
  | "research-log"
  | "research-log-follow-up"
  | "draft-next-move"
  | "teaching-prep"
  | "grading"
  | "ta-follow-up"
  | "office-hours"
  | "announcement"
  | "resource"
  | "service-item"
  | "committee-item"
  | "review-letter"
  | "advising-item"
  | "admin-other"
  | "mindspace-item";

export type Task = {
  id: string;
  title: string;
  area: TaskArea;
  spoonCost: 1 | 2 | 3 | 4 | 5;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  today?: boolean;
  notes?: string;
  courseId?: string;
  serviceItemId?: string;
  committeeId?: string;
  studentId?: string;
  estimatedMinutes?: number;
  adjustedEstimatedMinutes?: number;
  estimateConfidence?: TaskEstimateConfidence;
  estimateSource?: TaskEstimateSource;
  actualMinutesTotal?: number;
  actualSessionCount?: number;
  taskType?: TaskType;
  nextAction?: string;
  lowEnergyFriendly?: boolean;
  source?: TaskSource;
  sourceId?: string;
  projectId?: string;
  workingBlockId?: string;
};
