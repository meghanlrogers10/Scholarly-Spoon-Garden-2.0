import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import type {
  ResearchDraft,
  ResearchLiteratureNote,
  ResearchLiteratureReadingNote,
  ResearchLiteratureSource,
  ResearchLogEntry,
  ResearchMindMapNode,
  ResearchPrismaCriteria,
  ResearchPrismaRecord,
  ResearchProject,
  ResearchSubmission,
  ResearchSynthesisSection,
  ResearchTask,
} from "../../features/research/types";
import { db } from "./firebaseClient";
import {
  getUserResearchDraftDocumentSegments,
  getUserResearchDraftsCollectionSegments,
  getUserResearchLiteratureNoteDocumentSegments,
  getUserResearchLiteratureNotesCollectionSegments,
  getUserResearchLiteratureSourceDocumentSegments,
  getUserResearchLiteratureSourcesCollectionSegments,
  getUserResearchLogEntriesCollectionSegments,
  getUserResearchLogEntryDocumentSegments,
  getUserResearchMindMapNodeDocumentSegments,
  getUserResearchMindMapNodesCollectionSegments,
  getUserResearchPrismaCriteriaCollectionSegments,
  getUserResearchPrismaCriteriaDocumentSegments,
  getUserResearchPrismaRecordDocumentSegments,
  getUserResearchPrismaRecordsCollectionSegments,
  getUserResearchProjectDocumentSegments,
  getUserResearchProjectsCollectionSegments,
  getUserResearchReadingNoteDocumentSegments,
  getUserResearchReadingNotesCollectionSegments,
  getUserResearchSubmissionDocumentSegments,
  getUserResearchSubmissionsCollectionSegments,
  getUserResearchSynthesisSectionDocumentSegments,
  getUserResearchSynthesisSectionsCollectionSegments,
  getUserResearchTaskDocumentSegments,
  getUserResearchTasksCollectionSegments,
} from "./firestorePaths";

export const RESEARCH_LARGE_RECORD_WARNING_BYTES = 850_000;

export type ResearchCloudSnapshot = {
  projects: ResearchProject[];
  tasks: ResearchTask[];
  logEntries: ResearchLogEntry[];
  drafts: ResearchDraft[];
  submissions: ResearchSubmission[];
  literatureSources: ResearchLiteratureSource[];
  literatureNotes: ResearchLiteratureNote[];
  readingNotes: ResearchLiteratureReadingNote[];
  mindMapNodes: ResearchMindMapNode[];
  synthesisSections: ResearchSynthesisSection[];
  prismaRecords: ResearchPrismaRecord[];
  prismaCriteria: ResearchPrismaCriteria[];
};

export type ResearchCloudCounts = Record<keyof ResearchCloudSnapshot, number>;

export type ResearchSkippedRecord = {
  collection: keyof ResearchCloudSnapshot;
  id: string;
  sizeBytes: number;
};

export type ResearchUploadResult = {
  counts: ResearchCloudCounts;
  skippedLargeRecords: ResearchSkippedRecord[];
};

export type ResearchMergeResult = ResearchCloudSnapshot & {
  addedCount: number;
  updatedCount: number;
  dedupedCount: number;
};

type SyncRecord = {
  id: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CriteriaSyncRecord = ResearchPrismaCriteria & {
  id: string;
  createdAt?: string;
};

type SnapshotCollectionKey = keyof ResearchCloudSnapshot;

const emptyCounts: ResearchCloudCounts = {
  projects: 0,
  tasks: 0,
  logEntries: 0,
  drafts: 0,
  submissions: 0,
  literatureSources: 0,
  literatureNotes: 0,
  readingNotes: 0,
  mindMapNodes: 0,
  synthesisSections: 0,
  prismaRecords: 0,
  prismaCriteria: 0,
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

function createFallbackId(prefix: string) {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${suffix}`;
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

function getRecordSizeBytes(record: unknown) {
  return new Blob([JSON.stringify(stripUndefinedValues(record))]).size;
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
  fallbackIdPrefix: string,
  defaults: Record<string, unknown> = {},
): T | null {
  if (!isRecord(value) || !isValid(value)) {
    return null;
  }

  return {
    ...defaults,
    ...value,
    id: asString(value.id) ?? createFallbackId(fallbackIdPrefix),
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

export function normalizeResearchProject(value: unknown) {
  return normalizeRecord<ResearchProject>(
    value,
    (record) => Boolean(asString(record.title)),
    "research-project",
    {
      shortName: "Research",
      description: "",
      focusLevel: "secondary",
      status: "active",
      currentStage: "lit-framing",
      nextAction: "Define the next action.",
      color: "purple",
      taskCount: 0,
      completedTaskCount: 0,
      literatureCount: 0,
      notesCount: 0,
    },
  );
}

export function normalizeResearchTask(value: unknown) {
  return normalizeRecord<ResearchTask>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.title)),
    "research-task",
    {
      stageKey: "lit-framing",
      status: "todo",
      priority: "medium",
      spoonCost: 2,
    },
  );
}

export function normalizeResearchLogEntry(value: unknown) {
  const entry = normalizeRecord<ResearchLogEntry>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.title)),
    "research-log",
    {
      entryType: "progress",
      body: "No details added yet.",
      pinned: false,
      tags: [],
    },
  );

  return entry ? { ...entry, tags: asStringArray(entry.tags) } : null;
}

export function normalizeResearchDraft(value: unknown) {
  return normalizeRecord<ResearchDraft>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.title)),
    "research-draft",
    { section: "Draft", status: "drafting", pinned: false },
  );
}

export function normalizeResearchSubmission(value: unknown) {
  return normalizeRecord<ResearchSubmission>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.journalName)),
    "research-submission",
    { status: "targeting", pinned: false },
  );
}

export function normalizeResearchLiteratureSource(value: unknown) {
  const source = normalizeRecord<ResearchLiteratureSource>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.title)),
    "research-source",
    { sourceType: "article", status: "unread", themes: [], pinned: false },
  );

  return source ? { ...source, themes: asStringArray(source.themes) } : null;
}

export function normalizeResearchLiteratureNote(value: unknown) {
  const note = normalizeRecord<ResearchLiteratureNote>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.title)),
    "research-note",
    { noteKind: "summary", body: "No details added yet.", themes: [], pinned: false },
  );

  return note ? { ...note, themes: asStringArray(note.themes) } : null;
}

export function normalizeResearchReadingNote(value: unknown) {
  const note = normalizeRecord<ResearchLiteratureReadingNote>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.sourceId)),
    "research-reading-note",
    {
      sourceTitle: "Untitled source",
      sections: {},
      extractedThemes: [],
      manualThemes: [],
      pinned: false,
    },
  );

  return note
    ? {
        ...note,
        extractedThemes: asStringArray(note.extractedThemes),
        manualThemes: asStringArray(note.manualThemes),
      }
    : null;
}

export function normalizeResearchMindMapNode(value: unknown) {
  const node = normalizeRecord<ResearchMindMapNode>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.title)),
    "research-mindmap-node",
    { nodeType: "theme", pinned: false, relatedThemes: [] },
  );

  return node
    ? { ...node, relatedThemes: asStringArray(node.relatedThemes) }
    : null;
}

export function normalizeResearchSynthesisSection(value: unknown) {
  const section = normalizeRecord<ResearchSynthesisSection>(
    value,
    (record) => Boolean(asString(record.projectId) && asString(record.title)),
    "research-synthesis-section",
    {
      claim: "",
      themes: [],
      linkedSourceIds: [],
      linkedNoteIds: [],
      status: "idea",
      pinned: false,
    },
  );

  return section
    ? {
        ...section,
        themes: asStringArray(section.themes),
        linkedSourceIds: asStringArray(section.linkedSourceIds),
        linkedNoteIds: asStringArray(section.linkedNoteIds),
      }
    : null;
}

export function normalizeResearchPrismaRecord(value: unknown) {
  return normalizeRecord<ResearchPrismaRecord>(
    value,
    (record) => Boolean(asString(record.projectId)),
    "research-prisma-record",
    { status: "identified" },
  );
}

export function normalizeResearchPrismaCriteria(value: unknown) {
  if (!isRecord(value) || !asString(value.projectId)) {
    return null;
  }

  return {
    projectId: asString(value.projectId)!,
    inclusionCriteria: asStringArray(value.inclusionCriteria),
    exclusionCriteria: asStringArray(value.exclusionCriteria),
    updatedAt: asString(value.updatedAt) ?? new Date().toISOString(),
  };
}

export function normalizeResearchProjects(value: unknown) {
  return normalizeRecords(value, normalizeResearchProject);
}

export function normalizeResearchTasks(value: unknown) {
  return normalizeRecords(value, normalizeResearchTask);
}

export function normalizeResearchLogEntries(value: unknown) {
  return normalizeRecords(value, normalizeResearchLogEntry);
}

export function normalizeResearchDrafts(value: unknown) {
  return normalizeRecords(value, normalizeResearchDraft);
}

export function normalizeResearchSubmissions(value: unknown) {
  return normalizeRecords(value, normalizeResearchSubmission);
}

export function normalizeResearchLiteratureSources(value: unknown) {
  return normalizeRecords(value, normalizeResearchLiteratureSource);
}

export function normalizeResearchLiteratureNotes(value: unknown) {
  return normalizeRecords(value, normalizeResearchLiteratureNote);
}

export function normalizeResearchReadingNotes(value: unknown) {
  return normalizeRecords(value, normalizeResearchReadingNote);
}

export function normalizeResearchMindMapNodes(value: unknown) {
  return normalizeRecords(value, normalizeResearchMindMapNode);
}

export function normalizeResearchSynthesisSections(value: unknown) {
  return normalizeRecords(value, normalizeResearchSynthesisSection);
}

export function normalizeResearchPrismaRecords(value: unknown) {
  return normalizeRecords(value, normalizeResearchPrismaRecord);
}

export function normalizeResearchPrismaCriteriaList(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(normalizeResearchPrismaCriteria)
        .filter((record): record is ResearchPrismaCriteria => Boolean(record))
    : [];
}

function normalizeResearchSnapshot(snapshot: {
  projects: unknown;
  tasks: unknown;
  logEntries: unknown;
  drafts: unknown;
  submissions: unknown;
  literatureSources: unknown;
  literatureNotes: unknown;
  readingNotes: unknown;
  mindMapNodes: unknown;
  synthesisSections: unknown;
  prismaRecords: unknown;
  prismaCriteria: unknown;
}): ResearchCloudSnapshot {
  return {
    projects: normalizeResearchProjects(snapshot.projects),
    tasks: normalizeResearchTasks(snapshot.tasks),
    logEntries: normalizeResearchLogEntries(snapshot.logEntries),
    drafts: normalizeResearchDrafts(snapshot.drafts),
    submissions: normalizeResearchSubmissions(snapshot.submissions),
    literatureSources: normalizeResearchLiteratureSources(
      snapshot.literatureSources,
    ),
    literatureNotes: normalizeResearchLiteratureNotes(snapshot.literatureNotes),
    readingNotes: normalizeResearchReadingNotes(snapshot.readingNotes),
    mindMapNodes: normalizeResearchMindMapNodes(snapshot.mindMapNodes),
    synthesisSections: normalizeResearchSynthesisSections(
      snapshot.synthesisSections,
    ),
    prismaRecords: normalizeResearchPrismaRecords(snapshot.prismaRecords),
    prismaCriteria: normalizeResearchPrismaCriteriaList(snapshot.prismaCriteria),
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

export async function listUserResearchData(
  uid: string,
): Promise<ResearchCloudSnapshot> {
  const [
    projects,
    tasks,
    logEntries,
    drafts,
    submissions,
    literatureSources,
    literatureNotes,
    readingNotes,
    mindMapNodes,
    synthesisSections,
    prismaRecords,
    prismaCriteria,
  ] = await Promise.all([
    listCollectionRecords(getUserResearchProjectsCollectionSegments(uid)),
    listCollectionRecords(getUserResearchTasksCollectionSegments(uid)),
    listCollectionRecords(getUserResearchLogEntriesCollectionSegments(uid)),
    listCollectionRecords(getUserResearchDraftsCollectionSegments(uid)),
    listCollectionRecords(getUserResearchSubmissionsCollectionSegments(uid)),
    listCollectionRecords(getUserResearchLiteratureSourcesCollectionSegments(uid)),
    listCollectionRecords(getUserResearchLiteratureNotesCollectionSegments(uid)),
    listCollectionRecords(getUserResearchReadingNotesCollectionSegments(uid)),
    listCollectionRecords(getUserResearchMindMapNodesCollectionSegments(uid)),
    listCollectionRecords(getUserResearchSynthesisSectionsCollectionSegments(uid)),
    listCollectionRecords(getUserResearchPrismaRecordsCollectionSegments(uid)),
    listCollectionRecords(getUserResearchPrismaCriteriaCollectionSegments(uid)),
  ]);

  return normalizeResearchSnapshot({
    projects,
    tasks,
    logEntries,
    drafts,
    submissions,
    literatureSources,
    literatureNotes,
    readingNotes,
    mindMapNodes,
    synthesisSections,
    prismaRecords,
    prismaCriteria,
  });
}

export function getResearchCounts(
  snapshot: ResearchCloudSnapshot,
): ResearchCloudCounts {
  return {
    projects: snapshot.projects.length,
    tasks: snapshot.tasks.length,
    logEntries: snapshot.logEntries.length,
    drafts: snapshot.drafts.length,
    submissions: snapshot.submissions.length,
    literatureSources: snapshot.literatureSources.length,
    literatureNotes: snapshot.literatureNotes.length,
    readingNotes: snapshot.readingNotes.length,
    mindMapNodes: snapshot.mindMapNodes.length,
    synthesisSections: snapshot.synthesisSections.length,
    prismaRecords: snapshot.prismaRecords.length,
    prismaCriteria: snapshot.prismaCriteria.length,
  };
}

export async function countUserResearchData(
  uid: string,
): Promise<ResearchCloudCounts> {
  return getResearchCounts(await listUserResearchData(uid));
}

function isSafeForFirestore(
  collectionName: SnapshotCollectionKey,
  record: SyncRecord | ResearchPrismaCriteria,
  skippedLargeRecords: ResearchSkippedRecord[],
) {
  const id = "id" in record ? record.id : record.projectId;
  const sizeBytes = getRecordSizeBytes(record);

  if (sizeBytes <= RESEARCH_LARGE_RECORD_WARNING_BYTES) {
    return true;
  }

  skippedLargeRecords.push({
    collection: collectionName,
    id,
    sizeBytes,
  });

  return false;
}

export async function batchUploadUserResearchData(
  uid: string,
  snapshot: ResearchCloudSnapshot,
): Promise<ResearchUploadResult> {
  const firestore = requireDb();
  const normalizedSnapshot = normalizeResearchSnapshot(snapshot);
  const skippedLargeRecords: ResearchSkippedRecord[] = [];
  let batch = writeBatch(firestore);
  let operationCount = 0;

  async function commitIfNeeded(force = false) {
    if (operationCount === 0 || (!force && operationCount < 450)) {
      return;
    }

    await batch.commit();
    batch = writeBatch(firestore);
    operationCount = 0;
  }

  async function addCollection<T extends SyncRecord>(
    collectionName: SnapshotCollectionKey,
    records: T[],
    getSegments: (uid: string, id: string) => readonly string[],
  ) {
    records.forEach((record) => {
      if (!isSafeForFirestore(collectionName, record, skippedLargeRecords)) {
        return;
      }

      batch.set(
        doc(firestore, getSegments(uid, record.id).join("/")),
        toFirestoreRecord(record as unknown as Record<string, unknown>),
        { merge: true },
      );
      operationCount += 1;
    });

    await commitIfNeeded();
  }

  await addCollection("projects", normalizedSnapshot.projects, (userId, id) =>
    getUserResearchProjectDocumentSegments(userId, id),
  );
  await addCollection("tasks", normalizedSnapshot.tasks, (userId, id) =>
    getUserResearchTaskDocumentSegments(userId, id),
  );
  await addCollection("logEntries", normalizedSnapshot.logEntries, (userId, id) =>
    getUserResearchLogEntryDocumentSegments(userId, id),
  );
  await addCollection("drafts", normalizedSnapshot.drafts, (userId, id) =>
    getUserResearchDraftDocumentSegments(userId, id),
  );
  await addCollection("submissions", normalizedSnapshot.submissions, (userId, id) =>
    getUserResearchSubmissionDocumentSegments(userId, id),
  );
  await addCollection(
    "literatureSources",
    normalizedSnapshot.literatureSources,
    (userId, id) => getUserResearchLiteratureSourceDocumentSegments(userId, id),
  );
  await addCollection(
    "literatureNotes",
    normalizedSnapshot.literatureNotes,
    (userId, id) => getUserResearchLiteratureNoteDocumentSegments(userId, id),
  );
  await addCollection("readingNotes", normalizedSnapshot.readingNotes, (userId, id) =>
    getUserResearchReadingNoteDocumentSegments(userId, id),
  );
  await addCollection("mindMapNodes", normalizedSnapshot.mindMapNodes, (userId, id) =>
    getUserResearchMindMapNodeDocumentSegments(userId, id),
  );
  await addCollection(
    "synthesisSections",
    normalizedSnapshot.synthesisSections,
    (userId, id) => getUserResearchSynthesisSectionDocumentSegments(userId, id),
  );
  await addCollection("prismaRecords", normalizedSnapshot.prismaRecords, (userId, id) =>
    getUserResearchPrismaRecordDocumentSegments(userId, id),
  );

  normalizedSnapshot.prismaCriteria.forEach((criteria) => {
    if (!isSafeForFirestore("prismaCriteria", criteria, skippedLargeRecords)) {
      return;
    }

    batch.set(
      doc(
        firestore,
        getUserResearchPrismaCriteriaDocumentSegments(
          uid,
          criteria.projectId,
        ).join("/"),
      ),
      toFirestoreRecord({
        ...criteria,
        id: criteria.projectId,
      }),
      { merge: true },
    );
    operationCount += 1;
  });

  await commitIfNeeded(true);

  return {
    counts: getResearchCounts(normalizedSnapshot),
    skippedLargeRecords,
  };
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
    localStatus === "deleted" || cloudStatus === "deleted"
      ? "deleted"
      : localStatus === "archived" || cloudStatus === "archived"
        ? "archived"
        : localStatus === "done" || cloudStatus === "done"
          ? "done"
          : localStatus === "accepted" || cloudStatus === "accepted"
            ? "accepted"
            : localStatus === "submitted" || cloudStatus === "submitted"
              ? "submitted"
              : localStatus === "included" || cloudStatus === "included"
                ? "included"
                : localStatus === "excluded" || cloudStatus === "excluded"
                  ? "excluded"
                  : undefined;

  if (terminalStatus) {
    merged.status = terminalStatus;
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

function criteriaToSyncRecord(criteria: ResearchPrismaCriteria): CriteriaSyncRecord {
  return {
    ...criteria,
    id: criteria.projectId,
  };
}

function syncRecordToCriteria(record: CriteriaSyncRecord): ResearchPrismaCriteria {
  return {
    projectId: record.projectId,
    inclusionCriteria: record.inclusionCriteria,
    exclusionCriteria: record.exclusionCriteria,
    updatedAt: record.updatedAt,
  };
}

export function mergeResearchDataForSync(
  localSnapshotInput: ResearchCloudSnapshot,
  cloudSnapshotInput: ResearchCloudSnapshot,
): ResearchMergeResult {
  const localSnapshot = normalizeResearchSnapshot(localSnapshotInput);
  const cloudSnapshot = normalizeResearchSnapshot(cloudSnapshotInput);
  const totals = { addedCount: 0, updatedCount: 0, dedupedCount: 0 };
  const prismaCriteria = mergeSnapshotCollection(
    localSnapshot.prismaCriteria.map(criteriaToSyncRecord),
    cloudSnapshot.prismaCriteria.map(criteriaToSyncRecord),
    (criteria) => criteria.projectId,
    totals,
  ).map(syncRecordToCriteria);

  return {
    projects: mergeSnapshotCollection(
      localSnapshot.projects,
      cloudSnapshot.projects,
      (project) => normalizeTextKey(project.title),
      totals,
    ),
    tasks: mergeSnapshotCollection(
      localSnapshot.tasks,
      cloudSnapshot.tasks,
      (task) =>
        [
          task.projectId,
          normalizeTextKey(task.title),
          task.stageKey,
          task.dueDate ?? "",
        ].join("|"),
      totals,
    ),
    logEntries: mergeSnapshotCollection(
      localSnapshot.logEntries,
      cloudSnapshot.logEntries,
      (entry) =>
        [
          entry.projectId,
          normalizeTextKey(entry.title),
          entry.entryType,
          entry.createdAt,
        ].join("|"),
      totals,
    ),
    drafts: mergeSnapshotCollection(
      localSnapshot.drafts,
      cloudSnapshot.drafts,
      (draft) =>
        [
          draft.projectId,
          normalizeTextKey(draft.title),
          normalizeTextKey(draft.section),
        ].join("|"),
      totals,
    ),
    submissions: mergeSnapshotCollection(
      localSnapshot.submissions,
      cloudSnapshot.submissions,
      (submission) =>
        [
          submission.projectId,
          normalizeTextKey(submission.journalName),
          normalizeTextKey(submission.manuscriptVersion),
        ].join("|"),
      totals,
    ),
    literatureSources: mergeSnapshotCollection(
      localSnapshot.literatureSources,
      cloudSnapshot.literatureSources,
      (source) =>
        [
          source.projectId,
          normalizeTextKey(source.link),
          normalizeTextKey(source.title),
          normalizeTextKey(source.authors),
          source.year ?? "",
        ].join("|"),
      totals,
    ),
    literatureNotes: mergeSnapshotCollection(
      localSnapshot.literatureNotes,
      cloudSnapshot.literatureNotes,
      (note) =>
        [
          note.projectId,
          note.sourceId ?? "",
          normalizeTextKey(note.title),
          note.noteKind,
        ].join("|"),
      totals,
    ),
    readingNotes: mergeSnapshotCollection(
      localSnapshot.readingNotes,
      cloudSnapshot.readingNotes,
      (note) => [note.projectId, note.sourceId].join("|"),
      totals,
    ),
    mindMapNodes: mergeSnapshotCollection(
      localSnapshot.mindMapNodes,
      cloudSnapshot.mindMapNodes,
      (node) =>
        [
          node.projectId,
          node.nodeType,
          normalizeTextKey(node.title),
          node.sourceId ?? "",
          node.noteId ?? "",
          node.synthesisSectionId ?? "",
        ].join("|"),
      totals,
    ),
    synthesisSections: mergeSnapshotCollection(
      localSnapshot.synthesisSections,
      cloudSnapshot.synthesisSections,
      (section) =>
        [
          section.projectId,
          normalizeTextKey(section.title),
          normalizeTextKey(section.claim),
        ].join("|"),
      totals,
    ),
    prismaRecords: mergeSnapshotCollection(
      localSnapshot.prismaRecords,
      cloudSnapshot.prismaRecords,
      (record) =>
        [
          record.projectId,
          record.sourceId ?? "",
          normalizeTextKey(record.sourceTitle),
          normalizeTextKey(record.database),
        ].join("|"),
      totals,
    ),
    prismaCriteria,
    ...totals,
  };
}

export async function pushMergedUserResearchData(
  uid: string,
  localSnapshot: ResearchCloudSnapshot,
  cloudSnapshot: ResearchCloudSnapshot,
) {
  const mergeResult = mergeResearchDataForSync(localSnapshot, cloudSnapshot);
  const uploadResult = await batchUploadUserResearchData(uid, mergeResult);

  return {
    ...mergeResult,
    skippedLargeRecords: uploadResult.skippedLargeRecords,
  };
}

export { emptyCounts as emptyResearchCounts };
