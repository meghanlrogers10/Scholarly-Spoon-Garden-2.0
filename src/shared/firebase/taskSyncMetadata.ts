export const TASK_SYNC_ENABLED_KEY = "ssg2.taskSyncEnabled";
export const LAST_TASK_SYNC_AT_KEY = "ssg2.lastTaskSyncAt";
export const LAST_TASK_SYNC_ERROR_KEY = "ssg2.lastTaskSyncError";
export const TASK_CLOUD_USER_ID_KEY = "ssg2.taskCloudUserId";

export function formatTaskSyncDate(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
