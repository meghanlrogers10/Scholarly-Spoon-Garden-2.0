import {
  APP_STORAGE_KEYS,
  APP_STORAGE_PREFIXES,
  LARGE_BACKUP_KEY_WARNING_BYTES,
  type AppStorageCategory,
} from "../utils/appBackup";
import { writeLocalStorageValue } from "../utils/localStorageSync";
import type { CloudSaveArea } from "./cloudSaveTypes";

export const LOCAL_BACKUP_SNAPSHOT_KEY = "ssg2.localBackupSnapshot";
export const LOCAL_BACKUP_HISTORY_KEY = "ssg2.localBackupSnapshotHistory";
export const LOCAL_BACKUP_LARGE_WARNING_BYTES = 900_000;

type LocalBackupPayload = Partial<Record<CloudSaveArea, Record<string, string>>>;

export type LocalBackupSnapshot = {
  createdAt: string;
  updatedAt: string;
  appVersion?: string;
  userId?: string;
  areas: CloudSaveArea[];
  payload: LocalBackupPayload;
  sizeBytes: number;
  warnings: string[];
};

const categoryToArea: Partial<Record<AppStorageCategory, CloudSaveArea>> = {
  settings: "settings",
  "shared-tasks": "tasks",
  dashboard: "planning",
  timer: "timer",
  research: "research",
  teaching: "teaching",
  service: "service",
  mindspace: "mindspace",
};

function measureBytes(value: string) {
  return new Blob([value]).size;
}

function getAreaForStorageKey(key: string): CloudSaveArea | null {
  const exact = APP_STORAGE_KEYS.find((definition) => definition.key === key);
  const prefixed =
    exact ??
    APP_STORAGE_PREFIXES.find((definition) =>
      key.startsWith(definition.prefix),
    );

  return prefixed ? categoryToArea[prefixed.category] ?? null : null;
}

function readExistingSnapshot(): LocalBackupSnapshot | null {
  const rawValue = window.localStorage.getItem(LOCAL_BACKUP_SNAPSHOT_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as LocalBackupSnapshot;

    return typeof parsedValue.createdAt === "string" ? parsedValue : null;
  } catch {
    return null;
  }
}

export function collectLocalBackupSnapshot(userId?: string): LocalBackupSnapshot {
  const existing = readExistingSnapshot();
  const payload: LocalBackupPayload = {};
  const warnings: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || key === LOCAL_BACKUP_SNAPSHOT_KEY || key === LOCAL_BACKUP_HISTORY_KEY) {
      continue;
    }

    const area = getAreaForStorageKey(key);
    const rawValue = area ? window.localStorage.getItem(key) : null;

    if (!area || rawValue === null) {
      continue;
    }

    const sizeBytes = measureBytes(rawValue);

    if (sizeBytes >= LARGE_BACKUP_KEY_WARNING_BYTES) {
      warnings.push(
        `${key} is large (${Math.round(sizeBytes / 1024)} KB); automatic backup kept it local only.`,
      );
    }

    payload[area] = {
      ...(payload[area] ?? {}),
      [key]: rawValue,
    };
  }

  const appVersion = import.meta.env.VITE_APP_BUILD_LABEL || import.meta.env.VITE_APP_VERSION;
  const updatedAt = new Date().toISOString();
  const snapshot: LocalBackupSnapshot = {
    createdAt: existing?.createdAt ?? updatedAt,
    updatedAt,
    ...(appVersion ? { appVersion } : {}),
    ...(userId ? { userId } : {}),
    areas: Object.keys(payload) as CloudSaveArea[],
    payload,
    sizeBytes: measureBytes(JSON.stringify(payload)),
    warnings,
  };

  if (snapshot.sizeBytes >= LOCAL_BACKUP_LARGE_WARNING_BYTES) {
    snapshot.warnings.push(
      `Automatic backup is ${Math.round(snapshot.sizeBytes / 1024)} KB. Use Download backup before major sync changes.`,
    );
  }

  return snapshot;
}

export function saveLocalBackupSnapshot(userId?: string) {
  const snapshot = collectLocalBackupSnapshot(userId);
  const rawSnapshot = JSON.stringify(snapshot);
  const existingHistoryRaw = window.localStorage.getItem(LOCAL_BACKUP_HISTORY_KEY);
  let history: LocalBackupSnapshot[] = [];

  if (existingHistoryRaw) {
    try {
      const parsedHistory = JSON.parse(existingHistoryRaw) as unknown;
      history = Array.isArray(parsedHistory)
        ? parsedHistory.filter(
            (item): item is LocalBackupSnapshot =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as LocalBackupSnapshot).updatedAt === "string",
          )
        : [];
    } catch {
      history = [];
    }
  }

  writeLocalStorageValue(LOCAL_BACKUP_SNAPSHOT_KEY, snapshot);
  writeLocalStorageValue(LOCAL_BACKUP_HISTORY_KEY, [...history, snapshot].slice(-3));
  return { snapshot, sizeBytes: measureBytes(rawSnapshot) };
}

