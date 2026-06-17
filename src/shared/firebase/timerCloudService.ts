import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import type {
  EstimateAccuracy,
  TimerCategory,
  TimerMode,
  TimerMood,
  TimerSession,
} from "../types/timer";
import type { ManualWorkLogEntry } from "../types/workLog";
import { db } from "./firebaseClient";
import {
  getUserManualWorkLogDocumentSegments,
  getUserManualWorkLogsCollectionSegments,
  getUserTimerSessionDocumentSegments,
  getUserTimerSessionsCollectionSegments,
} from "./firestorePaths";

export type TimerCloudSnapshot = {
  timerSessions: TimerSession[];
  manualWorkLogs: ManualWorkLogEntry[];
};

export type TimerCloudCounts = {
  timerSessions: number;
  manualWorkLogs: number;
};

export type TimerMergeResult = TimerCloudSnapshot & {
  addedCount: number;
  updatedCount: number;
  dedupedCount: number;
};

const timerCategories: TimerCategory[] = [
  "Research",
  "Teaching",
  "Service",
  "MindSpace",
  "Writing",
  "Admin",
  "Other",
];

const timerModes: TimerMode[] = ["continuous", "pomodoro"];
const timerMoods: TimerMood[] = [
  "overwhelmed",
  "meh",
  "satisfied",
  "proud",
  "energized",
];
const estimateAccuracies: EstimateAccuracy[] = [
  "too-short",
  "about-right",
  "too-long",
];

function requireDb() {
  if (!db) {
    throw new Error("Firebase is not configured for this app build.");
  }

  return db;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function asCategory(value: unknown): TimerCategory {
  return timerCategories.includes(value as TimerCategory)
    ? (value as TimerCategory)
    : "Other";
}

function asMode(value: unknown): TimerMode {
  return timerModes.includes(value as TimerMode) ? (value as TimerMode) : "continuous";
}

function asMood(value: unknown): TimerMood | undefined {
  return timerMoods.includes(value as TimerMood) ? (value as TimerMood) : undefined;
}

function asEstimateAccuracy(value: unknown): EstimateAccuracy | undefined {
  return estimateAccuracies.includes(value as EstimateAccuracy)
    ? (value as EstimateAccuracy)
    : undefined;
}

function asSource(value: unknown): "timer" | "manual" | undefined {
  return value === "timer" || value === "manual" ? value : undefined;
}

function isValidDateTime(value: string | undefined) {
  return Boolean(value && Number.isFinite(new Date(value).getTime()));
}

function timestamp(value: {
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
}) {
  const time = new Date(
    value.endedAt || value.createdAt || value.startedAt || "",
  ).getTime();

  return Number.isFinite(time) ? time : 0;
}

function countUpdate<T extends { createdAt?: string; startedAt?: string; endedAt?: string }>(
  before: T,
  after: T,
) {
  return timestamp(after) !== timestamp(before) ? 1 : 0;
}

function stripUndefinedValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedValues);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, unknown>
  >((cleaned, [key, entryValue]) => {
    if (entryValue !== undefined) {
      cleaned[key] = stripUndefinedValues(entryValue);
    }

    return cleaned;
  }, {});
}

function toFirestoreRecord<T extends Record<string, unknown>>(record: T) {
  return {
    ...(stripUndefinedValues(record) as T),
    cloudUpdatedAt: serverTimestamp(),
  };
}

export function normalizeTimerSession(value: unknown): TimerSession | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const label = asString(value.label);
  const startedAt = asString(value.startedAt);
  const endedAt = asString(value.endedAt);
  const durationSeconds = asNumber(value.durationSeconds);

  if (
    !id ||
    !label ||
    !isValidDateTime(startedAt) ||
    !isValidDateTime(endedAt) ||
    durationSeconds === undefined ||
    durationSeconds < 0
  ) {
    return null;
  }

  return {
    id,
    label,
    category: asCategory(value.category),
    mode: asMode(value.mode),
    pomodoroMinutes: asNumber(value.pomodoroMinutes),
    startedAt: startedAt ?? "",
    endedAt: endedAt ?? "",
    durationSeconds,
    estimatedSpoons: asNumber(value.estimatedSpoons),
    spoonsUsed: asNumber(value.spoonsUsed),
    preNote: asString(value.preNote),
    reflection: asString(value.reflection),
    mood: asMood(value.mood),
    completed: asBoolean(value.completed),
    taskId: asString(value.taskId),
    taskTitle: asString(value.taskTitle),
    workingBlockId: asString(value.workingBlockId),
    plannedTaskBlockId: asString(value.plannedTaskBlockId),
    source: asSource(value.source) ?? "timer",
    completedTask: asBoolean(value.completedTask),
    estimateAccuracy: asEstimateAccuracy(value.estimateAccuracy),
    hadHiddenSetup: asBoolean(value.hadHiddenSetup),
    wasInterrupted: asBoolean(value.wasInterrupted),
  };
}

export function normalizeTimerSessions(value: unknown): TimerSession[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeTimerSession)
    .filter((session): session is TimerSession => Boolean(session));
}

export function normalizeManualWorkLog(value: unknown): ManualWorkLogEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const title = asString(value.title);
  const date = asString(value.date);
  const startTime = asString(value.startTime);
  const createdAt = asString(value.createdAt);

  if (!id || !title || !date || !startTime) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id,
    title,
    category: asCategory(value.category),
    date,
    startTime,
    endTime: asString(value.endTime),
    mood: asMood(value.mood),
    reflection: asString(value.reflection),
    completed: asBoolean(value.completed) ?? false,
    taskId: asString(value.taskId),
    taskTitle: asString(value.taskTitle),
    workingBlockId: asString(value.workingBlockId),
    plannedTaskBlockId: asString(value.plannedTaskBlockId),
    source: asSource(value.source) ?? "manual",
    completedTask: asBoolean(value.completedTask),
    estimateAccuracy: asEstimateAccuracy(value.estimateAccuracy),
    hadHiddenSetup: asBoolean(value.hadHiddenSetup),
    wasInterrupted: asBoolean(value.wasInterrupted),
    createdAt: createdAt ?? now,
  };
}

export function normalizeManualWorkLogs(value: unknown): ManualWorkLogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeManualWorkLog)
    .filter((entry): entry is ManualWorkLogEntry => Boolean(entry));
}

async function listCollectionRecords(collectionSegments: readonly string[]) {
  const firestore = requireDb();
  const snapshot = await getDocs(collection(firestore, collectionSegments.join("/")));

  return snapshot.docs.map((recordDoc) => ({
    ...recordDoc.data(),
    id:
      typeof recordDoc.data().id === "string"
        ? recordDoc.data().id
        : recordDoc.id,
  }));
}

export async function listUserTimerSessions(
  uid: string,
): Promise<TimerSession[]> {
  return normalizeTimerSessions(
    await listCollectionRecords(getUserTimerSessionsCollectionSegments(uid)),
  );
}

export async function readUserTimerSession(
  uid: string,
  sessionId: string,
): Promise<TimerSession | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserTimerSessionDocumentSegments(uid, sessionId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeTimerSession({
    ...snapshot.data(),
    id:
      typeof snapshot.data().id === "string"
        ? snapshot.data().id
        : snapshot.id,
  });
}

export async function listUserManualWorkLogs(
  uid: string,
): Promise<ManualWorkLogEntry[]> {
  return normalizeManualWorkLogs(
    await listCollectionRecords(getUserManualWorkLogsCollectionSegments(uid)),
  );
}

export async function readUserManualWorkLog(
  uid: string,
  logId: string,
): Promise<ManualWorkLogEntry | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserManualWorkLogDocumentSegments(uid, logId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeManualWorkLog({
    ...snapshot.data(),
    id:
      typeof snapshot.data().id === "string"
        ? snapshot.data().id
        : snapshot.id,
  });
}

export async function listUserTimerData(
  uid: string,
): Promise<TimerCloudSnapshot> {
  const [timerSessions, manualWorkLogs] = await Promise.all([
    listUserTimerSessions(uid),
    listUserManualWorkLogs(uid),
  ]);

  return { timerSessions, manualWorkLogs };
}

export async function countUserTimerData(uid: string): Promise<TimerCloudCounts> {
  const cloudData = await listUserTimerData(uid);

  return {
    timerSessions: cloudData.timerSessions.length,
    manualWorkLogs: cloudData.manualWorkLogs.length,
  };
}

export async function batchUploadUserTimerData(
  uid: string,
  snapshot: TimerCloudSnapshot,
) {
  const firestore = requireDb();
  const timerSessions = normalizeTimerSessions(snapshot.timerSessions);
  const manualWorkLogs = normalizeManualWorkLogs(snapshot.manualWorkLogs);
  const batch = writeBatch(firestore);

  timerSessions.forEach((session) => {
    batch.set(
      doc(firestore, ...getUserTimerSessionDocumentSegments(uid, session.id)),
      toFirestoreRecord(session),
      { merge: true },
    );
  });

  manualWorkLogs.forEach((entry) => {
    batch.set(
      doc(firestore, ...getUserManualWorkLogDocumentSegments(uid, entry.id)),
      toFirestoreRecord(entry),
      { merge: true },
    );
  });

  await batch.commit();

  return {
    timerSessions: timerSessions.length,
    manualWorkLogs: manualWorkLogs.length,
  };
}

export async function saveUserTimerSession(uid: string, session: TimerSession) {
  const firestore = requireDb();
  const normalizedSession = normalizeTimerSession(session);

  if (!normalizedSession) {
    throw new Error("Timer session could not be normalized for cloud save.");
  }

  await setDoc(
    doc(
      firestore,
      ...getUserTimerSessionDocumentSegments(uid, normalizedSession.id),
    ),
    toFirestoreRecord(normalizedSession),
    { merge: true },
  );
}

export async function saveUserManualWorkLog(
  uid: string,
  entry: ManualWorkLogEntry,
) {
  const firestore = requireDb();
  const normalizedEntry = normalizeManualWorkLog(entry);

  if (!normalizedEntry) {
    throw new Error("Manual work log could not be normalized for cloud save.");
  }

  await setDoc(
    doc(firestore, ...getUserManualWorkLogDocumentSegments(uid, normalizedEntry.id)),
    toFirestoreRecord(normalizedEntry),
    { merge: true },
  );
}

function getTimerSessionKey(session: TimerSession) {
  return [
    session.startedAt,
    session.endedAt,
    session.durationSeconds,
    session.taskId ?? "",
    session.workingBlockId ?? "",
    session.plannedTaskBlockId ?? "",
    session.label.trim().toLowerCase(),
  ].join("|");
}

function getManualWorkLogKey(entry: ManualWorkLogEntry) {
  return [
    entry.date,
    entry.startTime,
    entry.endTime ?? "",
    entry.taskId ?? "",
    entry.workingBlockId ?? "",
    entry.plannedTaskBlockId ?? "",
    entry.title.trim().toLowerCase(),
  ].join("|");
}

function chooseMergedTimerSession(
  localSession: TimerSession,
  cloudSession: TimerSession,
) {
  const localIsNewer = timestamp(localSession) >= timestamp(cloudSession);
  const newerSession = localIsNewer ? localSession : cloudSession;
  const olderSession = localIsNewer ? cloudSession : localSession;

  return {
    ...olderSession,
    ...newerSession,
    id: localSession.id,
    taskId: newerSession.taskId ?? olderSession.taskId,
    taskTitle: newerSession.taskTitle ?? olderSession.taskTitle,
    workingBlockId: newerSession.workingBlockId ?? olderSession.workingBlockId,
    plannedTaskBlockId:
      newerSession.plannedTaskBlockId ?? olderSession.plannedTaskBlockId,
    durationSeconds: Math.max(
      localSession.durationSeconds,
      cloudSession.durationSeconds,
    ),
    source: "timer" as const,
  };
}

function chooseMergedManualWorkLog(
  localEntry: ManualWorkLogEntry,
  cloudEntry: ManualWorkLogEntry,
) {
  const localIsNewer = timestamp(localEntry) >= timestamp(cloudEntry);
  const newerEntry = localIsNewer ? localEntry : cloudEntry;
  const olderEntry = localIsNewer ? cloudEntry : localEntry;

  return {
    ...olderEntry,
    ...newerEntry,
    id: localEntry.id,
    taskId: newerEntry.taskId ?? olderEntry.taskId,
    taskTitle: newerEntry.taskTitle ?? olderEntry.taskTitle,
    workingBlockId: newerEntry.workingBlockId ?? olderEntry.workingBlockId,
    plannedTaskBlockId:
      newerEntry.plannedTaskBlockId ?? olderEntry.plannedTaskBlockId,
    source: "manual" as const,
  };
}

function mergeTimerSessions(
  localSessionsInput: TimerSession[],
  cloudSessionsInput: TimerSession[],
) {
  const localSessions = normalizeTimerSessions(localSessionsInput);
  const cloudSessions = normalizeTimerSessions(cloudSessionsInput);
  const sessionsById = new Map<string, TimerSession>();
  const idByCompositeKey = new Map<string, string>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localSessions.forEach((session) => {
    sessionsById.set(session.id, session);
    idByCompositeKey.set(getTimerSessionKey(session), session.id);
  });

  cloudSessions.forEach((cloudSession) => {
    const matchingId = sessionsById.has(cloudSession.id)
      ? cloudSession.id
      : idByCompositeKey.get(getTimerSessionKey(cloudSession));
    const localSession = matchingId ? sessionsById.get(matchingId) : undefined;

    if (!localSession) {
      sessionsById.set(cloudSession.id, cloudSession);
      idByCompositeKey.set(getTimerSessionKey(cloudSession), cloudSession.id);
      addedCount += 1;
      return;
    }

    const mergedSession = chooseMergedTimerSession(localSession, cloudSession);
    sessionsById.set(localSession.id, mergedSession);
    updatedCount += countUpdate(localSession, mergedSession);
    dedupedCount += 1;
  });

  return {
    timerSessions: Array.from(sessionsById.values()).sort(
      (a, b) => timestamp(b) - timestamp(a),
    ),
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

function mergeManualWorkLogs(
  localEntriesInput: ManualWorkLogEntry[],
  cloudEntriesInput: ManualWorkLogEntry[],
) {
  const localEntries = normalizeManualWorkLogs(localEntriesInput);
  const cloudEntries = normalizeManualWorkLogs(cloudEntriesInput);
  const entriesById = new Map<string, ManualWorkLogEntry>();
  const idByCompositeKey = new Map<string, string>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localEntries.forEach((entry) => {
    entriesById.set(entry.id, entry);
    idByCompositeKey.set(getManualWorkLogKey(entry), entry.id);
  });

  cloudEntries.forEach((cloudEntry) => {
    const matchingId = entriesById.has(cloudEntry.id)
      ? cloudEntry.id
      : idByCompositeKey.get(getManualWorkLogKey(cloudEntry));
    const localEntry = matchingId ? entriesById.get(matchingId) : undefined;

    if (!localEntry) {
      entriesById.set(cloudEntry.id, cloudEntry);
      idByCompositeKey.set(getManualWorkLogKey(cloudEntry), cloudEntry.id);
      addedCount += 1;
      return;
    }

    const mergedEntry = chooseMergedManualWorkLog(localEntry, cloudEntry);
    entriesById.set(localEntry.id, mergedEntry);
    updatedCount += countUpdate(localEntry, mergedEntry);
    dedupedCount += 1;
  });

  return {
    manualWorkLogs: Array.from(entriesById.values()).sort(
      (a, b) => timestamp(b) - timestamp(a),
    ),
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

export function mergeTimerDataForSync(
  localSnapshot: TimerCloudSnapshot,
  cloudSnapshot: TimerCloudSnapshot,
): TimerMergeResult {
  const timerSessions = mergeTimerSessions(
    localSnapshot.timerSessions,
    cloudSnapshot.timerSessions,
  );
  const manualWorkLogs = mergeManualWorkLogs(
    localSnapshot.manualWorkLogs,
    cloudSnapshot.manualWorkLogs,
  );

  return {
    timerSessions: timerSessions.timerSessions,
    manualWorkLogs: manualWorkLogs.manualWorkLogs,
    addedCount: timerSessions.addedCount + manualWorkLogs.addedCount,
    updatedCount: timerSessions.updatedCount + manualWorkLogs.updatedCount,
    dedupedCount: timerSessions.dedupedCount + manualWorkLogs.dedupedCount,
  };
}

export async function pullUserTimerData(uid: string) {
  return listUserTimerData(uid);
}

export async function pushMergedUserTimerData(
  uid: string,
  localSnapshot: TimerCloudSnapshot,
  cloudSnapshot: TimerCloudSnapshot,
) {
  const mergeResult = mergeTimerDataForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserTimerData(uid, mergeResult);

  return mergeResult;
}
