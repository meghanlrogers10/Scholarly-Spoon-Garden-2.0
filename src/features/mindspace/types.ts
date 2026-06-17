export type MindspaceItemStatus =
  | "inbox"
  | "clarify-later"
  | "converted"
  | "released"
  | "archived";

export type MindspaceItemKind =
  | "thought"
  | "worry"
  | "idea"
  | "reminder"
  | "question"
  | "goal-seed"
  | "avoidance"
  | "other";

export type MindspaceItemArea =
  | "research"
  | "teaching"
  | "service"
  | "personal"
  | "mindspace"
  | "other";

export type MindspaceConversionTarget =
  | "task"
  | "research-idea"
  | "teaching-note"
  | "service-item"
  | "goal"
  | "release";

export type MindspaceItem = {
  id: string;
  title: string;
  body?: string;
  kind: MindspaceItemKind;
  area: MindspaceItemArea;
  status: MindspaceItemStatus;
  nextAction?: string;
  tinyStep?: string;
  emotionalWeight?: 1 | 2 | 3 | 4 | 5;
  lowEnergyFriendly?: boolean;
  convertedToType?: MindspaceConversionTarget;
  convertedToId?: string;
  createdAt: string;
  updatedAt: string;
  lastTouchedAt?: string;
};

export type GoalStatus = "active" | "paused" | "completed" | "archived";

export type GoalTimeHorizon = "long-term" | "semester" | "month" | "week";

export type MindspaceGoal = {
  id: string;
  title: string;
  description?: string;
  horizon: GoalTimeHorizon;
  status: GoalStatus;
  parentGoalId?: string;
  nextAction?: string;
  tinyStep?: string;
  linkedTaskIds?: string[];
  createdAt: string;
  updatedAt: string;
};
