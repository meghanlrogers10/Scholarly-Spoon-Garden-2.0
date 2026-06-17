import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { normalizeTaskRecord, normalizeTasks } from "../hooks/useTaskBridge";
import type { Task } from "../types/task";
import { db } from "./firebaseClient";
import {
  getUserTaskDocumentSegments,
  getUserTasksCollectionSegments,
} from "./firestorePaths";

export type TaskMergeResult = {
  tasks: Task[];
  addedCount: number;
  updatedCount: number;
  dedupedCount: number;
};

function requireDb() {
  if (!db) {
    throw new Error("Firebase is not configured for this app build.");
  }

  return db;
}

function taskTimestamp(task: Task) {
  const timestamp = new Date(task.updatedAt || task.createdAt).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getSourceKey(task: Task) {
  return task.source && task.sourceId ? `${task.source}:${task.sourceId}` : "";
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

function toFirestoreTask(task: Task) {
  return {
    ...(stripUndefinedValues(task) as Task),
    cloudUpdatedAt: serverTimestamp(),
  };
}

export async function listUserTasks(uid: string): Promise<Task[]> {
  const firestore = requireDb();
  const tasksRef = collection(firestore, ...getUserTasksCollectionSegments(uid));
  const snapshot = await getDocs(tasksRef);

  return normalizeTasks(
    snapshot.docs.map((taskDoc) => ({
      ...taskDoc.data(),
      id: typeof taskDoc.data().id === "string" ? taskDoc.data().id : taskDoc.id,
    }))
  );
}

export async function readUserTask(uid: string, taskId: string): Promise<Task | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserTaskDocumentSegments(uid, taskId))
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeTaskRecord({
    ...snapshot.data(),
    id:
      typeof snapshot.data().id === "string"
        ? snapshot.data().id
        : snapshot.id,
  });
}

export async function saveUserTask(uid: string, task: Task) {
  const firestore = requireDb();
  const normalizedTask = normalizeTaskRecord(task);

  if (!normalizedTask) {
    throw new Error("Task could not be normalized for cloud save.");
  }

  await setDoc(
    doc(firestore, ...getUserTaskDocumentSegments(uid, normalizedTask.id)),
    toFirestoreTask(normalizedTask),
    { merge: true }
  );
}

export async function updateUserTask(uid: string, task: Task) {
  await saveUserTask(uid, task);
}

export async function archiveUserTask(uid: string, taskId: string) {
  const firestore = requireDb();

  await updateDoc(doc(firestore, ...getUserTaskDocumentSegments(uid, taskId)), {
    status: "archived",
    today: false,
    updatedAt: new Date().toISOString(),
    cloudUpdatedAt: serverTimestamp(),
  });
}

export async function deleteUserTask(uid: string, taskId: string) {
  const firestore = requireDb();

  await deleteDoc(doc(firestore, ...getUserTaskDocumentSegments(uid, taskId)));
}

export async function batchUploadUserTasks(uid: string, tasks: Task[]) {
  const firestore = requireDb();
  const normalizedTasks = normalizeTasks(tasks);
  const batch = writeBatch(firestore);

  normalizedTasks.forEach((task) => {
    batch.set(
      doc(firestore, ...getUserTaskDocumentSegments(uid, task.id)),
      toFirestoreTask(task),
      { merge: true }
    );
  });

  await batch.commit();

  return normalizedTasks.length;
}

function chooseMergedTask(localTask: Task, cloudTask: Task): Task {
  const localIsNewer = taskTimestamp(localTask) >= taskTimestamp(cloudTask);
  const newerTask = localIsNewer ? localTask : cloudTask;
  const olderTask = localIsNewer ? cloudTask : localTask;

  return {
    ...olderTask,
    ...newerTask,
    id: localTask.id,
    source: newerTask.source ?? olderTask.source,
    sourceId: newerTask.sourceId ?? olderTask.sourceId,
    actualMinutesTotal: Math.max(
      localTask.actualMinutesTotal ?? 0,
      cloudTask.actualMinutesTotal ?? 0
    ),
    actualSessionCount: Math.max(
      localTask.actualSessionCount ?? 0,
      cloudTask.actualSessionCount ?? 0
    ),
    status:
      localTask.status === "archived" || cloudTask.status === "archived"
        ? "archived"
        : newerTask.status,
    today:
      localTask.status === "archived" || cloudTask.status === "archived"
        ? false
        : newerTask.today,
    updatedAt:
      taskTimestamp(localTask) || taskTimestamp(cloudTask)
        ? new Date(
            Math.max(taskTimestamp(localTask), taskTimestamp(cloudTask))
          ).toISOString()
        : new Date().toISOString(),
  };
}

export function mergeTasksForSync(
  localTasksInput: Task[],
  cloudTasksInput: Task[]
): TaskMergeResult {
  const localTasks = normalizeTasks(localTasksInput);
  const cloudTasks = normalizeTasks(cloudTasksInput);
  const mergedById = new Map<string, Task>();
  const idBySourceKey = new Map<string, string>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localTasks.forEach((task) => {
    mergedById.set(task.id, task);
    const sourceKey = getSourceKey(task);

    if (sourceKey) {
      idBySourceKey.set(sourceKey, task.id);
    }
  });

  cloudTasks.forEach((cloudTask) => {
    const sourceKey = getSourceKey(cloudTask);
    const matchingId = mergedById.has(cloudTask.id)
      ? cloudTask.id
      : sourceKey
        ? idBySourceKey.get(sourceKey)
        : undefined;
    const localMatch = matchingId ? mergedById.get(matchingId) : undefined;

    if (!localMatch) {
      mergedById.set(cloudTask.id, cloudTask);

      if (sourceKey) {
        idBySourceKey.set(sourceKey, cloudTask.id);
      }

      addedCount += 1;
      return;
    }

    const mergedTask = chooseMergedTask(localMatch, cloudTask);
    mergedById.set(localMatch.id, mergedTask);
    updatedCount += taskTimestamp(mergedTask) !== taskTimestamp(localMatch) ? 1 : 0;
    dedupedCount += localMatch.id !== cloudTask.id ? 1 : 0;
  });

  const tasks = Array.from(mergedById.values()).sort(
    (a, b) => taskTimestamp(b) - taskTimestamp(a)
  );

  return {
    tasks,
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

export async function pullUserTasks(uid: string) {
  return listUserTasks(uid);
}

export async function pushMergedUserTasks(
  uid: string,
  localTasks: Task[],
  cloudTasks: Task[]
) {
  const mergeResult = mergeTasksForSync(localTasks, cloudTasks);

  await batchUploadUserTasks(uid, mergeResult.tasks);

  return mergeResult;
}
