import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type {
  GoogleCalendarSyncDirection,
  GoogleCalendarSyncSettings,
} from "../types/googleCalendarSync";
import { normalizePreferredName } from "../auth/displayName";
import { defaultAppSettings, type AppSettings } from "../types/settings";
import { db } from "./firebaseClient";
import { getUserAppSettingsDocumentSegments } from "./firestorePaths";

export type SettingsCloudSnapshot = {
  settings: AppSettings | null;
  cloudUpdatedAt?: string;
};

export type SettingsMergeResult = {
  settings: AppSettings;
  used: "local" | "cloud";
  reason: string;
};

const calendarDensities = ["compact", "comfortable"] as const;
const planningModes = [
  "balanced",
  "research-push",
  "teaching-survival",
  "service-triage",
  "low-energy",
  "deadline-emergency",
  "small-task-cleanup",
] as const;
const timerReflectionLevels = ["none", "light", "full"] as const;
const textSizes = ["standard", "large", "extra-large"] as const;
const layoutDensities = ["compact", "comfortable", "spacious"] as const;
const googleCalendarSyncDirections = [
  "read-only",
  "write-only",
  "two-way",
] as const;

function requireDb() {
  if (!db) {
    throw new Error("Firebase is not configured for this app build.");
  }

  return db;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asEnum<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  fallback: TValue,
) {
  return allowed.includes(value as TValue) ? (value as TValue) : fallback;
}

function timestamp(value?: string) {
  const time = new Date(value ?? "").getTime();

  return Number.isFinite(time) ? time : 0;
}

function omitUndefinedValues<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => omitUndefinedValues(item)) as T;
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([entryKey, entryValue]) => [
        entryKey,
        omitUndefinedValues(entryValue),
      ]),
  ) as T;
}

function normalizeGoogleCalendarSyncSettings(
  value: unknown,
): GoogleCalendarSyncSettings {
  const fallback = defaultAppSettings.googleCalendarSync;

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: asBoolean(value.enabled, fallback.enabled),
    syncDirection: asEnum(
      value.syncDirection,
      googleCalendarSyncDirections,
      fallback.syncDirection as GoogleCalendarSyncDirection,
    ),
    importExternalEvents: asBoolean(
      value.importExternalEvents,
      fallback.importExternalEvents,
    ),
    importAsBusyOnly: asBoolean(value.importAsBusyOnly, fallback.importAsBusyOnly),
    selectedExternalCalendarIds: asStringArray(
      value.selectedExternalCalendarIds,
    ),
    targetExternalCalendarId:
      asString(value.targetExternalCalendarId) ??
      fallback.targetExternalCalendarId,
    exportWorkingBlocks: asBoolean(
      value.exportWorkingBlocks,
      fallback.exportWorkingBlocks,
    ),
    exportPlannedTaskBlocks: asBoolean(
      value.exportPlannedTaskBlocks,
      fallback.exportPlannedTaskBlocks,
    ),
    exportTimerSessions: asBoolean(
      value.exportTimerSessions,
      fallback.exportTimerSessions,
    ),
    exportManualWorkLogs: asBoolean(
      value.exportManualWorkLogs,
      fallback.exportManualWorkLogs,
    ),
    exportResearchDeadlines: asBoolean(
      value.exportResearchDeadlines,
      fallback.exportResearchDeadlines,
    ),
    exportTeachingDeadlines: asBoolean(
      value.exportTeachingDeadlines,
      fallback.exportTeachingDeadlines,
    ),
    exportServiceDeadlines: asBoolean(
      value.exportServiceDeadlines,
      fallback.exportServiceDeadlines,
    ),
    lastSyncAt: asString(value.lastSyncAt),
    lastSyncError: asString(value.lastSyncError),
  };
}

export function normalizeAppSettings(value: unknown): AppSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    ...value,
    preferredName: normalizePreferredName(value.preferredName),
    preferredNameUpdatedAt: asString(value.preferredNameUpdatedAt),
    calendarDayStartHour: asNumber(
      value.calendarDayStartHour,
      defaultAppSettings.calendarDayStartHour,
    ),
    calendarDayEndHour: asNumber(
      value.calendarDayEndHour,
      defaultAppSettings.calendarDayEndHour,
    ),
    defaultWorkingBlockMinutes: asNumber(
      value.defaultWorkingBlockMinutes,
      defaultAppSettings.defaultWorkingBlockMinutes,
    ),
    showWeekends: asBoolean(value.showWeekends, defaultAppSettings.showWeekends),
    calendarDensity: asEnum(
      value.calendarDensity,
      calendarDensities,
      defaultAppSettings.calendarDensity,
    ),
    showSampleCalendarEvents: asBoolean(
      value.showSampleCalendarEvents,
      defaultAppSettings.showSampleCalendarEvents,
    ),
    googleCalendarSync: normalizeGoogleCalendarSyncSettings(
      value.googleCalendarSync,
    ),
    dailyCheckInEnabled: asBoolean(
      value.dailyCheckInEnabled,
      defaultAppSettings.dailyCheckInEnabled,
    ),
    defaultPlanningMode: asEnum(
      value.defaultPlanningMode,
      planningModes,
      defaultAppSettings.defaultPlanningMode,
    ),
    maxDailySpoonsWarning: asNumber(
      value.maxDailySpoonsWarning,
      defaultAppSettings.maxDailySpoonsWarning,
    ),
    maxDailyTaskWarning: asNumber(
      value.maxDailyTaskWarning,
      defaultAppSettings.maxDailyTaskWarning,
    ),
    lowEnergyModeDefault: asBoolean(
      value.lowEnergyModeDefault,
      defaultAppSettings.lowEnergyModeDefault,
    ),
    realisticPlanWarnings: asBoolean(
      value.realisticPlanWarnings,
      defaultAppSettings.realisticPlanWarnings,
    ),
    timerPomodoroMinutes: asNumber(
      value.timerPomodoroMinutes,
      defaultAppSettings.timerPomodoroMinutes,
    ),
    timerBreakMinutes: asNumber(
      value.timerBreakMinutes,
      defaultAppSettings.timerBreakMinutes,
    ),
    longRunningTimerWarningMinutes: asNumber(
      value.longRunningTimerWarningMinutes,
      defaultAppSettings.longRunningTimerWarningMinutes,
    ),
    timerSoundAlerts: asBoolean(
      value.timerSoundAlerts,
      defaultAppSettings.timerSoundAlerts,
    ),
    timerVisualAlerts: asBoolean(
      value.timerVisualAlerts,
      defaultAppSettings.timerVisualAlerts,
    ),
    timerReflectionLevel: asEnum(
      value.timerReflectionLevel,
      timerReflectionLevels,
      defaultAppSettings.timerReflectionLevel,
    ),
    textSize: asEnum(value.textSize, textSizes, defaultAppSettings.textSize),
    layoutDensity: asEnum(
      value.layoutDensity,
      layoutDensities,
      defaultAppSettings.layoutDensity,
    ),
    reducedMotion: asBoolean(value.reducedMotion, defaultAppSettings.reducedMotion),
    highContrast: asBoolean(value.highContrast, defaultAppSettings.highContrast),
    fewerEmojis: asBoolean(value.fewerEmojis, defaultAppSettings.fewerEmojis),
    calmMode: asBoolean(value.calmMode, defaultAppSettings.calmMode),
    updatedAt: asString(value.updatedAt),
  };
}

export function normalizeLocalAppSettings(value: unknown): AppSettings {
  return {
    ...defaultAppSettings,
    ...(normalizeAppSettings(value) ?? {}),
  };
}

export async function readUserAppSettings(
  uid: string,
): Promise<SettingsCloudSnapshot> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserAppSettingsDocumentSegments(uid)),
  );

  if (!snapshot.exists()) {
    return { settings: null };
  }

  const data = snapshot.data();
  const normalizedSettings = normalizeAppSettings(data);

  return {
    settings: normalizedSettings,
    cloudUpdatedAt: asString(data.cloudUpdatedAt),
  };
}

export async function saveUserAppSettings(uid: string, settings: unknown) {
  const firestore = requireDb();
  const normalizedInput = normalizeAppSettings(settings);
  const normalizedSettings = omitUndefinedValues({
    ...normalizeLocalAppSettings(settings),
    updatedAt:
      normalizedInput?.updatedAt ?? new Date().toISOString(),
  });
  const payload: Record<string, unknown> = {
    ...normalizedSettings,
    cloudUpdatedAt: serverTimestamp(),
  };

  if (
    normalizedInput?.preferredNameUpdatedAt &&
    !normalizedInput.preferredName
  ) {
    payload.preferredName = deleteField();
  }

  await setDoc(
    doc(firestore, ...getUserAppSettingsDocumentSegments(uid)),
    payload,
    { merge: true },
  );

  return normalizedSettings;
}

export function mergeAppSettingsForSync(
  localInput: unknown,
  cloudInput: unknown,
): SettingsMergeResult {
  const localSettings = normalizeLocalAppSettings(localInput);
  const cloudSettings = normalizeAppSettings(cloudInput);

  if (!cloudSettings) {
    return {
      settings: localSettings,
      used: "local",
      reason: "No readable cloud settings were found.",
    };
  }

  const readableCloudSettings = cloudSettings;

  function mergePreferredName(
    base: AppSettings,
    newer: AppSettings,
    older: AppSettings,
  ) {
    const localNameTime = timestamp(localSettings.preferredNameUpdatedAt);
    const cloudNameTime = timestamp(readableCloudSettings.preferredNameUpdatedAt);

    if (localNameTime > 0 || cloudNameTime > 0) {
      const localNameIsNewer = localNameTime >= cloudNameTime;
      const selected = localNameIsNewer ? localSettings : readableCloudSettings;

      return {
        ...base,
        preferredName: selected.preferredName,
        preferredNameUpdatedAt: selected.preferredNameUpdatedAt,
      };
    }

    if (!newer.preferredName && older.preferredName) {
      return {
        ...base,
        preferredName: older.preferredName,
        preferredNameUpdatedAt: older.preferredNameUpdatedAt,
      };
    }

    return base;
  }

  const localTime = timestamp(localSettings.updatedAt);
  const cloudTime = timestamp(readableCloudSettings.updatedAt);

  if (localTime > 0 || cloudTime > 0) {
    const localIsNewer = localTime >= cloudTime;
    const newerSettings = localIsNewer ? localSettings : readableCloudSettings;
    const olderSettings = localIsNewer ? readableCloudSettings : localSettings;

    const mergedSettings = mergePreferredName(
      {
        ...olderSettings,
        ...newerSettings,
        updatedAt: new Date().toISOString(),
      },
      newerSettings,
      olderSettings,
    );

    return {
      settings: mergedSettings,
      used: localIsNewer ? "local" : "cloud",
      reason: localIsNewer
        ? "Local settings had the newest updatedAt timestamp."
        : "Cloud settings had the newest updatedAt timestamp.",
    };
  }

  return {
    settings: mergePreferredName(
      {
      ...readableCloudSettings,
      ...localSettings,
      updatedAt: new Date().toISOString(),
      },
      localSettings,
      readableCloudSettings,
    ),
    used: "local",
    reason:
      "Neither settings object had updatedAt, so merge preferred local values while preserving cloud-only fields.",
  };
}
