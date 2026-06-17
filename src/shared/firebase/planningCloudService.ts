import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import {
  flattenWorkingBlocks,
  mergePlanningForSync,
  normalizeDailyCheckIns,
  normalizeEndOfDayReviews,
  normalizePlannedTaskBlocks,
  normalizeWorkingBlocks,
  type PlanningCloudSnapshot,
  type PlanningStorageSnapshot,
} from "../../features/dashboard/utils/planningStorage";
import type {
  DailyCheckIn,
  EndOfDayReview,
  PlannedTaskBlock,
  WorkingBlock,
} from "../types/planning";
import { db } from "./firebaseClient";
import {
  getUserDailyCheckInDocumentSegments,
  getUserDailyCheckInsCollectionSegments,
  getUserEndOfDayReviewDocumentSegments,
  getUserEndOfDayReviewsCollectionSegments,
  getUserPlannedTaskBlockDocumentSegments,
  getUserPlannedTaskBlocksCollectionSegments,
  getUserWorkingBlockDocumentSegments,
  getUserWorkingBlocksCollectionSegments,
} from "./firestorePaths";

export type PlanningCloudCounts = {
  dailyCheckIns: number;
  workingBlocks: number;
  plannedTaskBlocks: number;
  endOfDayReviews: number;
};

function requireDb() {
  if (!db) {
    throw new Error("Firebase is not configured for this app build.");
  }

  return db;
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

export async function listUserDailyCheckIns(uid: string): Promise<DailyCheckIn[]> {
  return normalizeDailyCheckIns(
    await listCollectionRecords(getUserDailyCheckInsCollectionSegments(uid)),
  );
}

export async function listUserWorkingBlocks(uid: string): Promise<WorkingBlock[]> {
  return normalizeWorkingBlocks(
    await listCollectionRecords(getUserWorkingBlocksCollectionSegments(uid)),
  );
}

export async function listUserPlannedTaskBlocks(
  uid: string,
): Promise<PlannedTaskBlock[]> {
  return normalizePlannedTaskBlocks(
    await listCollectionRecords(getUserPlannedTaskBlocksCollectionSegments(uid)),
  );
}

export async function listUserEndOfDayReviews(
  uid: string,
): Promise<EndOfDayReview[]> {
  return normalizeEndOfDayReviews(
    await listCollectionRecords(getUserEndOfDayReviewsCollectionSegments(uid)),
  );
}

export async function listUserPlanningData(
  uid: string,
): Promise<PlanningCloudSnapshot> {
  const [checkIns, workingBlocks, plannedBlocks, reviews] = await Promise.all([
    listUserDailyCheckIns(uid),
    listUserWorkingBlocks(uid),
    listUserPlannedTaskBlocks(uid),
    listUserEndOfDayReviews(uid),
  ]);

  return {
    checkIns,
    workingBlocks,
    plannedBlocks,
    reviews,
  };
}

export async function countUserPlanningData(
  uid: string,
): Promise<PlanningCloudCounts> {
  const cloudData = await listUserPlanningData(uid);

  return {
    dailyCheckIns: cloudData.checkIns.length,
    workingBlocks: cloudData.workingBlocks.length,
    plannedTaskBlocks: cloudData.plannedBlocks.length,
    endOfDayReviews: cloudData.reviews.length,
  };
}

export async function batchUploadUserPlanningData(
  uid: string,
  snapshot: PlanningStorageSnapshot,
) {
  const firestore = requireDb();
  const normalizedSnapshot: PlanningStorageSnapshot = {
    checkIns: normalizeDailyCheckIns(snapshot.checkIns),
    plannedBlocks: normalizePlannedTaskBlocks(snapshot.plannedBlocks),
    reviews: normalizeEndOfDayReviews(snapshot.reviews),
  };
  const workingBlocks = flattenWorkingBlocks(normalizedSnapshot.checkIns);
  const batch = writeBatch(firestore);

  normalizedSnapshot.checkIns.forEach((checkIn) => {
    batch.set(
      doc(
        firestore,
        ...getUserDailyCheckInDocumentSegments(uid, checkIn.date || checkIn.id),
      ),
      toFirestoreRecord(checkIn),
      { merge: true },
    );
  });

  workingBlocks.forEach((block) => {
    batch.set(
      doc(firestore, ...getUserWorkingBlockDocumentSegments(uid, block.id)),
      toFirestoreRecord(block),
      { merge: true },
    );
  });

  normalizedSnapshot.plannedBlocks.forEach((plannedBlock) => {
    batch.set(
      doc(
        firestore,
        ...getUserPlannedTaskBlockDocumentSegments(uid, plannedBlock.id),
      ),
      toFirestoreRecord(plannedBlock),
      { merge: true },
    );
  });

  normalizedSnapshot.reviews.forEach((review) => {
    batch.set(
      doc(
        firestore,
        ...getUserEndOfDayReviewDocumentSegments(uid, review.date || review.id),
      ),
      toFirestoreRecord(review),
      { merge: true },
    );
  });

  await batch.commit();

  return {
    dailyCheckIns: normalizedSnapshot.checkIns.length,
    workingBlocks: workingBlocks.length,
    plannedTaskBlocks: normalizedSnapshot.plannedBlocks.length,
    endOfDayReviews: normalizedSnapshot.reviews.length,
  };
}

export async function saveUserPlanningSnapshot(
  uid: string,
  snapshot: PlanningStorageSnapshot,
) {
  return batchUploadUserPlanningData(uid, snapshot);
}

export async function pullUserPlanningData(uid: string) {
  return listUserPlanningData(uid);
}

export async function pushMergedUserPlanningData(
  uid: string,
  localSnapshot: PlanningStorageSnapshot,
  cloudSnapshot: PlanningCloudSnapshot,
) {
  const mergeResult = mergePlanningForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserPlanningData(uid, mergeResult);

  return mergeResult;
}

export async function saveUserDailyCheckIn(uid: string, checkIn: DailyCheckIn) {
  const firestore = requireDb();
  const normalizedCheckIn = normalizeDailyCheckIns([checkIn])[0];

  if (!normalizedCheckIn) {
    throw new Error("Daily check-in could not be normalized for cloud save.");
  }

  await setDoc(
    doc(
      firestore,
      ...getUserDailyCheckInDocumentSegments(
        uid,
        normalizedCheckIn.date || normalizedCheckIn.id,
      ),
    ),
    toFirestoreRecord(normalizedCheckIn),
    { merge: true },
  );
}
