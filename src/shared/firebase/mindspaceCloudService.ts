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
  GoalStatus,
  GoalTimeHorizon,
  MindspaceConversionTarget,
  MindspaceGoal,
  MindspaceItem,
  MindspaceItemArea,
  MindspaceItemKind,
  MindspaceItemStatus,
} from "../../features/mindspace/types";
import { db } from "./firebaseClient";
import {
  getUserMindspaceGoalDocumentSegments,
  getUserMindspaceGoalsCollectionSegments,
  getUserMindspaceItemDocumentSegments,
  getUserMindspaceItemsCollectionSegments,
} from "./firestorePaths";

export type MindspaceCloudSnapshot = {
  items: MindspaceItem[];
  goals: MindspaceGoal[];
};

export type MindspaceCloudCounts = {
  items: number;
  goals: number;
};

export type MindspaceMergeResult = MindspaceCloudSnapshot & {
  addedCount: number;
  updatedCount: number;
  dedupedCount: number;
};

const itemStatuses: MindspaceItemStatus[] = [
  "inbox",
  "clarify-later",
  "converted",
  "released",
  "archived",
];
const itemKinds: MindspaceItemKind[] = [
  "thought",
  "worry",
  "idea",
  "reminder",
  "question",
  "goal-seed",
  "avoidance",
  "other",
];
const itemAreas: MindspaceItemArea[] = [
  "research",
  "teaching",
  "service",
  "personal",
  "mindspace",
  "other",
];
const conversionTargets: MindspaceConversionTarget[] = [
  "task",
  "research-idea",
  "teaching-note",
  "service-item",
  "goal",
  "release",
];
const goalStatuses: GoalStatus[] = ["active", "paused", "completed", "archived"];
const goalHorizons: GoalTimeHorizon[] = ["long-term", "semester", "month", "week"];

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

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );

  return strings.length > 0 ? strings : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function asItemStatus(value: unknown): MindspaceItemStatus {
  if (itemStatuses.includes(value as MindspaceItemStatus)) {
    return value as MindspaceItemStatus;
  }

  if (value === "parked") return "clarify-later";
  if (value === "actionable") return "inbox";
  if (value === "resolved") return "released";

  return "inbox";
}

function asItemKind(value: unknown): MindspaceItemKind {
  if (itemKinds.includes(value as MindspaceItemKind)) {
    return value as MindspaceItemKind;
  }

  if (value === "loop") return "avoidance";
  if (value === "decision" || value === "boundary" || value === "parking-lot") {
    return "thought";
  }

  return "thought";
}

function asItemArea(value: unknown): MindspaceItemArea {
  if (itemAreas.includes(value as MindspaceItemArea)) {
    return value as MindspaceItemArea;
  }

  if (value === "career" || value === "admin" || value === "recovery") {
    return "personal";
  }

  return "mindspace";
}

function asEmotionalWeight(value: unknown): MindspaceItem["emotionalWeight"] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : undefined;
}

function asConversionTarget(value: unknown): MindspaceConversionTarget | undefined {
  return conversionTargets.includes(value as MindspaceConversionTarget)
    ? (value as MindspaceConversionTarget)
    : undefined;
}

function asGoalStatus(value: unknown): GoalStatus {
  if (goalStatuses.includes(value as GoalStatus)) {
    return value as GoalStatus;
  }

  if (value === "done-enough") return "completed";
  if (value === "seed" || value === "warming-up" || value === "in-motion") {
    return "active";
  }

  return "active";
}

function asGoalHorizon(value: unknown): GoalTimeHorizon {
  if (goalHorizons.includes(value as GoalTimeHorizon)) {
    return value as GoalTimeHorizon;
  }

  if (value === "monthly") return "month";
  if (value === "weekly") return "week";

  return "week";
}

function timestamp(value: { createdAt?: string; updatedAt?: string }) {
  const time = new Date(value.updatedAt || value.createdAt || "").getTime();

  return Number.isFinite(time) ? time : 0;
}

function countUpdate<T extends { createdAt?: string; updatedAt?: string }>(
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

export function normalizeMindspaceItem(value: unknown): MindspaceItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value.title);

  if (!title) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;
  const emotionalWeight =
    asEmotionalWeight(value.emotionalWeight) ?? asEmotionalWeight(value.emotionalLoad);

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    title,
    body: asString(value.body),
    kind: asItemKind(value.kind ?? value.type),
    area: asItemArea(value.area),
    status: asItemStatus(value.status),
    nextAction: asString(value.nextAction),
    tinyStep: asString(value.tinyStep),
    emotionalWeight,
    lowEnergyFriendly: asBoolean(value.lowEnergyFriendly),
    convertedToType: asConversionTarget(value.convertedToType),
    convertedToId: asString(value.convertedToId),
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
    lastTouchedAt: asString(value.lastTouchedAt),
  };
}

export function normalizeMindspaceItems(value: unknown): MindspaceItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeMindspaceItem)
    .filter((item): item is MindspaceItem => Boolean(item));
}

export function normalizeMindspaceGoal(value: unknown): MindspaceGoal | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value.title);

  if (!title) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    title,
    description: asString(value.description) ?? asString(value.whyItMatters),
    horizon: asGoalHorizon(value.horizon),
    status: asGoalStatus(value.status),
    parentGoalId: asString(value.parentGoalId),
    nextAction: asString(value.nextAction),
    tinyStep: asString(value.tinyStep),
    linkedTaskIds: asStringArray(value.linkedTaskIds),
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
  };
}

export function normalizeMindspaceGoals(value: unknown): MindspaceGoal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeMindspaceGoal)
    .filter((goal): goal is MindspaceGoal => Boolean(goal));
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

export async function listUserMindspaceItems(
  uid: string,
): Promise<MindspaceItem[]> {
  return normalizeMindspaceItems(
    await listCollectionRecords(getUserMindspaceItemsCollectionSegments(uid)),
  );
}

export async function readUserMindspaceItem(
  uid: string,
  itemId: string,
): Promise<MindspaceItem | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserMindspaceItemDocumentSegments(uid, itemId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeMindspaceItem({
    ...snapshot.data(),
    id:
      typeof snapshot.data().id === "string"
        ? snapshot.data().id
        : snapshot.id,
  });
}

export async function listUserMindspaceGoals(
  uid: string,
): Promise<MindspaceGoal[]> {
  return normalizeMindspaceGoals(
    await listCollectionRecords(getUserMindspaceGoalsCollectionSegments(uid)),
  );
}

export async function readUserMindspaceGoal(
  uid: string,
  goalId: string,
): Promise<MindspaceGoal | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserMindspaceGoalDocumentSegments(uid, goalId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeMindspaceGoal({
    ...snapshot.data(),
    id:
      typeof snapshot.data().id === "string"
        ? snapshot.data().id
        : snapshot.id,
  });
}

export async function listUserMindspaceData(
  uid: string,
): Promise<MindspaceCloudSnapshot> {
  const [items, goals] = await Promise.all([
    listUserMindspaceItems(uid),
    listUserMindspaceGoals(uid),
  ]);

  return { items, goals };
}

export async function countUserMindspaceData(
  uid: string,
): Promise<MindspaceCloudCounts> {
  const cloudData = await listUserMindspaceData(uid);

  return {
    items: cloudData.items.length,
    goals: cloudData.goals.length,
  };
}

export async function batchUploadUserMindspaceData(
  uid: string,
  snapshot: MindspaceCloudSnapshot,
) {
  const firestore = requireDb();
  const items = normalizeMindspaceItems(snapshot.items);
  const goals = normalizeMindspaceGoals(snapshot.goals);
  const batch = writeBatch(firestore);

  items.forEach((item) => {
    batch.set(
      doc(firestore, ...getUserMindspaceItemDocumentSegments(uid, item.id)),
      toFirestoreRecord(item),
      { merge: true },
    );
  });

  goals.forEach((goal) => {
    batch.set(
      doc(firestore, ...getUserMindspaceGoalDocumentSegments(uid, goal.id)),
      toFirestoreRecord(goal),
      { merge: true },
    );
  });

  await batch.commit();

  return {
    items: items.length,
    goals: goals.length,
  };
}

export async function saveUserMindspaceItem(uid: string, item: MindspaceItem) {
  const firestore = requireDb();
  const normalizedItem = normalizeMindspaceItem(item);

  if (!normalizedItem) {
    throw new Error("Mindspace item could not be normalized for cloud save.");
  }

  await setDoc(
    doc(firestore, ...getUserMindspaceItemDocumentSegments(uid, normalizedItem.id)),
    toFirestoreRecord(normalizedItem),
    { merge: true },
  );
}

export async function saveUserMindspaceGoal(uid: string, goal: MindspaceGoal) {
  const firestore = requireDb();
  const normalizedGoal = normalizeMindspaceGoal(goal);

  if (!normalizedGoal) {
    throw new Error("Mindspace goal could not be normalized for cloud save.");
  }

  await setDoc(
    doc(firestore, ...getUserMindspaceGoalDocumentSegments(uid, normalizedGoal.id)),
    toFirestoreRecord(normalizedGoal),
    { merge: true },
  );
}

function getItemCompositeKey(item: MindspaceItem) {
  return [
    item.createdAt,
    item.title.trim().toLowerCase(),
    item.kind,
    item.area,
    item.body?.trim().toLowerCase() ?? "",
  ].join("|");
}

function getGoalCompositeKey(goal: MindspaceGoal) {
  return [
    goal.createdAt,
    goal.title.trim().toLowerCase(),
    goal.horizon,
    goal.parentGoalId ?? "",
  ].join("|");
}

function mergeItemStatus(
  localStatus: MindspaceItemStatus,
  cloudStatus: MindspaceItemStatus,
  fallbackStatus: MindspaceItemStatus,
) {
  if (localStatus === "archived" || cloudStatus === "archived") return "archived";
  if (localStatus === "released" || cloudStatus === "released") return "released";
  if (localStatus === "converted" || cloudStatus === "converted") return "converted";
  if (localStatus === "clarify-later" || cloudStatus === "clarify-later") {
    return "clarify-later";
  }

  return fallbackStatus;
}

function mergeGoalStatus(
  localStatus: GoalStatus,
  cloudStatus: GoalStatus,
  fallbackStatus: GoalStatus,
) {
  if (localStatus === "archived" || cloudStatus === "archived") return "archived";
  if (localStatus === "completed" || cloudStatus === "completed") {
    return "completed";
  }

  return fallbackStatus;
}

function chooseMergedItem(localItem: MindspaceItem, cloudItem: MindspaceItem) {
  const localIsNewer = timestamp(localItem) >= timestamp(cloudItem);
  const newerItem = localIsNewer ? localItem : cloudItem;
  const olderItem = localIsNewer ? cloudItem : localItem;

  return {
    ...olderItem,
    ...newerItem,
    id: localItem.id,
    convertedToType: newerItem.convertedToType ?? olderItem.convertedToType,
    convertedToId: newerItem.convertedToId ?? olderItem.convertedToId,
    nextAction: newerItem.nextAction ?? olderItem.nextAction,
    tinyStep: newerItem.tinyStep ?? olderItem.tinyStep,
    status: mergeItemStatus(localItem.status, cloudItem.status, newerItem.status),
    updatedAt:
      timestamp(localItem) || timestamp(cloudItem)
        ? new Date(Math.max(timestamp(localItem), timestamp(cloudItem))).toISOString()
        : new Date().toISOString(),
    lastTouchedAt: newerItem.lastTouchedAt ?? olderItem.lastTouchedAt,
  };
}

function chooseMergedGoal(localGoal: MindspaceGoal, cloudGoal: MindspaceGoal) {
  const localIsNewer = timestamp(localGoal) >= timestamp(cloudGoal);
  const newerGoal = localIsNewer ? localGoal : cloudGoal;
  const olderGoal = localIsNewer ? cloudGoal : localGoal;

  return {
    ...olderGoal,
    ...newerGoal,
    id: localGoal.id,
    parentGoalId: newerGoal.parentGoalId ?? olderGoal.parentGoalId,
    linkedTaskIds: Array.from(
      new Set([...(olderGoal.linkedTaskIds ?? []), ...(newerGoal.linkedTaskIds ?? [])]),
    ),
    status: mergeGoalStatus(localGoal.status, cloudGoal.status, newerGoal.status),
    updatedAt:
      timestamp(localGoal) || timestamp(cloudGoal)
        ? new Date(Math.max(timestamp(localGoal), timestamp(cloudGoal))).toISOString()
        : new Date().toISOString(),
  };
}

function mergeMindspaceItems(
  localItemsInput: MindspaceItem[],
  cloudItemsInput: MindspaceItem[],
) {
  const localItems = normalizeMindspaceItems(localItemsInput);
  const cloudItems = normalizeMindspaceItems(cloudItemsInput);
  const itemsById = new Map<string, MindspaceItem>();
  const idByCompositeKey = new Map<string, string>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localItems.forEach((item) => {
    itemsById.set(item.id, item);
    idByCompositeKey.set(getItemCompositeKey(item), item.id);
  });

  cloudItems.forEach((cloudItem) => {
    const matchingId = itemsById.has(cloudItem.id)
      ? cloudItem.id
      : idByCompositeKey.get(getItemCompositeKey(cloudItem));
    const localItem = matchingId ? itemsById.get(matchingId) : undefined;

    if (!localItem) {
      itemsById.set(cloudItem.id, cloudItem);
      idByCompositeKey.set(getItemCompositeKey(cloudItem), cloudItem.id);
      addedCount += 1;
      return;
    }

    const mergedItem = chooseMergedItem(localItem, cloudItem);
    itemsById.set(localItem.id, mergedItem);
    updatedCount += countUpdate(localItem, mergedItem);
    dedupedCount += 1;
  });

  return {
    items: Array.from(itemsById.values()).sort(
      (a, b) => timestamp(b) - timestamp(a),
    ),
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

function mergeMindspaceGoals(
  localGoalsInput: MindspaceGoal[],
  cloudGoalsInput: MindspaceGoal[],
) {
  const localGoals = normalizeMindspaceGoals(localGoalsInput);
  const cloudGoals = normalizeMindspaceGoals(cloudGoalsInput);
  const goalsById = new Map<string, MindspaceGoal>();
  const idByCompositeKey = new Map<string, string>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localGoals.forEach((goal) => {
    goalsById.set(goal.id, goal);
    idByCompositeKey.set(getGoalCompositeKey(goal), goal.id);
  });

  cloudGoals.forEach((cloudGoal) => {
    const matchingId = goalsById.has(cloudGoal.id)
      ? cloudGoal.id
      : idByCompositeKey.get(getGoalCompositeKey(cloudGoal));
    const localGoal = matchingId ? goalsById.get(matchingId) : undefined;

    if (!localGoal) {
      goalsById.set(cloudGoal.id, cloudGoal);
      idByCompositeKey.set(getGoalCompositeKey(cloudGoal), cloudGoal.id);
      addedCount += 1;
      return;
    }

    const mergedGoal = chooseMergedGoal(localGoal, cloudGoal);
    goalsById.set(localGoal.id, mergedGoal);
    updatedCount += countUpdate(localGoal, mergedGoal);
    dedupedCount += 1;
  });

  return {
    goals: Array.from(goalsById.values()).sort(
      (a, b) => timestamp(b) - timestamp(a),
    ),
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

export function mergeMindspaceDataForSync(
  localSnapshot: MindspaceCloudSnapshot,
  cloudSnapshot: MindspaceCloudSnapshot,
): MindspaceMergeResult {
  const items = mergeMindspaceItems(localSnapshot.items, cloudSnapshot.items);
  const goals = mergeMindspaceGoals(localSnapshot.goals, cloudSnapshot.goals);

  return {
    items: items.items,
    goals: goals.goals,
    addedCount: items.addedCount + goals.addedCount,
    updatedCount: items.updatedCount + goals.updatedCount,
    dedupedCount: items.dedupedCount + goals.dedupedCount,
  };
}

export async function pullUserMindspaceData(uid: string) {
  return listUserMindspaceData(uid);
}

export async function pushMergedUserMindspaceData(
  uid: string,
  localSnapshot: MindspaceCloudSnapshot,
  cloudSnapshot: MindspaceCloudSnapshot,
) {
  const mergeResult = mergeMindspaceDataForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserMindspaceData(uid, mergeResult);

  return mergeResult;
}
