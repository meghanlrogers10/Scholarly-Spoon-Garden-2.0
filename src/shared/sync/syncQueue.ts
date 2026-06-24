import { writeLocalStorageValue } from "../utils/localStorageSync";
import type { CloudSaveArea, CloudSaveQueueItem } from "./cloudSaveTypes";

export const CLOUD_SAVE_QUEUE_KEY = "ssg2.cloudSaveSyncQueue";
export const CLOUD_SAVE_MAX_RETRY_ATTEMPTS = 6;

function readQueue(): CloudSaveQueueItem[] {
  const storedValue = window.localStorage.getItem(CLOUD_SAVE_QUEUE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item): item is CloudSaveQueueItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as CloudSaveQueueItem).id === "string" &&
        typeof (item as CloudSaveQueueItem).area === "string",
    );
  } catch {
    return [];
  }
}

function writeQueue(queue: CloudSaveQueueItem[]) {
  writeLocalStorageValue(CLOUD_SAVE_QUEUE_KEY, queue);
}

export function getCloudSaveQueue() {
  return readQueue();
}

export function getPendingCloudSaveQueue() {
  return readQueue().filter((item) => item.status === "pending" || item.status === "failed");
}

export function enqueueCloudSaveArea(area: CloudSaveArea, reason: string) {
  const now = new Date().toISOString();
  const queue = readQueue();
  const existingIndex = queue.findIndex(
    (item) => item.area === area && item.status !== "synced",
  );

  if (existingIndex >= 0) {
    const existing = queue[existingIndex];
    queue[existingIndex] = {
      ...existing,
      reason,
      status: existing.status === "syncing" ? "syncing" : "pending",
    };
    writeQueue(queue);
    return queue[existingIndex];
  }

  const item: CloudSaveQueueItem = {
    id: `${area}-${Date.now()}`,
    area,
    reason,
    createdAt: now,
    lastAttemptAt: "",
    attemptCount: 0,
    status: "pending",
  };

  writeQueue([...queue, item]);
  return item;
}

export function markCloudSaveQueueSyncing(areas: CloudSaveArea[]) {
  const now = new Date().toISOString();
  writeQueue(
    readQueue().map((item) =>
      areas.includes(item.area) && item.status !== "synced"
        ? {
            ...item,
            status: "syncing",
            lastAttemptAt: now,
            attemptCount: item.attemptCount + 1,
          }
        : item,
    ),
  );
}

export function markCloudSaveQueueSynced(area: CloudSaveArea) {
  writeQueue(
    readQueue().map((item) =>
      item.area === area
        ? { ...item, status: "synced", lastAttemptAt: new Date().toISOString() }
        : item,
    ),
  );
}

export function markCloudSaveQueueFailed(area: CloudSaveArea, reason: string) {
  writeQueue(
    readQueue().map((item) =>
      item.area === area && item.status !== "synced"
        ? {
            ...item,
            reason,
            status:
              item.attemptCount >= CLOUD_SAVE_MAX_RETRY_ATTEMPTS
                ? "failed"
                : "pending",
            lastAttemptAt: new Date().toISOString(),
          }
        : item,
    ),
  );
}

export function compactCloudSaveQueue() {
  const queue = readQueue();
  const active = queue.filter((item) => item.status !== "synced");
  const synced = queue
    .filter((item) => item.status === "synced")
    .slice(-8);

  writeQueue([...active, ...synced]);
}

