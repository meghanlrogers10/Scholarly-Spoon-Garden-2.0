import {
  MANUAL_WORK_LOGS_STORAGE_KEY,
  TIMER_SESSIONS_STORAGE_KEY,
} from "../constants/timerStorage";
import {
  MINDSPACE_GOALS_STORAGE_KEY,
  MINDSPACE_ITEMS_STORAGE_KEY,
} from "../constants/mindspaceStorage";
import {
  LEGACY_RESEARCH_DRAFTS_STORAGE_KEY,
  LEGACY_RESEARCH_LITERATURE_SOURCES_STORAGE_KEY,
  LEGACY_RESEARCH_LOG_ENTRIES_STORAGE_KEY,
  LEGACY_RESEARCH_MIND_MAP_EDGES_STORAGE_KEY,
  LEGACY_RESEARCH_MIND_MAP_NODES_STORAGE_KEY,
  LEGACY_RESEARCH_PRISMA_RECORDS_STORAGE_KEY,
  LEGACY_RESEARCH_READING_NOTES_STORAGE_KEY,
  LEGACY_RESEARCH_SUBMISSIONS_STORAGE_KEY,
  LEGACY_RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY,
  RESEARCH_DRAFTS_STORAGE_KEY,
  RESEARCH_LITERATURE_NOTES_STORAGE_KEY,
  RESEARCH_LITERATURE_SOURCES_STORAGE_KEY,
  RESEARCH_LOG_ENTRIES_STORAGE_KEY,
  RESEARCH_MIND_MAP_EDGES_STORAGE_KEY,
  RESEARCH_MIND_MAP_NODES_STORAGE_KEY,
  RESEARCH_PRISMA_CRITERIA_STORAGE_KEY,
  RESEARCH_PRISMA_RECORDS_STORAGE_KEY,
  RESEARCH_PROJECTS_STORAGE_KEY,
  RESEARCH_READING_NOTES_STORAGE_KEY,
  RESEARCH_SUBMISSIONS_STORAGE_KEY,
  RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY,
  RESEARCH_TASKS_STORAGE_KEY,
} from "../constants/researchStorage";
import { APP_SETTINGS_STORAGE_KEY } from "../constants/settingsStorage";
import {
  TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY,
  TEACHING_ASSISTANTS_STORAGE_KEY,
  TEACHING_COURSE_NOTE_DRAFT_PREFIX,
  TEACHING_COURSE_NOTES_STORAGE_KEY,
  TEACHING_COURSE_TEMPLATES_STORAGE_KEY,
  TEACHING_COURSES_STORAGE_KEY,
  TEACHING_GRADING_ITEMS_STORAGE_KEY,
  TEACHING_MEETINGS_STORAGE_KEY,
  TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY,
  TEACHING_PREP_SESSIONS_STORAGE_KEY,
  TEACHING_RESOURCES_STORAGE_KEY,
  TEACHING_SEMESTERS_STORAGE_KEY,
  TEACHING_TA_ITEMS_STORAGE_KEY,
} from "../constants/teachingStorage";
import {
  ADVISING_STUDENTS_STORAGE_KEY,
  SERVICE_ADMIN_ITEMS_STORAGE_KEY,
  SERVICE_BOUNDARY_LESSONS_STORAGE_KEY,
  SERVICE_COMMITTEES_STORAGE_KEY,
  SERVICE_ITEMS_STORAGE_KEY,
  SERVICE_REVIEW_LETTERS_STORAGE_KEY,
} from "../constants/serviceStorage";
import {
  CLOUD_SAVE_ENABLED_KEY,
  CLOUD_SAVE_LAST_AREA_STATUS_KEY,
  CLOUD_SAVE_USER_ID_KEY,
  LAST_CLOUD_SAVE_ERROR_KEY,
  LAST_CLOUD_SAVE_SYNC_AT_KEY,
} from "../firebase/cloudSaveMetadata";
import { CLOUD_SAVE_QUEUE_KEY } from "../sync/syncQueue";
import {
  LAST_SERVICE_SYNC_AT_KEY,
  LAST_SERVICE_SYNC_ERROR_KEY,
  SERVICE_CLOUD_USER_ID_KEY,
  SERVICE_SYNC_ENABLED_KEY,
} from "../firebase/serviceSyncMetadata";
import {
  LAST_RESEARCH_SYNC_AT_KEY,
  LAST_RESEARCH_SYNC_ERROR_KEY,
  RESEARCH_CLOUD_USER_ID_KEY,
  RESEARCH_SYNC_ENABLED_KEY,
} from "../firebase/researchSyncMetadata";
import {
  LAST_SETTINGS_SYNC_AT_KEY,
  LAST_SETTINGS_SYNC_ERROR_KEY,
  SETTINGS_CLOUD_USER_ID_KEY,
  SETTINGS_SYNC_ENABLED_KEY,
} from "../firebase/settingsSyncMetadata";
import {
  LAST_TEACHING_SYNC_AT_KEY,
  LAST_TEACHING_SYNC_ERROR_KEY,
  TEACHING_CLOUD_USER_ID_KEY,
  TEACHING_SYNC_ENABLED_KEY,
} from "../firebase/teachingSyncMetadata";
import { notifyLocalStorageChange } from "./localStorageSync";

export const BACKUP_APP_NAME = "Scholarly Spoon Garden 2";
export const BACKUP_VERSION = 1;
export const LARGE_BACKUP_KEY_WARNING_BYTES = 250_000;

export type AppStorageCategory =
  | "settings"
  | "shared-tasks"
  | "dashboard"
  | "timer"
  | "research"
  | "teaching"
  | "service"
  | "mindspace";

type AppStorageKeyDefinition = {
  key: string;
  category: AppStorageCategory;
  label: string;
};

type AppStoragePrefixDefinition = {
  prefix: string;
  category: AppStorageCategory;
  label: string;
};

export type AppBackupEntry = {
  key: string;
  category: AppStorageCategory;
  label: string;
  rawValue: string;
  parsedValue?: unknown;
  parseError?: string;
  sizeBytes: number;
  isLarge: boolean;
};

export type AppBackup = {
  appName: typeof BACKUP_APP_NAME;
  backupVersion: typeof BACKUP_VERSION;
  exportedAt: string;
  keyCount: number;
  appBuildLabel?: string;
  entries: AppBackupEntry[];
  warnings: string[];
};

export type BackupPreview = {
  backup: AppBackup;
  restorableEntries: AppBackupEntry[];
  ignoredEntries: AppBackupEntry[];
  overwriteKeys: string[];
  missingCurrentKeys: string[];
  warnings: string[];
};

export type RestoreResult = {
  restoredKeyCount: number;
  ignoredKeyCount: number;
  restoredKeys: string[];
};

// Backup v1 is a localStorage safety export only. It preserves exact raw values
// for known SSG keys while grouping them by feature so a future Firestore-era
// backupVersion 2 can migrate categories into user-scoped collections.
export const APP_STORAGE_KEYS: AppStorageKeyDefinition[] = [
  { key: APP_SETTINGS_STORAGE_KEY, category: "settings", label: "App settings" },
  { key: CLOUD_SAVE_ENABLED_KEY, category: "settings", label: "Cloud Save enabled" },
  { key: LAST_CLOUD_SAVE_SYNC_AT_KEY, category: "settings", label: "Last Cloud Save sync time" },
  { key: LAST_CLOUD_SAVE_ERROR_KEY, category: "settings", label: "Last Cloud Save error" },
  { key: CLOUD_SAVE_USER_ID_KEY, category: "settings", label: "Cloud Save user id" },
  { key: CLOUD_SAVE_LAST_AREA_STATUS_KEY, category: "settings", label: "Cloud Save area status" },
  { key: "ssg2.cloudSaveRuntimeStatus", category: "settings", label: "Cloud Save status" },
  { key: CLOUD_SAVE_QUEUE_KEY, category: "settings", label: "Cloud Save retry queue" },
  { key: "ssg2.localBackupSnapshot", category: "settings", label: "Local backup snapshot" },
  { key: "ssg2.localBackupSnapshotHistory", category: "settings", label: "Local backup history" },
  { key: SETTINGS_SYNC_ENABLED_KEY, category: "settings", label: "Settings sync enabled" },
  { key: LAST_SETTINGS_SYNC_AT_KEY, category: "settings", label: "Last settings sync time" },
  { key: LAST_SETTINGS_SYNC_ERROR_KEY, category: "settings", label: "Last settings sync error" },
  { key: SETTINGS_CLOUD_USER_ID_KEY, category: "settings", label: "Settings cloud user id" },
  { key: "ssg2.todayTasks", category: "shared-tasks", label: "Shared tasks" },
  { key: "ssg2.taskSyncEnabled", category: "shared-tasks", label: "Task sync enabled" },
  { key: "ssg2.lastTaskSyncAt", category: "shared-tasks", label: "Last task sync time" },
  { key: "ssg2.lastTaskSyncError", category: "shared-tasks", label: "Last task sync error" },
  { key: "ssg2.taskCloudUserId", category: "shared-tasks", label: "Task cloud user id" },

  { key: "ssg2.availableSpoons", category: "dashboard", label: "Available spoons" },
  { key: "ssg2.dailyCheckIns", category: "dashboard", label: "Daily check-ins and working blocks" },
  { key: "ssg2.workingBlocks", category: "dashboard", label: "Legacy working blocks" },
  { key: "ssg2.plannedTaskBlocks", category: "dashboard", label: "Planned task blocks" },
  { key: "ssg2.endOfDayReviews", category: "dashboard", label: "End-of-day reviews" },
  { key: "ssg2.planningSyncEnabled", category: "dashboard", label: "Planning sync enabled" },
  { key: "ssg2.lastPlanningSyncAt", category: "dashboard", label: "Last planning sync time" },
  { key: "ssg2.lastPlanningSyncError", category: "dashboard", label: "Last planning sync error" },
  { key: "ssg2.planningCloudUserId", category: "dashboard", label: "Planning cloud user id" },
  { key: "ssg2.quickCaptures", category: "dashboard", label: "Dashboard quick captures" },
  { key: MANUAL_WORK_LOGS_STORAGE_KEY, category: "dashboard", label: "Manual work logs" },

  { key: TIMER_SESSIONS_STORAGE_KEY, category: "timer", label: "Timer sessions" },
  { key: "ssg2.timerSyncEnabled", category: "timer", label: "Timer sync enabled" },
  { key: "ssg2.lastTimerSyncAt", category: "timer", label: "Last timer sync time" },
  { key: "ssg2.lastTimerSyncError", category: "timer", label: "Last timer sync error" },
  { key: "ssg2.timerCloudUserId", category: "timer", label: "Timer cloud user id" },
  { key: "ssg2.activeTimer", category: "timer", label: "Active timer" },
  { key: "ssg2.timerPosition", category: "timer", label: "Floating timer position" },

  { key: RESEARCH_PROJECTS_STORAGE_KEY, category: "research", label: "Research projects" },
  { key: RESEARCH_TASKS_STORAGE_KEY, category: "research", label: "Research tasks" },
  { key: RESEARCH_LOG_ENTRIES_STORAGE_KEY, category: "research", label: "Research log entries" },
  { key: RESEARCH_DRAFTS_STORAGE_KEY, category: "research", label: "Research drafts" },
  { key: RESEARCH_SUBMISSIONS_STORAGE_KEY, category: "research", label: "Research submissions" },
  { key: RESEARCH_LITERATURE_SOURCES_STORAGE_KEY, category: "research", label: "Research literature sources" },
  { key: RESEARCH_LITERATURE_NOTES_STORAGE_KEY, category: "research", label: "Research literature notes" },
  { key: RESEARCH_READING_NOTES_STORAGE_KEY, category: "research", label: "Research reading notes" },
  { key: RESEARCH_MIND_MAP_NODES_STORAGE_KEY, category: "research", label: "Research mind map nodes" },
  { key: RESEARCH_MIND_MAP_EDGES_STORAGE_KEY, category: "research", label: "Research mind map edges" },
  { key: RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY, category: "research", label: "Research synthesis sections" },
  { key: RESEARCH_PRISMA_RECORDS_STORAGE_KEY, category: "research", label: "Research PRISMA records" },
  { key: RESEARCH_PRISMA_CRITERIA_STORAGE_KEY, category: "research", label: "Research PRISMA criteria" },
  { key: RESEARCH_SYNC_ENABLED_KEY, category: "research", label: "Research sync enabled" },
  { key: LAST_RESEARCH_SYNC_AT_KEY, category: "research", label: "Last Research sync time" },
  { key: LAST_RESEARCH_SYNC_ERROR_KEY, category: "research", label: "Last Research sync error" },
  { key: RESEARCH_CLOUD_USER_ID_KEY, category: "research", label: "Research cloud user id" },
  { key: LEGACY_RESEARCH_LOG_ENTRIES_STORAGE_KEY, category: "research", label: "Research log entries" },
  { key: LEGACY_RESEARCH_DRAFTS_STORAGE_KEY, category: "research", label: "Research drafts" },
  { key: LEGACY_RESEARCH_SUBMISSIONS_STORAGE_KEY, category: "research", label: "Research submissions" },
  { key: LEGACY_RESEARCH_LITERATURE_SOURCES_STORAGE_KEY, category: "research", label: "Research literature sources" },
  { key: LEGACY_RESEARCH_READING_NOTES_STORAGE_KEY, category: "research", label: "Research reading notes" },
  { key: LEGACY_RESEARCH_MIND_MAP_NODES_STORAGE_KEY, category: "research", label: "Research mind map nodes" },
  { key: LEGACY_RESEARCH_MIND_MAP_EDGES_STORAGE_KEY, category: "research", label: "Research mind map edges" },
  { key: LEGACY_RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY, category: "research", label: "Research synthesis sections" },
  { key: LEGACY_RESEARCH_PRISMA_RECORDS_STORAGE_KEY, category: "research", label: "Research PRISMA records" },

  { key: TEACHING_SEMESTERS_STORAGE_KEY, category: "teaching", label: "Teaching semesters" },
  { key: TEACHING_COURSES_STORAGE_KEY, category: "teaching", label: "Teaching courses" },
  { key: TEACHING_MEETINGS_STORAGE_KEY, category: "teaching", label: "Teaching meetings" },
  { key: TEACHING_PREP_SESSIONS_STORAGE_KEY, category: "teaching", label: "Teaching prep sessions" },
  { key: TEACHING_GRADING_ITEMS_STORAGE_KEY, category: "teaching", label: "Teaching grading items" },
  { key: TEACHING_TA_ITEMS_STORAGE_KEY, category: "teaching", label: "Teaching TA items" },
  { key: TEACHING_ASSISTANTS_STORAGE_KEY, category: "teaching", label: "Teaching assistants" },
  { key: TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY, category: "teaching", label: "Teaching office hour visits" },
  { key: TEACHING_COURSE_NOTES_STORAGE_KEY, category: "teaching", label: "Teaching course notes" },
  { key: TEACHING_RESOURCES_STORAGE_KEY, category: "teaching", label: "Teaching resources" },
  { key: TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY, category: "teaching", label: "Teaching announcement reminders" },
  { key: TEACHING_COURSE_TEMPLATES_STORAGE_KEY, category: "teaching", label: "Teaching course templates" },
  { key: TEACHING_SYNC_ENABLED_KEY, category: "teaching", label: "Teaching sync enabled" },
  { key: LAST_TEACHING_SYNC_AT_KEY, category: "teaching", label: "Last Teaching sync time" },
  { key: LAST_TEACHING_SYNC_ERROR_KEY, category: "teaching", label: "Last Teaching sync error" },
  { key: TEACHING_CLOUD_USER_ID_KEY, category: "teaching", label: "Teaching cloud user id" },

  { key: SERVICE_ITEMS_STORAGE_KEY, category: "service", label: "Service items" },
  { key: SERVICE_COMMITTEES_STORAGE_KEY, category: "service", label: "Service committees" },
  { key: ADVISING_STUDENTS_STORAGE_KEY, category: "service", label: "Advising students" },
  { key: SERVICE_REVIEW_LETTERS_STORAGE_KEY, category: "service", label: "Service reviews and letters" },
  { key: SERVICE_ADMIN_ITEMS_STORAGE_KEY, category: "service", label: "Service admin items" },
  { key: SERVICE_BOUNDARY_LESSONS_STORAGE_KEY, category: "service", label: "Service boundary lessons" },
  { key: SERVICE_SYNC_ENABLED_KEY, category: "service", label: "Service sync enabled" },
  { key: LAST_SERVICE_SYNC_AT_KEY, category: "service", label: "Last Service sync time" },
  { key: LAST_SERVICE_SYNC_ERROR_KEY, category: "service", label: "Last Service sync error" },
  { key: SERVICE_CLOUD_USER_ID_KEY, category: "service", label: "Service cloud user id" },

  { key: MINDSPACE_ITEMS_STORAGE_KEY, category: "mindspace", label: "Mindspace items" },
  { key: MINDSPACE_GOALS_STORAGE_KEY, category: "mindspace", label: "Mindspace goals" },
  { key: "ssg2.mindspaceSyncEnabled", category: "mindspace", label: "Mindspace sync enabled" },
  { key: "ssg2.lastMindspaceSyncAt", category: "mindspace", label: "Last Mindspace sync time" },
  { key: "ssg2.lastMindspaceSyncError", category: "mindspace", label: "Last Mindspace sync error" },
  { key: "ssg2.mindspaceCloudUserId", category: "mindspace", label: "Mindspace cloud user id" },
];

export const APP_STORAGE_PREFIXES: AppStoragePrefixDefinition[] = [
  {
    prefix: TEACHING_COURSE_NOTE_DRAFT_PREFIX,
    category: "teaching",
    label: "Teaching course note draft",
  },
];

const knownKeyMap = new Map(APP_STORAGE_KEYS.map((definition) => [definition.key, definition]));

function getBuildLabel() {
  return import.meta.env.VITE_APP_BUILD_LABEL || undefined;
}

function getStorageDefinition(key: string) {
  const exact = knownKeyMap.get(key);

  if (exact) {
    return exact;
  }

  return APP_STORAGE_PREFIXES.find((definition) =>
    key.startsWith(definition.prefix)
  );
}

export function isRecognizedAppStorageKey(key: string) {
  return Boolean(getStorageDefinition(key));
}

function measureBytes(value: string) {
  return new Blob([value]).size;
}

function createBackupEntry(key: string, rawValue: string): AppBackupEntry | null {
  const definition = getStorageDefinition(key);

  if (!definition) {
    return null;
  }

  const sizeBytes = measureBytes(rawValue);
  const entry: AppBackupEntry = {
    key,
    category: definition.category,
    label: definition.label,
    rawValue,
    sizeBytes,
    isLarge: sizeBytes >= LARGE_BACKUP_KEY_WARNING_BYTES,
  };

  try {
    entry.parsedValue = JSON.parse(rawValue) as unknown;
  } catch (error) {
    entry.parseError = error instanceof Error ? error.message : "Not JSON";
  }

  return entry;
}

function buildWarnings(entries: AppBackupEntry[]) {
  return entries
    .filter((entry) => entry.isLarge)
    .map(
      (entry) =>
        `${entry.key} is large (${Math.round(entry.sizeBytes / 1024)} KB); localStorage may feel slower.`
    );
}

export function collectAppBackup(): AppBackup {
  const entries: AppBackupEntry[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || !isRecognizedAppStorageKey(key)) {
      continue;
    }

    const rawValue = window.localStorage.getItem(key);

    if (rawValue === null) {
      continue;
    }

    const entry = createBackupEntry(key, rawValue);

    if (entry) {
      entries.push(entry);
    }
  }

  const appBuildLabel = getBuildLabel();

  return {
    appName: BACKUP_APP_NAME,
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    keyCount: entries.length,
    ...(appBuildLabel ? { appBuildLabel } : {}),
    entries: entries.sort((a, b) => a.key.localeCompare(b.key)),
    warnings: buildWarnings(entries),
  };
}

export function createBackupFilename(prefix = "scholarly-spoon-garden-backup") {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
}

export function downloadBackup(backup: AppBackup, filename = createBackupFilename()) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeBackupEntry(value: unknown): AppBackupEntry | null {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as AppBackupEntry).key !== "string" ||
    typeof (value as AppBackupEntry).rawValue !== "string"
  ) {
    return null;
  }

  return createBackupEntry(
    (value as AppBackupEntry).key,
    (value as AppBackupEntry).rawValue
  );
}

export function parseBackupText(text: string): AppBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("That file is not valid JSON.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as AppBackup).appName !== BACKUP_APP_NAME ||
    (parsed as AppBackup).backupVersion !== BACKUP_VERSION ||
    !Array.isArray((parsed as AppBackup).entries)
  ) {
    throw new Error("That does not look like a Scholarly Spoon Garden backup.");
  }

  const entries = (parsed as AppBackup).entries
    .map(normalizeBackupEntry)
    .filter((entry): entry is AppBackupEntry => Boolean(entry));

  return {
    appName: BACKUP_APP_NAME,
    backupVersion: BACKUP_VERSION,
    exportedAt:
      typeof (parsed as AppBackup).exportedAt === "string"
        ? (parsed as AppBackup).exportedAt
        : "",
    keyCount: entries.length,
    appBuildLabel:
      typeof (parsed as AppBackup).appBuildLabel === "string"
        ? (parsed as AppBackup).appBuildLabel
        : undefined,
    entries,
    warnings: Array.isArray((parsed as AppBackup).warnings)
      ? (parsed as AppBackup).warnings.filter(
          (warning): warning is string => typeof warning === "string"
        )
      : [],
  };
}

export function previewBackupRestore(backup: AppBackup): BackupPreview {
  const restorableEntries = backup.entries.filter((entry) =>
    isRecognizedAppStorageKey(entry.key)
  );
  const ignoredEntries = backup.entries.filter(
    (entry) => !isRecognizedAppStorageKey(entry.key)
  );
  const overwriteKeys = restorableEntries
    .map((entry) => entry.key)
    .filter((key) => window.localStorage.getItem(key) !== null);
  const missingCurrentKeys = restorableEntries
    .map((entry) => entry.key)
    .filter((key) => window.localStorage.getItem(key) === null);

  return {
    backup,
    restorableEntries,
    ignoredEntries,
    overwriteKeys,
    missingCurrentKeys,
    warnings: [
      ...backup.warnings,
      ...buildWarnings(restorableEntries),
      ...(overwriteKeys.length > 0
        ? [`${overwriteKeys.length} existing SSG keys will be overwritten.`]
        : []),
    ],
  };
}

export function restoreBackupEntries(preview: BackupPreview): RestoreResult {
  preview.restorableEntries.forEach((entry) => {
    window.localStorage.setItem(entry.key, entry.rawValue);
    notifyLocalStorageChange(entry.key);
  });

  return {
    restoredKeyCount: preview.restorableEntries.length,
    ignoredKeyCount: preview.ignoredEntries.length,
    restoredKeys: preview.restorableEntries.map((entry) => entry.key),
  };
}

export function summarizeBackupCategories(entries: AppBackupEntry[]) {
  return entries.reduce<Record<AppStorageCategory, number>>(
    (summary, entry) => ({
      ...summary,
      [entry.category]: (summary[entry.category] ?? 0) + 1,
    }),
    {
      settings: 0,
      "shared-tasks": 0,
      dashboard: 0,
      timer: 0,
      research: 0,
      teaching: 0,
      service: 0,
      mindspace: 0,
    }
  );
}
