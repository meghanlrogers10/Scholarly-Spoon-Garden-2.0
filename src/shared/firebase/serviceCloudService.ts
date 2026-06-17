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
  AdvisingMilestone,
  AdvisingMilestoneName,
  AdvisingMilestoneStatus,
  AdvisingRole,
  AdvisingStudent,
  AdvisingStudentStatus,
  CareerGoal,
  Committee,
  CommitteeLoadRating,
  CommitteeStatus,
  ReviewLetter,
  ReviewLetterStatus,
  ReviewLetterType,
  SemesterGoalStatus,
  ServiceAdminItem,
  ServiceAdminStatus,
  ServiceAdminType,
  ServiceBoundaryLesson,
  ServiceBucket,
  ServiceItem,
  ServiceStatus,
  SpoonCost,
} from "../../features/service/types";
import { db } from "./firebaseClient";
import {
  getUserAdvisingStudentDocumentSegments,
  getUserAdvisingStudentsCollectionSegments,
  getUserServiceAdminItemDocumentSegments,
  getUserServiceAdminItemsCollectionSegments,
  getUserServiceBoundaryLessonDocumentSegments,
  getUserServiceBoundaryLessonsCollectionSegments,
  getUserServiceCommitteeDocumentSegments,
  getUserServiceCommitteesCollectionSegments,
  getUserServiceItemDocumentSegments,
  getUserServiceItemsCollectionSegments,
  getUserServiceReviewLetterDocumentSegments,
  getUserServiceReviewLettersCollectionSegments,
} from "./firestorePaths";

export type ServiceCloudSnapshot = {
  serviceItems: ServiceItem[];
  committees: Committee[];
  advisingStudents: AdvisingStudent[];
  reviewLetters: ReviewLetter[];
  adminItems: ServiceAdminItem[];
  boundaryLessons: ServiceBoundaryLesson[];
};

export type ServiceCloudCounts = {
  serviceItems: number;
  committees: number;
  advisingStudents: number;
  reviewLetters: number;
  adminItems: number;
  boundaryLessons: number;
};

export type ServiceMergeResult = ServiceCloudSnapshot & {
  addedCount: number;
  updatedCount: number;
  dedupedCount: number;
};

const serviceBuckets: ServiceBucket[] = [
  "committee",
  "review-letter",
  "advising",
  "admin-other",
];
const serviceStatuses: ServiceStatus[] = [
  "inbox",
  "requested",
  "accepted",
  "in-progress",
  "waiting-on-me",
  "waiting-on-others",
  "done",
  "declined",
  "archived",
];
const committeeStatuses: CommitteeStatus[] = ["active", "archived"];
const committeeLoadRatings: CommitteeLoadRating[] = ["light", "moderate", "heavy"];
const milestoneNames: AdvisingMilestoneName[] = [
  "Coursework",
  "MA",
  "Comps",
  "Prospectus",
  "Prospectus Defense",
  "Dissertation Drafts",
  "Defense",
  "Job Market",
];
const milestoneStatuses: AdvisingMilestoneStatus[] = [
  "not-started",
  "in-progress",
  "done",
  "stalled",
  "not-applicable",
];
const advisingRoles: AdvisingRole[] = ["chair", "committee", "mentor", "informal"];
const advisingStatuses: AdvisingStudentStatus[] = ["active", "archived"];
const semesterGoalStatuses: SemesterGoalStatus[] = [
  "not-started",
  "in-progress",
  "reached",
  "revised",
  "stalled",
];
const careerGoals: CareerGoal[] = [
  "R1 faculty",
  "R2 / regional university faculty",
  "SLAC / teaching-focused faculty",
  "Community college",
  "Research institute",
  "Government",
  "Nonprofit",
  "Industry",
  "Policy work",
  "Non-academic",
  "Unsure / exploring",
];
const reviewLetterTypes: ReviewLetterType[] = [
  "peer-review",
  "tenure-promotion-letter",
  "recommendation-letter",
  "manuscript-review",
  "grant-review",
  "other",
];
const reviewLetterStatuses: ReviewLetterStatus[] = [
  "not-started",
  "in-progress",
  "waiting",
  "submitted",
  "declined",
  "archived",
];
const adminTypes: ServiceAdminType[] = [
  "admin-task",
  "form",
  "meeting-follow-up",
  "report",
  "email",
  "policy",
  "event",
  "other",
];
const adminStatuses: ServiceAdminStatus[] = [
  "not-started",
  "in-progress",
  "waiting",
  "done",
  "archived",
];
const boundaryStatuses: ServiceBoundaryLesson["status"][] = [
  "active-lesson",
  "archived-lesson",
];
const boundaryKinds: NonNullable<ServiceBoundaryLesson["relatedKind"]>[] = [
  "service-item",
  "review-letter",
  "admin-other",
  "committee",
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

function asEnum<T extends string>(value: unknown, allowed: readonly T[]) {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function asSpoonCost(value: unknown): SpoonCost | undefined {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : undefined;
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

function normalizeTextKey(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
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

function withCreatedAndUpdatedAt(value: Record<string, unknown>) {
  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;

  return {
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
  };
}

function normalizeMilestone(value: unknown): AdvisingMilestone | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = asEnum(value.name, milestoneNames);

  if (!name) {
    return null;
  }

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    name,
    status: asEnum(value.status, milestoneStatuses) ?? "not-started",
    targetDate: asString(value.targetDate),
    completedDate: asString(value.completedDate),
    notes: asString(value.notes),
    nextAction: asString(value.nextAction),
  };
}

function normalizeMilestones(value: unknown): AdvisingMilestone[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeMilestone)
    .filter((milestone): milestone is AdvisingMilestone => Boolean(milestone));
}

export function normalizeServiceItem(value: unknown): ServiceItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value.title);

  if (!title) {
    return null;
  }

  const dates = withCreatedAndUpdatedAt(value);

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    title,
    bucket: asEnum(value.bucket, serviceBuckets) ?? "admin-other",
    status: asEnum(value.status, serviceStatuses) ?? "inbox",
    dueDate: asString(value.dueDate),
    nextAction: asString(value.nextAction) ?? "",
    spoonCost: asSpoonCost(value.spoonCost),
    estimatedMinutes: asNumber(value.estimatedMinutes),
    highStakes: asBoolean(value.highStakes),
    confidential: asBoolean(value.confidential),
    waitingOn: asString(value.waitingOn),
    relatedCommitteeId: asString(value.relatedCommitteeId),
    relatedStudentId: asString(value.relatedStudentId),
    link: asString(value.link),
    boundaryNote: asString(value.boundaryNote),
    neverAgain: asBoolean(value.neverAgain),
    ...dates,
  };
}

export function normalizeServiceItems(value: unknown): ServiceItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeServiceItem)
    .filter((item): item is ServiceItem => Boolean(item));
}

export function normalizeServiceCommittee(value: unknown): Committee | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = asString(value.name);

  if (!name) {
    return null;
  }

  const dates = withCreatedAndUpdatedAt(value);

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    name,
    role: asString(value.role),
    term: asString(value.term),
    status: asEnum(value.status, committeeStatuses) ?? "active",
    nextMeeting: asString(value.nextMeeting),
    nextAction: asString(value.nextAction),
    loadRating: asEnum(value.loadRating, committeeLoadRatings),
    notes: asString(value.notes),
    boundaryNote: asString(value.boundaryNote),
    ...dates,
  };
}

export function normalizeServiceCommittees(value: unknown): Committee[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeServiceCommittee)
    .filter((committee): committee is Committee => Boolean(committee));
}

export function normalizeAdvisingStudent(value: unknown): AdvisingStudent | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = asString(value.name);

  if (!name) {
    return null;
  }

  const dates = withCreatedAndUpdatedAt(value);

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    name,
    program: asString(value.program),
    role: asEnum(value.role, advisingRoles) ?? "mentor",
    status: asEnum(value.status, advisingStatuses) ?? "active",
    stage: asEnum(value.stage, milestoneNames),
    lastContactDate: asString(value.lastContactDate),
    nextMeetingDate: asString(value.nextMeetingDate),
    currentSemester: asString(value.currentSemester),
    semesterGoal: asString(value.semesterGoal),
    semesterGoalStatus: asEnum(value.semesterGoalStatus, semesterGoalStatuses),
    semesterGoalOutcome: asString(value.semesterGoalOutcome),
    advisorSupportPlan: asString(value.advisorSupportPlan),
    ultimateGoal: asEnum(value.ultimateGoal, careerGoals),
    alternateGoal: asString(value.alternateGoal),
    advisingMemory: asString(value.advisingMemory),
    milestones: normalizeMilestones(value.milestones),
    ...dates,
  };
}

export function normalizeAdvisingStudents(value: unknown): AdvisingStudent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeAdvisingStudent)
    .filter((student): student is AdvisingStudent => Boolean(student));
}

export function normalizeReviewLetter(value: unknown): ReviewLetter | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value.title);

  if (!title) {
    return null;
  }

  const dates = withCreatedAndUpdatedAt(value);

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    title,
    type: asEnum(value.type, reviewLetterTypes) ?? "other",
    status: asEnum(value.status, reviewLetterStatuses) ?? "not-started",
    dueDate: asString(value.dueDate),
    requestedBy: asString(value.requestedBy),
    organization: asString(value.organization),
    nextAction: asString(value.nextAction),
    waitingOn: asString(value.waitingOn),
    spoonCost: asSpoonCost(value.spoonCost),
    estimatedMinutes: asNumber(value.estimatedMinutes),
    notes: asString(value.notes),
    boundaryNote: asString(value.boundaryNote),
    neverAgain: asBoolean(value.neverAgain),
    ...dates,
  };
}

export function normalizeReviewLetters(value: unknown): ReviewLetter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeReviewLetter)
    .filter((letter): letter is ReviewLetter => Boolean(letter));
}

export function normalizeServiceAdminItem(value: unknown): ServiceAdminItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value.title);

  if (!title) {
    return null;
  }

  const dates = withCreatedAndUpdatedAt(value);

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    title,
    type: asEnum(value.type, adminTypes) ?? "other",
    status: asEnum(value.status, adminStatuses) ?? "not-started",
    dueDate: asString(value.dueDate),
    nextAction: asString(value.nextAction),
    waitingOn: asString(value.waitingOn),
    spoonCost: asSpoonCost(value.spoonCost),
    estimatedMinutes: asNumber(value.estimatedMinutes),
    notes: asString(value.notes),
    recurring: asBoolean(value.recurring),
    ...dates,
  };
}

export function normalizeServiceAdminItems(value: unknown): ServiceAdminItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeServiceAdminItem)
    .filter((item): item is ServiceAdminItem => Boolean(item));
}

export function normalizeServiceBoundaryLesson(
  value: unknown,
): ServiceBoundaryLesson | null {
  if (!isRecord(value)) {
    return null;
  }

  const commitment = asString(value.commitment);

  if (!commitment) {
    return null;
  }

  const dates = withCreatedAndUpdatedAt(value);

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    commitment,
    whyCostly: asString(value.whyCostly),
    warningSign: asString(value.warningSign),
    futureBoundary: asString(value.futureBoundary),
    relatedKind: asEnum(value.relatedKind, boundaryKinds),
    relatedId: asString(value.relatedId),
    status: asEnum(value.status, boundaryStatuses) ?? "active-lesson",
    ...dates,
  };
}

export function normalizeServiceBoundaryLessons(
  value: unknown,
): ServiceBoundaryLesson[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeServiceBoundaryLesson)
    .filter((lesson): lesson is ServiceBoundaryLesson => Boolean(lesson));
}

function normalizeServiceSnapshot(
  snapshot: ServiceCloudSnapshot,
): ServiceCloudSnapshot {
  return {
    serviceItems: normalizeServiceItems(snapshot.serviceItems),
    committees: normalizeServiceCommittees(snapshot.committees),
    advisingStudents: normalizeAdvisingStudents(snapshot.advisingStudents),
    reviewLetters: normalizeReviewLetters(snapshot.reviewLetters),
    adminItems: normalizeServiceAdminItems(snapshot.adminItems),
    boundaryLessons: normalizeServiceBoundaryLessons(snapshot.boundaryLessons),
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

export async function listUserServiceItems(uid: string): Promise<ServiceItem[]> {
  return normalizeServiceItems(
    await listCollectionRecords(getUserServiceItemsCollectionSegments(uid)),
  );
}

export async function readUserServiceItem(
  uid: string,
  itemId: string,
): Promise<ServiceItem | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserServiceItemDocumentSegments(uid, itemId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeServiceItem({ ...snapshot.data(), id: snapshot.id });
}

export async function listUserServiceCommittees(
  uid: string,
): Promise<Committee[]> {
  return normalizeServiceCommittees(
    await listCollectionRecords(getUserServiceCommitteesCollectionSegments(uid)),
  );
}

export async function readUserServiceCommittee(
  uid: string,
  committeeId: string,
): Promise<Committee | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserServiceCommitteeDocumentSegments(uid, committeeId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeServiceCommittee({ ...snapshot.data(), id: snapshot.id });
}

export async function listUserAdvisingStudents(
  uid: string,
): Promise<AdvisingStudent[]> {
  return normalizeAdvisingStudents(
    await listCollectionRecords(getUserAdvisingStudentsCollectionSegments(uid)),
  );
}

export async function readUserAdvisingStudent(
  uid: string,
  studentId: string,
): Promise<AdvisingStudent | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserAdvisingStudentDocumentSegments(uid, studentId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeAdvisingStudent({ ...snapshot.data(), id: snapshot.id });
}

export async function listUserServiceReviewLetters(
  uid: string,
): Promise<ReviewLetter[]> {
  return normalizeReviewLetters(
    await listCollectionRecords(getUserServiceReviewLettersCollectionSegments(uid)),
  );
}

export async function readUserServiceReviewLetter(
  uid: string,
  recordId: string,
): Promise<ReviewLetter | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserServiceReviewLetterDocumentSegments(uid, recordId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeReviewLetter({ ...snapshot.data(), id: snapshot.id });
}

export async function listUserServiceAdminItems(
  uid: string,
): Promise<ServiceAdminItem[]> {
  return normalizeServiceAdminItems(
    await listCollectionRecords(getUserServiceAdminItemsCollectionSegments(uid)),
  );
}

export async function readUserServiceAdminItem(
  uid: string,
  recordId: string,
): Promise<ServiceAdminItem | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(firestore, ...getUserServiceAdminItemDocumentSegments(uid, recordId)),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeServiceAdminItem({ ...snapshot.data(), id: snapshot.id });
}

export async function listUserServiceBoundaryLessons(
  uid: string,
): Promise<ServiceBoundaryLesson[]> {
  return normalizeServiceBoundaryLessons(
    await listCollectionRecords(getUserServiceBoundaryLessonsCollectionSegments(uid)),
  );
}

export async function readUserServiceBoundaryLesson(
  uid: string,
  lessonId: string,
): Promise<ServiceBoundaryLesson | null> {
  const firestore = requireDb();
  const snapshot = await getDoc(
    doc(
      firestore,
      ...getUserServiceBoundaryLessonDocumentSegments(uid, lessonId),
    ),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeServiceBoundaryLesson({ ...snapshot.data(), id: snapshot.id });
}

export async function listUserServiceData(
  uid: string,
): Promise<ServiceCloudSnapshot> {
  const [
    serviceItems,
    committees,
    advisingStudents,
    reviewLetters,
    adminItems,
    boundaryLessons,
  ] = await Promise.all([
    listUserServiceItems(uid),
    listUserServiceCommittees(uid),
    listUserAdvisingStudents(uid),
    listUserServiceReviewLetters(uid),
    listUserServiceAdminItems(uid),
    listUserServiceBoundaryLessons(uid),
  ]);

  return {
    serviceItems,
    committees,
    advisingStudents,
    reviewLetters,
    adminItems,
    boundaryLessons,
  };
}

export async function countUserServiceData(
  uid: string,
): Promise<ServiceCloudCounts> {
  return getServiceCounts(await listUserServiceData(uid));
}

export function getServiceCounts(snapshot: ServiceCloudSnapshot): ServiceCloudCounts {
  return {
    serviceItems: snapshot.serviceItems.length,
    committees: snapshot.committees.length,
    advisingStudents: snapshot.advisingStudents.length,
    reviewLetters: snapshot.reviewLetters.length,
    adminItems: snapshot.adminItems.length,
    boundaryLessons: snapshot.boundaryLessons.length,
  };
}

export async function batchUploadUserServiceData(
  uid: string,
  snapshot: ServiceCloudSnapshot,
) {
  const firestore = requireDb();
  const normalizedSnapshot = normalizeServiceSnapshot(snapshot);
  const batch = writeBatch(firestore);

  normalizedSnapshot.serviceItems.forEach((item) => {
    batch.set(
      doc(firestore, ...getUserServiceItemDocumentSegments(uid, item.id)),
      toFirestoreRecord(item),
      { merge: true },
    );
  });

  normalizedSnapshot.committees.forEach((committee) => {
    batch.set(
      doc(
        firestore,
        ...getUserServiceCommitteeDocumentSegments(uid, committee.id),
      ),
      toFirestoreRecord(committee),
      { merge: true },
    );
  });

  normalizedSnapshot.advisingStudents.forEach((student) => {
    batch.set(
      doc(firestore, ...getUserAdvisingStudentDocumentSegments(uid, student.id)),
      toFirestoreRecord(student),
      { merge: true },
    );
  });

  normalizedSnapshot.reviewLetters.forEach((letter) => {
    batch.set(
      doc(firestore, ...getUserServiceReviewLetterDocumentSegments(uid, letter.id)),
      toFirestoreRecord(letter),
      { merge: true },
    );
  });

  normalizedSnapshot.adminItems.forEach((item) => {
    batch.set(
      doc(firestore, ...getUserServiceAdminItemDocumentSegments(uid, item.id)),
      toFirestoreRecord(item),
      { merge: true },
    );
  });

  normalizedSnapshot.boundaryLessons.forEach((lesson) => {
    batch.set(
      doc(
        firestore,
        ...getUserServiceBoundaryLessonDocumentSegments(uid, lesson.id),
      ),
      toFirestoreRecord(lesson),
      { merge: true },
    );
  });

  await batch.commit();

  return getServiceCounts(normalizedSnapshot);
}

export async function saveUserServiceItem(uid: string, item: ServiceItem) {
  const firestore = requireDb();
  const normalizedItem = normalizeServiceItem(item);

  if (!normalizedItem) {
    throw new Error("Service item could not be normalized for cloud save.");
  }

  await setDoc(
    doc(firestore, ...getUserServiceItemDocumentSegments(uid, normalizedItem.id)),
    toFirestoreRecord(normalizedItem),
    { merge: true },
  );
}

function getServiceItemCompositeKey(item: ServiceItem) {
  return [
    item.bucket,
    normalizeTextKey(item.title),
    item.relatedCommitteeId ?? "",
    item.relatedStudentId ?? "",
    item.dueDate ?? "",
    normalizeTextKey(item.nextAction),
  ].join("|");
}

function getCommitteeCompositeKey(committee: Committee) {
  return [
    normalizeTextKey(committee.name),
    normalizeTextKey(committee.role),
    normalizeTextKey(committee.term),
  ].join("|");
}

function getStudentCompositeKey(student: AdvisingStudent) {
  return [
    normalizeTextKey(student.name),
    normalizeTextKey(student.program),
    student.role,
  ].join("|");
}

function getReviewLetterCompositeKey(letter: ReviewLetter) {
  return [
    normalizeTextKey(letter.title),
    letter.type,
    normalizeTextKey(letter.requestedBy),
    normalizeTextKey(letter.organization),
    letter.dueDate ?? "",
  ].join("|");
}

function getAdminItemCompositeKey(item: ServiceAdminItem) {
  return [
    normalizeTextKey(item.title),
    item.type,
    item.dueDate ?? "",
    normalizeTextKey(item.nextAction),
  ].join("|");
}

function getBoundaryLessonCompositeKey(lesson: ServiceBoundaryLesson) {
  return [
    normalizeTextKey(lesson.commitment),
    lesson.relatedKind ?? "",
    lesson.relatedId ?? "",
  ].join("|");
}

function chooseMergedServiceStatus(
  localStatus: ServiceStatus,
  cloudStatus: ServiceStatus,
  fallbackStatus: ServiceStatus,
): ServiceStatus {
  if (localStatus === "archived" || cloudStatus === "archived") return "archived";
  if (localStatus === "done" || cloudStatus === "done") return "done";
  if (localStatus === "declined" || cloudStatus === "declined") return "declined";

  return fallbackStatus;
}

function chooseMergedReviewStatus(
  localStatus: ReviewLetterStatus,
  cloudStatus: ReviewLetterStatus,
  fallbackStatus: ReviewLetterStatus,
): ReviewLetterStatus {
  if (localStatus === "archived" || cloudStatus === "archived") return "archived";
  if (localStatus === "submitted" || cloudStatus === "submitted") return "submitted";
  if (localStatus === "declined" || cloudStatus === "declined") return "declined";

  return fallbackStatus;
}

function chooseMergedAdminStatus(
  localStatus: ServiceAdminStatus,
  cloudStatus: ServiceAdminStatus,
  fallbackStatus: ServiceAdminStatus,
): ServiceAdminStatus {
  if (localStatus === "archived" || cloudStatus === "archived") return "archived";
  if (localStatus === "done" || cloudStatus === "done") return "done";

  return fallbackStatus;
}

function chooseMergedItem(localItem: ServiceItem, cloudItem: ServiceItem) {
  const localIsNewer = timestamp(localItem) >= timestamp(cloudItem);
  const newerItem = localIsNewer ? localItem : cloudItem;
  const olderItem = localIsNewer ? cloudItem : localItem;

  return {
    ...olderItem,
    ...newerItem,
    id: localItem.id,
    relatedCommitteeId:
      newerItem.relatedCommitteeId ?? olderItem.relatedCommitteeId,
    relatedStudentId: newerItem.relatedStudentId ?? olderItem.relatedStudentId,
    status: chooseMergedServiceStatus(
      localItem.status,
      cloudItem.status,
      newerItem.status,
    ),
  };
}

function chooseMergedCommittee(localItem: Committee, cloudItem: Committee) {
  const localIsNewer = timestamp(localItem) >= timestamp(cloudItem);
  const newerItem = localIsNewer ? localItem : cloudItem;
  const olderItem = localIsNewer ? cloudItem : localItem;

  return {
    ...olderItem,
    ...newerItem,
    id: localItem.id,
    status:
      localItem.status === "archived" || cloudItem.status === "archived"
        ? "archived"
        : newerItem.status,
  };
}

function chooseMergedStudent(
  localItem: AdvisingStudent,
  cloudItem: AdvisingStudent,
) {
  const localIsNewer = timestamp(localItem) >= timestamp(cloudItem);
  const newerItem = localIsNewer ? localItem : cloudItem;
  const olderItem = localIsNewer ? cloudItem : localItem;

  return {
    ...olderItem,
    ...newerItem,
    id: localItem.id,
    milestones:
      newerItem.milestones.length > 0
        ? newerItem.milestones
        : olderItem.milestones,
    status:
      localItem.status === "archived" || cloudItem.status === "archived"
        ? "archived"
        : newerItem.status,
  };
}

function chooseMergedReviewLetter(
  localItem: ReviewLetter,
  cloudItem: ReviewLetter,
) {
  const localIsNewer = timestamp(localItem) >= timestamp(cloudItem);
  const newerItem = localIsNewer ? localItem : cloudItem;
  const olderItem = localIsNewer ? cloudItem : localItem;

  return {
    ...olderItem,
    ...newerItem,
    id: localItem.id,
    status: chooseMergedReviewStatus(
      localItem.status,
      cloudItem.status,
      newerItem.status,
    ),
  };
}

function chooseMergedAdminItem(
  localItem: ServiceAdminItem,
  cloudItem: ServiceAdminItem,
) {
  const localIsNewer = timestamp(localItem) >= timestamp(cloudItem);
  const newerItem = localIsNewer ? localItem : cloudItem;
  const olderItem = localIsNewer ? cloudItem : localItem;

  return {
    ...olderItem,
    ...newerItem,
    id: localItem.id,
    status: chooseMergedAdminStatus(
      localItem.status,
      cloudItem.status,
      newerItem.status,
    ),
  };
}

function chooseMergedBoundaryLesson(
  localItem: ServiceBoundaryLesson,
  cloudItem: ServiceBoundaryLesson,
) {
  const localIsNewer = timestamp(localItem) >= timestamp(cloudItem);
  const newerItem = localIsNewer ? localItem : cloudItem;
  const olderItem = localIsNewer ? cloudItem : localItem;

  return {
    ...olderItem,
    ...newerItem,
    id: localItem.id,
    relatedKind: newerItem.relatedKind ?? olderItem.relatedKind,
    relatedId: newerItem.relatedId ?? olderItem.relatedId,
    status:
      localItem.status === "archived-lesson" ||
      cloudItem.status === "archived-lesson"
        ? "archived-lesson"
        : newerItem.status,
  };
}

function mergeRecords<TRecord extends { id: string; createdAt: string; updatedAt: string }>(
  localRecords: TRecord[],
  cloudRecords: TRecord[],
  getCompositeKey: (record: TRecord) => string,
  chooseMergedRecord: (localRecord: TRecord, cloudRecord: TRecord) => TRecord,
) {
  const mergedRecords = [...localRecords];
  const byId = new Map(mergedRecords.map((record) => [record.id, record]));
  const byCompositeKey = new Map(
    mergedRecords.map((record) => [getCompositeKey(record), record]),
  );
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  cloudRecords.forEach((cloudRecord) => {
    const localById = byId.get(cloudRecord.id);
    const localByCompositeKey = byCompositeKey.get(getCompositeKey(cloudRecord));
    const match = localById ?? localByCompositeKey;

    if (!match) {
      mergedRecords.push(cloudRecord);
      byId.set(cloudRecord.id, cloudRecord);
      byCompositeKey.set(getCompositeKey(cloudRecord), cloudRecord);
      addedCount += 1;
      return;
    }

    const mergedRecord = chooseMergedRecord(match, cloudRecord);
    const recordIndex = mergedRecords.findIndex(
      (record) => record.id === match.id,
    );

    if (recordIndex >= 0) {
      mergedRecords[recordIndex] = mergedRecord;
      byId.set(mergedRecord.id, mergedRecord);
      byCompositeKey.set(getCompositeKey(mergedRecord), mergedRecord);
      updatedCount += countUpdate(match, mergedRecord);
    }

    if (!localById && localByCompositeKey) {
      dedupedCount += 1;
    }
  });

  return { records: mergedRecords, addedCount, updatedCount, dedupedCount };
}

export function mergeServiceDataForSync(
  localSnapshot: ServiceCloudSnapshot,
  cloudSnapshot: ServiceCloudSnapshot,
): ServiceMergeResult {
  const local = normalizeServiceSnapshot(localSnapshot);
  const cloud = normalizeServiceSnapshot(cloudSnapshot);
  const serviceItems = mergeRecords(
    local.serviceItems,
    cloud.serviceItems,
    getServiceItemCompositeKey,
    chooseMergedItem,
  );
  const committees = mergeRecords(
    local.committees,
    cloud.committees,
    getCommitteeCompositeKey,
    chooseMergedCommittee,
  );
  const advisingStudents = mergeRecords(
    local.advisingStudents,
    cloud.advisingStudents,
    getStudentCompositeKey,
    chooseMergedStudent,
  );
  const reviewLetters = mergeRecords(
    local.reviewLetters,
    cloud.reviewLetters,
    getReviewLetterCompositeKey,
    chooseMergedReviewLetter,
  );
  const adminItems = mergeRecords(
    local.adminItems,
    cloud.adminItems,
    getAdminItemCompositeKey,
    chooseMergedAdminItem,
  );
  const boundaryLessons = mergeRecords(
    local.boundaryLessons,
    cloud.boundaryLessons,
    getBoundaryLessonCompositeKey,
    chooseMergedBoundaryLesson,
  );

  return {
    serviceItems: serviceItems.records,
    committees: committees.records,
    advisingStudents: advisingStudents.records,
    reviewLetters: reviewLetters.records,
    adminItems: adminItems.records,
    boundaryLessons: boundaryLessons.records,
    addedCount:
      serviceItems.addedCount +
      committees.addedCount +
      advisingStudents.addedCount +
      reviewLetters.addedCount +
      adminItems.addedCount +
      boundaryLessons.addedCount,
    updatedCount:
      serviceItems.updatedCount +
      committees.updatedCount +
      advisingStudents.updatedCount +
      reviewLetters.updatedCount +
      adminItems.updatedCount +
      boundaryLessons.updatedCount,
    dedupedCount:
      serviceItems.dedupedCount +
      committees.dedupedCount +
      advisingStudents.dedupedCount +
      reviewLetters.dedupedCount +
      adminItems.dedupedCount +
      boundaryLessons.dedupedCount,
  };
}

export async function pushMergedUserServiceData(
  uid: string,
  localSnapshot: ServiceCloudSnapshot,
  cloudSnapshot?: ServiceCloudSnapshot,
) {
  const mergeResult = mergeServiceDataForSync(
    localSnapshot,
    cloudSnapshot ?? (await listUserServiceData(uid)),
  );

  await batchUploadUserServiceData(uid, mergeResult);

  return mergeResult;
}
