import type { SyncStatusMessage } from "../../features/settings/components/sync/syncTypes";

export type CloudSaveArea =
  | "settings"
  | "tasks"
  | "planning"
  | "timer"
  | "mindspace"
  | "service"
  | "teaching"
  | "research";

export type CloudSaveAreaStatus = {
  tone: SyncStatusMessage["tone"];
  message: string;
  syncedAt?: string;
};

export type CloudSaveQueueStatus = "pending" | "syncing" | "failed" | "synced";

export type CloudSaveQueueItem = {
  id: string;
  area: CloudSaveArea;
  reason: string;
  createdAt: string;
  lastAttemptAt: string;
  attemptCount: number;
  status: CloudSaveQueueStatus;
};

export type CloudSaveAreaResult = {
  area: CloudSaveArea;
  label: string;
  ok: boolean;
  message: string;
};

export type CloudSaveRunResult = {
  results: CloudSaveAreaResult[];
  syncedAt: string;
  failedCount: number;
};

export type CloudSaveRuntimeStatus = {
  tone: SyncStatusMessage["tone"];
  message: string;
  online: boolean;
  pendingCount: number;
  lastUpdatedAt: string;
};

export const CLOUD_SAVE_AREA_LABELS: Record<CloudSaveArea, string> = {
  settings: "Options",
  tasks: "Tasks",
  planning: "Planning",
  timer: "Timer",
  mindspace: "Mindspace",
  service: "Service",
  teaching: "Teaching",
  research: "Research",
};

export const CLOUD_SAVE_ORDER: CloudSaveArea[] = [
  "settings",
  "tasks",
  "planning",
  "timer",
  "mindspace",
  "service",
  "teaching",
  "research",
];

