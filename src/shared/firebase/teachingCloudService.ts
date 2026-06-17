import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import type {
  TeachingAnnouncementReminder,
  TeachingAssistant,
  TeachingCourse,
  TeachingCourseNote,
  TeachingCourseTemplate,
  TeachingGradingItem,
  TeachingMeeting,
  TeachingOfficeHourVisit,
  TeachingPrepSession,
  TeachingResource,
  TeachingSemester,
  TeachingTaItem,
} from "../../features/teaching/types";
import { db } from "./firebaseClient";
import {
  getUserTeachingAnnouncementReminderDocumentSegments,
  getUserTeachingAnnouncementRemindersCollectionSegments,
  getUserTeachingAssistantDocumentSegments,
  getUserTeachingAssistantsCollectionSegments,
  getUserTeachingCourseDocumentSegments,
  getUserTeachingCourseNoteDocumentSegments,
  getUserTeachingCourseNotesCollectionSegments,
  getUserTeachingCourseTemplateDocumentSegments,
  getUserTeachingCourseTemplatesCollectionSegments,
  getUserTeachingCoursesCollectionSegments,
  getUserTeachingGradingItemDocumentSegments,
  getUserTeachingGradingItemsCollectionSegments,
  getUserTeachingMeetingDocumentSegments,
  getUserTeachingMeetingsCollectionSegments,
  getUserTeachingOfficeHourVisitDocumentSegments,
  getUserTeachingOfficeHourVisitsCollectionSegments,
  getUserTeachingPrepSessionDocumentSegments,
  getUserTeachingPrepSessionsCollectionSegments,
  getUserTeachingResourceDocumentSegments,
  getUserTeachingResourcesCollectionSegments,
  getUserTeachingSemesterDocumentSegments,
  getUserTeachingSemestersCollectionSegments,
  getUserTeachingTaItemDocumentSegments,
  getUserTeachingTaItemsCollectionSegments,
} from "./firestorePaths";

export type TeachingCloudSnapshot = {
  semesters: TeachingSemester[];
  courses: TeachingCourse[];
  meetings: TeachingMeeting[];
  prepSessions: TeachingPrepSession[];
  gradingItems: TeachingGradingItem[];
  taItems: TeachingTaItem[];
  teachingAssistants: TeachingAssistant[];
  officeHourVisits: TeachingOfficeHourVisit[];
  courseNotes: TeachingCourseNote[];
  resources: TeachingResource[];
  announcementReminders: TeachingAnnouncementReminder[];
  courseTemplates: TeachingCourseTemplate[];
};

export type TeachingCloudCounts = {
  semesters: number;
  courses: number;
  meetings: number;
  prepSessions: number;
  gradingItems: number;
  taItems: number;
  teachingAssistants: number;
  officeHourVisits: number;
  courseNotes: number;
  resources: number;
  announcementReminders: number;
  courseTemplates: number;
};

export type TeachingMergeResult = TeachingCloudSnapshot & {
  addedCount: number;
  updatedCount: number;
  dedupedCount: number;
};

export const TEACHING_NOTE_DRAFT_SYNC_NOTE =
  "Teaching course note draft autosaves stay local-only because draft keys are prefix-based editor state and can collide across browsers, especially the shared 'new' draft key.";

type SyncRecord = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

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
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeTextKey(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function timestamp(value: { createdAt?: string; updatedAt?: string }) {
  const time = new Date(value.updatedAt || value.createdAt || "").getTime();

  return Number.isFinite(time) ? time : 0;
}

function countUpdate<T extends SyncRecord>(before: T, after: T) {
  return timestamp(after) !== timestamp(before) ? 1 : 0;
}

function datesFrom(value: Record<string, unknown>) {
  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;

  return {
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
  };
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

function normalizeRecord<T extends SyncRecord>(
  value: unknown,
  isValid: (record: Record<string, unknown>) => boolean,
  defaults: Record<string, unknown> = {},
): T | null {
  if (!isRecord(value) || !isValid(value)) {
    return null;
  }

  return {
    ...defaults,
    ...value,
    id: asString(value.id) ?? crypto.randomUUID(),
    ...datesFrom(value),
  } as T;
}

function normalizeRecords<T extends SyncRecord>(
  value: unknown,
  normalizer: (record: unknown) => T | null,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizer).filter((record): record is T => Boolean(record));
}

export function normalizeTeachingSemester(value: unknown) {
  return normalizeRecord<TeachingSemester>(
    value,
    (record) => Boolean(asString(record.name) && asString(record.year)),
    { status: "active", term: "Other" },
  );
}

export function normalizeTeachingCourse(value: unknown) {
  return normalizeRecord<TeachingCourse>(
    value,
    (record) =>
      Boolean(
        asString(record.semesterId) &&
          asString(record.code) &&
          asString(record.title),
      ),
    { status: "active" },
  );
}

export function normalizeTeachingMeeting(value: unknown) {
  return normalizeRecord<TeachingMeeting>(
    value,
    (record) => Boolean(asString(record.courseId)),
    {
      week: "",
      date: "",
      topic: "",
      readings: "",
      due: "",
      notes: "",
      changeNextTime: "",
      canceled: false,
      order: 0,
    },
  );
}

export function normalizeTeachingPrepSession(value: unknown) {
  return normalizeRecord<TeachingPrepSession>(
    value,
    (record) => Boolean(asString(record.courseId)),
    {
      week: "",
      topic: "",
      slides: "",
      plan: "",
      nextAction: "",
      completed: false,
    },
  );
}

export function normalizeTeachingGradingItem(value: unknown) {
  return normalizeRecord<TeachingGradingItem>(
    value,
    (record) => Boolean(asString(record.courseId) && asString(record.assignment)),
    {
      dueDate: "",
      scoresText: "",
      missing: "",
      status: "pending",
      notes: "",
      nextAction: "",
    },
  );
}

export function normalizeTeachingTaItem(value: unknown) {
  return normalizeRecord<TeachingTaItem>(
    value,
    (record) => Boolean(asString(record.courseId) && asString(record.task)),
    {
      taName: "",
      dueDate: "",
      notes: "",
      weeklyComment: "",
      nextAction: "",
      completed: false,
    },
  );
}

export function normalizeTeachingAssistant(value: unknown) {
  return normalizeRecord<TeachingAssistant>(
    value,
    (record) => Boolean(asString(record.courseId) && asString(record.name)),
    {
      email: "",
      officeHours: "",
      notes: "",
      active: true,
    },
  );
}

export function normalizeTeachingOfficeHourVisit(value: unknown) {
  return normalizeRecord<TeachingOfficeHourVisit>(
    value,
    (record) => Boolean(asString(record.courseId) && asString(record.student)),
    {
      concern: "",
      followUp: "",
      visitDate: "",
      nextAction: "",
      followUpCompleted: false,
    },
  );
}

export function normalizeTeachingCourseNote(value: unknown) {
  const note = normalizeRecord<TeachingCourseNote>(
    value,
    (record) => Boolean(asString(record.courseId) && asString(record.title)),
    {
      body: "",
      tags: [],
      noteType: "other",
    },
  );

  return note ? { ...note, tags: asStringArray(note.tags) } : null;
}

export function normalizeTeachingResource(value: unknown) {
  return normalizeRecord<TeachingResource>(
    value,
    (record) => Boolean(asString(record.courseId) && asString(record.title)),
    {
      description: "",
      url: "",
      fileName: "",
      resourceType: "other",
    },
  );
}

export function normalizeTeachingAnnouncementReminder(value: unknown) {
  return normalizeRecord<TeachingAnnouncementReminder>(
    value,
    (record) => Boolean(asString(record.courseId) && asString(record.title)),
    {
      itemName: "",
      itemType: "other",
      dueDate: "",
      announcementDate: "",
      audience: "students",
      channel: "other",
      status: "planned",
      announcementSubject: "",
      announcementBody: "",
      taEmailSubject: "",
      taEmailBody: "",
      notes: "",
    },
  );
}

export function normalizeTeachingCourseTemplate(value: unknown) {
  const template = normalizeRecord<TeachingCourseTemplate>(
    value,
    (record) => Boolean(asString(record.name)),
    {
      prepChecklist: [],
      gradingCategories: [],
      resourceCategories: [],
    },
  );

  return template
    ? {
        ...template,
        prepChecklist: asStringArray(template.prepChecklist),
        gradingCategories: asStringArray(template.gradingCategories),
        resourceCategories: asStringArray(template.resourceCategories),
      }
    : null;
}

export function normalizeTeachingSemesters(value: unknown) {
  return normalizeRecords(value, normalizeTeachingSemester);
}

export function normalizeTeachingCourses(value: unknown) {
  return normalizeRecords(value, normalizeTeachingCourse);
}

export function normalizeTeachingMeetings(value: unknown) {
  return normalizeRecords(value, normalizeTeachingMeeting);
}

export function normalizeTeachingPrepSessions(value: unknown) {
  return normalizeRecords(value, normalizeTeachingPrepSession);
}

export function normalizeTeachingGradingItems(value: unknown) {
  return normalizeRecords(value, normalizeTeachingGradingItem);
}

export function normalizeTeachingTaItems(value: unknown) {
  return normalizeRecords(value, normalizeTeachingTaItem);
}

export function normalizeTeachingAssistants(value: unknown) {
  return normalizeRecords(value, normalizeTeachingAssistant);
}

export function normalizeTeachingOfficeHourVisits(value: unknown) {
  return normalizeRecords(value, normalizeTeachingOfficeHourVisit);
}

export function normalizeTeachingCourseNotes(value: unknown) {
  return normalizeRecords(value, normalizeTeachingCourseNote);
}

export function normalizeTeachingResources(value: unknown) {
  return normalizeRecords(value, normalizeTeachingResource);
}

export function normalizeTeachingAnnouncementReminders(value: unknown) {
  return normalizeRecords(value, normalizeTeachingAnnouncementReminder);
}

export function normalizeTeachingCourseTemplates(value: unknown) {
  return normalizeRecords(value, normalizeTeachingCourseTemplate);
}

function normalizeTeachingSnapshot(snapshot: {
  semesters: unknown;
  courses: unknown;
  meetings: unknown;
  prepSessions: unknown;
  gradingItems: unknown;
  taItems: unknown;
  teachingAssistants: unknown;
  officeHourVisits: unknown;
  courseNotes: unknown;
  resources: unknown;
  announcementReminders: unknown;
  courseTemplates: unknown;
}): TeachingCloudSnapshot {
  return {
    semesters: normalizeTeachingSemesters(snapshot.semesters),
    courses: normalizeTeachingCourses(snapshot.courses),
    meetings: normalizeTeachingMeetings(snapshot.meetings),
    prepSessions: normalizeTeachingPrepSessions(snapshot.prepSessions),
    gradingItems: normalizeTeachingGradingItems(snapshot.gradingItems),
    taItems: normalizeTeachingTaItems(snapshot.taItems),
    teachingAssistants: normalizeTeachingAssistants(snapshot.teachingAssistants),
    officeHourVisits: normalizeTeachingOfficeHourVisits(snapshot.officeHourVisits),
    courseNotes: normalizeTeachingCourseNotes(snapshot.courseNotes),
    resources: normalizeTeachingResources(snapshot.resources),
    announcementReminders: normalizeTeachingAnnouncementReminders(
      snapshot.announcementReminders,
    ),
    courseTemplates: normalizeTeachingCourseTemplates(snapshot.courseTemplates),
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

export async function listUserTeachingData(
  uid: string,
): Promise<TeachingCloudSnapshot> {
  const [
    semesters,
    courses,
    meetings,
    prepSessions,
    gradingItems,
    taItems,
    teachingAssistants,
    officeHourVisits,
    courseNotes,
    resources,
    announcementReminders,
    courseTemplates,
  ] = await Promise.all([
    listCollectionRecords(getUserTeachingSemestersCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingCoursesCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingMeetingsCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingPrepSessionsCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingGradingItemsCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingTaItemsCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingAssistantsCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingOfficeHourVisitsCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingCourseNotesCollectionSegments(uid)),
    listCollectionRecords(getUserTeachingResourcesCollectionSegments(uid)),
    listCollectionRecords(
      getUserTeachingAnnouncementRemindersCollectionSegments(uid),
    ),
    listCollectionRecords(getUserTeachingCourseTemplatesCollectionSegments(uid)),
  ]);

  return normalizeTeachingSnapshot({
    semesters,
    courses,
    meetings,
    prepSessions,
    gradingItems,
    taItems,
    teachingAssistants,
    officeHourVisits,
    courseNotes,
    resources,
    announcementReminders,
    courseTemplates,
  });
}

export function getTeachingCounts(
  snapshot: TeachingCloudSnapshot,
): TeachingCloudCounts {
  return {
    semesters: snapshot.semesters.length,
    courses: snapshot.courses.length,
    meetings: snapshot.meetings.length,
    prepSessions: snapshot.prepSessions.length,
    gradingItems: snapshot.gradingItems.length,
    taItems: snapshot.taItems.length,
    teachingAssistants: snapshot.teachingAssistants.length,
    officeHourVisits: snapshot.officeHourVisits.length,
    courseNotes: snapshot.courseNotes.length,
    resources: snapshot.resources.length,
    announcementReminders: snapshot.announcementReminders.length,
    courseTemplates: snapshot.courseTemplates.length,
  };
}

export async function countUserTeachingData(
  uid: string,
): Promise<TeachingCloudCounts> {
  return getTeachingCounts(await listUserTeachingData(uid));
}

export async function batchUploadUserTeachingData(
  uid: string,
  snapshot: TeachingCloudSnapshot,
) {
  const firestore = requireDb();
  const normalizedSnapshot = normalizeTeachingSnapshot(snapshot);
  const batch = writeBatch(firestore);

  normalizedSnapshot.semesters.forEach((semester) => {
    batch.set(
      doc(firestore, ...getUserTeachingSemesterDocumentSegments(uid, semester.id)),
      toFirestoreRecord(semester),
      { merge: true },
    );
  });

  normalizedSnapshot.courses.forEach((course) => {
    batch.set(
      doc(firestore, ...getUserTeachingCourseDocumentSegments(uid, course.id)),
      toFirestoreRecord(course),
      { merge: true },
    );
  });

  normalizedSnapshot.meetings.forEach((meeting) => {
    batch.set(
      doc(firestore, ...getUserTeachingMeetingDocumentSegments(uid, meeting.id)),
      toFirestoreRecord(meeting),
      { merge: true },
    );
  });

  normalizedSnapshot.prepSessions.forEach((session) => {
    batch.set(
      doc(firestore, ...getUserTeachingPrepSessionDocumentSegments(uid, session.id)),
      toFirestoreRecord(session),
      { merge: true },
    );
  });

  normalizedSnapshot.gradingItems.forEach((item) => {
    batch.set(
      doc(firestore, ...getUserTeachingGradingItemDocumentSegments(uid, item.id)),
      toFirestoreRecord(item),
      { merge: true },
    );
  });

  normalizedSnapshot.taItems.forEach((item) => {
    batch.set(
      doc(firestore, ...getUserTeachingTaItemDocumentSegments(uid, item.id)),
      toFirestoreRecord(item),
      { merge: true },
    );
  });

  normalizedSnapshot.teachingAssistants.forEach((assistant) => {
    batch.set(
      doc(
        firestore,
        ...getUserTeachingAssistantDocumentSegments(uid, assistant.id),
      ),
      toFirestoreRecord(assistant),
      { merge: true },
    );
  });

  normalizedSnapshot.officeHourVisits.forEach((visit) => {
    batch.set(
      doc(
        firestore,
        ...getUserTeachingOfficeHourVisitDocumentSegments(uid, visit.id),
      ),
      toFirestoreRecord(visit),
      { merge: true },
    );
  });

  normalizedSnapshot.courseNotes.forEach((note) => {
    batch.set(
      doc(firestore, ...getUserTeachingCourseNoteDocumentSegments(uid, note.id)),
      toFirestoreRecord(note),
      { merge: true },
    );
  });

  normalizedSnapshot.resources.forEach((resource) => {
    batch.set(
      doc(
        firestore,
        ...getUserTeachingResourceDocumentSegments(uid, resource.id),
      ),
      toFirestoreRecord(resource),
      { merge: true },
    );
  });

  normalizedSnapshot.announcementReminders.forEach((reminder) => {
    batch.set(
      doc(
        firestore,
        ...getUserTeachingAnnouncementReminderDocumentSegments(uid, reminder.id),
      ),
      toFirestoreRecord(reminder),
      { merge: true },
    );
  });

  normalizedSnapshot.courseTemplates.forEach((template) => {
    batch.set(
      doc(
        firestore,
        ...getUserTeachingCourseTemplateDocumentSegments(uid, template.id),
      ),
      toFirestoreRecord(template),
      { merge: true },
    );
  });

  await batch.commit();

  return getTeachingCounts(normalizedSnapshot);
}

function chooseMergedRecord<T extends SyncRecord>(localItem: T, cloudItem: T): T {
  const localIsNewer = timestamp(localItem) >= timestamp(cloudItem);
  const newerItem = localIsNewer ? localItem : cloudItem;
  const olderItem = localIsNewer ? cloudItem : localItem;
  const merged: Record<string, unknown> = {
    ...olderItem,
    ...newerItem,
    id: localItem.id,
  };
  const localStatus = (localItem as Record<string, unknown>).status;
  const cloudStatus = (cloudItem as Record<string, unknown>).status;
  const terminalStatus =
    localStatus === "archived" || cloudStatus === "archived"
      ? "archived"
      : localStatus === "returned" || cloudStatus === "returned"
        ? "returned"
        : localStatus === "completed" || cloudStatus === "completed"
          ? "completed"
          : localStatus === "posted" || cloudStatus === "posted"
            ? "posted"
            : localStatus === "resolved" || cloudStatus === "resolved"
              ? "resolved"
              : undefined;

  if (terminalStatus) {
    merged.status = terminalStatus;
  }

  if ("completed" in localItem || "completed" in cloudItem) {
    merged.completed = Boolean(
      (localItem as { completed?: boolean }).completed ||
        (cloudItem as { completed?: boolean }).completed,
    );
  }

  if ("followUpCompleted" in localItem || "followUpCompleted" in cloudItem) {
    merged.followUpCompleted = Boolean(
      (localItem as { followUpCompleted?: boolean }).followUpCompleted ||
        (cloudItem as { followUpCompleted?: boolean }).followUpCompleted,
    );
  }

  if ("active" in localItem || "active" in cloudItem) {
    merged.active =
      (newerItem as { active?: boolean }).active ??
      (olderItem as { active?: boolean }).active ??
      true;
  }

  return merged as T;
}

function mergeCollection<T extends SyncRecord>(
  localInput: T[],
  cloudInput: T[],
  getCompositeKey: (item: T) => string,
) {
  const mergedById = new Map<string, T>();
  const idByCompositeKey = new Map<string, string>();
  let addedCount = 0;
  let updatedCount = 0;
  let dedupedCount = 0;

  localInput.forEach((item) => {
    mergedById.set(item.id, item);
    const compositeKey = getCompositeKey(item);

    if (compositeKey) {
      idByCompositeKey.set(compositeKey, item.id);
    }
  });

  cloudInput.forEach((cloudItem) => {
    const compositeKey = getCompositeKey(cloudItem);
    const matchingId = mergedById.has(cloudItem.id)
      ? cloudItem.id
      : compositeKey
        ? idByCompositeKey.get(compositeKey)
        : undefined;
    const localMatch = matchingId ? mergedById.get(matchingId) : undefined;

    if (!localMatch) {
      mergedById.set(cloudItem.id, cloudItem);

      if (compositeKey) {
        idByCompositeKey.set(compositeKey, cloudItem.id);
      }

      addedCount += 1;
      return;
    }

    const mergedItem = chooseMergedRecord(localMatch, cloudItem);
    mergedById.set(localMatch.id, mergedItem);
    updatedCount += countUpdate(localMatch, mergedItem);
    dedupedCount += localMatch.id !== cloudItem.id ? 1 : 0;
  });

  return {
    items: Array.from(mergedById.values()).sort(
      (a, b) => timestamp(b) - timestamp(a),
    ),
    addedCount,
    updatedCount,
    dedupedCount,
  };
}

function mergeSnapshotCollection<T extends SyncRecord>(
  localInput: T[],
  cloudInput: T[],
  getCompositeKey: (item: T) => string,
  totals: { addedCount: number; updatedCount: number; dedupedCount: number },
) {
  const result = mergeCollection(localInput, cloudInput, getCompositeKey);

  totals.addedCount += result.addedCount;
  totals.updatedCount += result.updatedCount;
  totals.dedupedCount += result.dedupedCount;

  return result.items;
}

export function mergeTeachingDataForSync(
  localSnapshotInput: TeachingCloudSnapshot,
  cloudSnapshotInput: TeachingCloudSnapshot,
): TeachingMergeResult {
  const localSnapshot = normalizeTeachingSnapshot(localSnapshotInput);
  const cloudSnapshot = normalizeTeachingSnapshot(cloudSnapshotInput);
  const totals = { addedCount: 0, updatedCount: 0, dedupedCount: 0 };

  return {
    semesters: mergeSnapshotCollection(
      localSnapshot.semesters,
      cloudSnapshot.semesters,
      (semester) =>
        [
          normalizeTextKey(semester.name),
          semester.term,
          normalizeTextKey(semester.year),
        ].join("|"),
      totals,
    ),
    courses: mergeSnapshotCollection(
      localSnapshot.courses,
      cloudSnapshot.courses,
      (course) =>
        [
          course.semesterId,
          normalizeTextKey(course.code),
          normalizeTextKey(course.title),
          normalizeTextKey(course.section),
        ].join("|"),
      totals,
    ),
    meetings: mergeSnapshotCollection(
      localSnapshot.meetings,
      cloudSnapshot.meetings,
      (meeting) =>
        [
          meeting.courseId,
          meeting.date,
          normalizeTextKey(meeting.topic),
          normalizeTextKey(meeting.week),
        ].join("|"),
      totals,
    ),
    prepSessions: mergeSnapshotCollection(
      localSnapshot.prepSessions,
      cloudSnapshot.prepSessions,
      (session) =>
        [
          session.courseId,
          session.meetingId ?? "",
          normalizeTextKey(session.topic),
          normalizeTextKey(session.week),
        ].join("|"),
      totals,
    ),
    gradingItems: mergeSnapshotCollection(
      localSnapshot.gradingItems,
      cloudSnapshot.gradingItems,
      (item) =>
        [
          item.courseId,
          normalizeTextKey(item.assignment),
          item.dueDate,
        ].join("|"),
      totals,
    ),
    taItems: mergeSnapshotCollection(
      localSnapshot.taItems,
      cloudSnapshot.taItems,
      (item) =>
        [
          item.courseId,
          item.taId ?? normalizeTextKey(item.taName),
          normalizeTextKey(item.task),
          normalizeTextKey(item.assignmentName),
          item.dueDate,
        ].join("|"),
      totals,
    ),
    teachingAssistants: mergeSnapshotCollection(
      localSnapshot.teachingAssistants,
      cloudSnapshot.teachingAssistants,
      (assistant) =>
        [
          assistant.courseId,
          normalizeTextKey(assistant.name),
          normalizeTextKey(assistant.email),
        ].join("|"),
      totals,
    ),
    officeHourVisits: mergeSnapshotCollection(
      localSnapshot.officeHourVisits,
      cloudSnapshot.officeHourVisits,
      (visit) =>
        [
          visit.courseId,
          normalizeTextKey(visit.student),
          visit.visitDate,
          normalizeTextKey(visit.concern),
        ].join("|"),
      totals,
    ),
    courseNotes: mergeSnapshotCollection(
      localSnapshot.courseNotes,
      cloudSnapshot.courseNotes,
      (note) =>
        [
          note.courseId,
          normalizeTextKey(note.title),
          note.noteType,
        ].join("|"),
      totals,
    ),
    resources: mergeSnapshotCollection(
      localSnapshot.resources,
      cloudSnapshot.resources,
      (resource) =>
        [
          resource.courseId,
          normalizeTextKey(resource.title),
          normalizeTextKey(resource.url),
          normalizeTextKey(resource.fileName),
        ].join("|"),
      totals,
    ),
    announcementReminders: mergeSnapshotCollection(
      localSnapshot.announcementReminders,
      cloudSnapshot.announcementReminders,
      (reminder) =>
        [
          reminder.courseId,
          normalizeTextKey(reminder.title),
          normalizeTextKey(reminder.itemName),
          reminder.dueDate,
          reminder.announcementDate,
        ].join("|"),
      totals,
    ),
    courseTemplates: mergeSnapshotCollection(
      localSnapshot.courseTemplates,
      cloudSnapshot.courseTemplates,
      (template) =>
        [
          normalizeTextKey(template.name),
          normalizeTextKey(template.codePattern),
          normalizeTextKey(template.titlePattern),
        ].join("|"),
      totals,
    ),
    ...totals,
  };
}

export async function pushMergedUserTeachingData(
  uid: string,
  localSnapshot: TeachingCloudSnapshot,
  cloudSnapshot: TeachingCloudSnapshot,
) {
  const mergeResult = mergeTeachingDataForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserTeachingData(uid, mergeResult);

  return mergeResult;
}
