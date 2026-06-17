import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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

export function normalizeAppSettings(value: unknown): AppSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    ...value,
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
  const normalizedSettings = {
    ...normalizeLocalAppSettings(settings),
    updatedAt:
      normalizeAppSettings(settings)?.updatedAt ?? new Date().toISOString(),
  };

  await setDoc(
    doc(firestore, ...getUserAppSettingsDocumentSegments(uid)),
    {
      ...normalizedSettings,
      cloudUpdatedAt: serverTimestamp(),
    },
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

  const localTime = timestamp(localSettings.updatedAt);
  const cloudTime = timestamp(cloudSettings.updatedAt);

  if (localTime > 0 || cloudTime > 0) {
    const localIsNewer = localTime >= cloudTime;
    const newerSettings = localIsNewer ? localSettings : cloudSettings;
    const olderSettings = localIsNewer ? cloudSettings : localSettings;

    return {
      settings: {
        ...olderSettings,
        ...newerSettings,
        updatedAt: new Date().toISOString(),
      },
      used: localIsNewer ? "local" : "cloud",
      reason: localIsNewer
        ? "Local settings had the newest updatedAt timestamp."
        : "Cloud settings had the newest updatedAt timestamp.",
    };
  }

  return {
    settings: {
      ...cloudSettings,
      ...localSettings,
      updatedAt: new Date().toISOString(),
    },
    used: "local",
    reason:
      "Neither settings object had updatedAt, so merge preferred local values while preserving cloud-only fields.",
  };
}
