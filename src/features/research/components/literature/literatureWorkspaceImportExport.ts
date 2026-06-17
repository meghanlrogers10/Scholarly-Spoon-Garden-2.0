import type {
  ResearchLiteratureNote,
  ResearchLiteratureNoteKind,
  ResearchLiteratureReadingNote,
  ResearchLiteratureReadingNoteSections,
  ResearchLiteratureSource,
  ResearchLiteratureSourceType,
  ResearchLiteratureStatus,
  ResearchMindMapNode,
  ResearchMindMapNodeType,
  ResearchPrismaCriteria,
  ResearchPrismaRecord,
  ResearchPrismaStatus,
  ResearchSynthesisSection,
  ResearchSynthesisSectionStatus,
} from "../../types";

export type LiteratureWorkspaceExport = {
  exportedAt: string;
  projectId: string;
  projectTitle: string;
  sources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  readingNotes?: ResearchLiteratureReadingNote[];
  mindMapNodes: ResearchMindMapNode[];
  synthesisSections: ResearchSynthesisSection[];
  prismaRecords?: ResearchPrismaRecord[];
  prismaCriteria?: ResearchPrismaCriteria;
};

type NormalizeImportedWorkspaceOptions = {
  currentProjectId: string;
  allSources: ResearchLiteratureSource[];
  allNotes: ResearchLiteratureNote[];
  allReadingNotes?: ResearchLiteratureReadingNote[];
  allMapNodes: ResearchMindMapNode[];
  allSynthesisSections: ResearchSynthesisSection[];
  allPrismaRecords?: ResearchPrismaRecord[];
  allPrismaCriteria?: ResearchPrismaCriteria[];
  sources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  readingNotes?: ResearchLiteratureReadingNote[];
  mapNodes: ResearchMindMapNode[];
  synthesisSections: ResearchSynthesisSection[];
  prismaRecords?: ResearchPrismaRecord[];
  prismaCriteria?: ResearchPrismaCriteria;
};

const validSourceTypes: ResearchLiteratureSourceType[] = [
  "article",
  "book",
  "chapter",
  "report",
  "dataset",
  "website",
  "other",
];

const validLiteratureStatuses: ResearchLiteratureStatus[] = [
  "unread",
  "skimmed",
  "read",
  "notes-taken",
  "cited",
  "parked",
];

const validNoteKinds: ResearchLiteratureNoteKind[] = [
  "summary",
  "theory",
  "methods",
  "findings",
  "quote",
  "gap",
  "argument",
  "future-research",
  "question",
];

const validMindMapNodeTypes: ResearchMindMapNodeType[] = [
  "theme",
  "source",
  "note",
  "argument",
  "gap",
  "question",
];

const validSynthesisStatuses: ResearchSynthesisSectionStatus[] = [
  "idea",
  "drafting",
  "needs-evidence",
  "solid",
  "parked",
];

const validPrismaStatuses: ResearchPrismaStatus[] = [
  "identified",
  "screened",
  "eligible",
  "included",
  "excluded",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeFingerprintPart(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/\s+/g, " ")
    : "";
}

function normalizeFingerprintArray(value: unknown) {
  return readStringArray(value)
    .map((item) => normalizeFingerprintPart(item))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
}

function createFingerprint(parts: unknown[]) {
  return parts.map((part) => normalizeFingerprintPart(part)).join("|");
}

function getSourceFingerprint(source: {
  title?: unknown;
  authors?: unknown;
  year?: unknown;
  link?: unknown;
  sourceType?: unknown;
}) {
  return createFingerprint([
    source.title,
    source.authors,
    source.year,
    source.link,
    source.sourceType,
  ]);
}

function getNoteFingerprint(note: {
  noteKind?: unknown;
  title?: unknown;
  body?: unknown;
  sourceTitle?: unknown;
  keyQuote?: unknown;
  argumentSlot?: unknown;
  themes?: unknown;
}) {
  return createFingerprint([
    note.noteKind,
    note.title,
    note.body,
    note.sourceTitle,
    note.keyQuote,
    note.argumentSlot,
    normalizeFingerprintArray(note.themes),
  ]);
}

function readReadingNoteSections(value: unknown): ResearchLiteratureReadingNoteSections {
  const record = isRecord(value) ? value : {};

  return {
    researchQuestion: readOptionalString(record.researchQuestion) ?? "",
    litReview: readOptionalString(record.litReview) ?? "",
    theory: readOptionalString(record.theory) ?? "",
    hypotheses: readOptionalString(record.hypotheses) ?? "",
    dataSample: readOptionalString(record.dataSample) ?? "",
    methods: readOptionalString(record.methods) ?? "",
    findingsConclusion: readOptionalString(record.findingsConclusion) ?? "",
    quotes: readOptionalString(record.quotes) ?? "",
    futureResearch: readOptionalString(record.futureResearch) ?? "",
    generalNotes: readOptionalString(record.generalNotes) ?? "",
  };
}

function getReadingNoteFingerprint(note: {
  sourceTitle?: unknown;
  sections?: unknown;
  body?: unknown;
  extractedThemes?: unknown;
  manualThemes?: unknown;
}) {
  const sections = readReadingNoteSections(note.sections);

  return createFingerprint([
    note.sourceTitle,
    Object.values(sections).join(" "),
    note.body,
    normalizeFingerprintArray(note.extractedThemes),
    normalizeFingerprintArray(note.manualThemes),
  ]);
}

function getMindMapNodeFingerprint(node: {
  nodeType?: unknown;
  title?: unknown;
  body?: unknown;
  description?: unknown;
  sourceTitle?: unknown;
  linkedSourceTitle?: unknown;
  noteTitle?: unknown;
  linkedNoteTitle?: unknown;
  synthesisSectionTitle?: unknown;
  linkedSynthesisSectionTitle?: unknown;
  themes?: unknown;
  relatedThemes?: unknown;
}) {
  return createFingerprint([
    node.nodeType,
    node.title,
    node.body ?? node.description,
    node.sourceTitle ?? node.linkedSourceTitle,
    node.noteTitle ?? node.linkedNoteTitle,
    node.synthesisSectionTitle ?? node.linkedSynthesisSectionTitle,
    normalizeFingerprintArray(node.relatedThemes ?? node.themes),
  ]);
}

function getSynthesisSectionFingerprint(section: {
  title?: unknown;
  claim?: unknown;
  draftNote?: unknown;
  status?: unknown;
  themes?: unknown;
}) {
  return createFingerprint([
    section.title,
    section.claim,
    section.draftNote,
    section.status,
    normalizeFingerprintArray(section.themes),
  ]);
}

function createUniqueImportId(
  originalId: string | undefined,
  usedIds: Set<string>,
  currentProjectId: string,
  prefix: string,
  index: number
) {
  let candidate = originalId ?? "";

  if (!candidate || usedIds.has(candidate)) {
    candidate = `${currentProjectId}-${prefix}-import-${Date.now()}-${index}`;
  }

  let suffix = 1;
  while (usedIds.has(candidate)) {
    candidate = `${currentProjectId}-${prefix}-import-${Date.now()}-${index}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function createFallbackImportId(
  currentProjectId: string,
  prefix: string,
  index: number
) {
  return `${currentProjectId}-${prefix}-missing-id-${index}`;
}

export function downloadJson(
  filename: string,
  payload: LiteratureWorkspaceExport
) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function slugifyFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeImportedWorkspace(
  parsed: unknown,
  {
    currentProjectId,
    allSources,
    allNotes,
    allReadingNotes = [],
    allMapNodes,
    allSynthesisSections,
    allPrismaRecords = [],
    sources,
    notes,
    readingNotes = [],
    mapNodes,
    synthesisSections,
    prismaRecords = [],
  }: NormalizeImportedWorkspaceOptions
) {
  if (!isRecord(parsed)) {
    throw new Error("Import file must contain a JSON object.");
  }

  const importedSources = parsed.sources;
  const importedNotes = parsed.notes;
  const importedReadingNotes = Array.isArray(parsed.readingNotes)
    ? parsed.readingNotes
    : [];
  const importedMapNodes = parsed.mindMapNodes;
  const importedSynthesisSections = parsed.synthesisSections;
  const importedPrismaRecords = Array.isArray(parsed.prismaRecords)
    ? parsed.prismaRecords
    : [];
  const importedPrismaCriteria = isRecord(parsed.prismaCriteria)
    ? parsed.prismaCriteria
    : undefined;

  if (
    !Array.isArray(importedSources) ||
    !Array.isArray(importedNotes) ||
    !Array.isArray(importedMapNodes) ||
    !Array.isArray(importedSynthesisSections)
  ) {
    throw new Error(
      "Import file must include sources, notes, mindMapNodes, and synthesisSections arrays."
    );
  }

  const usedSourceIds = new Set(allSources.map((source) => source.id));
  const usedNoteIds = new Set(allNotes.map((note) => note.id));
  const usedReadingNoteIds = new Set(allReadingNotes.map((note) => note.id));
  const usedMapNodeIds = new Set(allMapNodes.map((node) => node.id));
  const usedSynthesisIds = new Set(
    allSynthesisSections.map((section) => section.id)
  );
  const usedPrismaIds = new Set(
    allPrismaRecords.map((record) => record.id)
  );
  const sourceIdMap = new Map<string, string>();
  const noteIdMap = new Map<string, string>();
  const existingSourceById = new Map(
    sources.map((source) => [source.id, source])
  );
  const existingNoteById = new Map(notes.map((note) => [note.id, note]));
  const existingReadingNoteById = new Map(
    readingNotes.map((note) => [note.id, note])
  );
  const existingMapNodeById = new Map(mapNodes.map((node) => [node.id, node]));
  const existingSynthesisById = new Map(
    synthesisSections.map((section) => [section.id, section])
  );
  const existingPrismaFingerprints = new Set(
    prismaRecords.map((record) =>
      createFingerprint([
        record.sourceTitle,
        record.status,
        record.exclusionReason,
        record.inclusionNotes,
        record.screeningNotes,
      ])
    )
  );
  const sourceFingerprints = new Map(
    sources.map((source) => [getSourceFingerprint(source), source.id])
  );
  const noteFingerprints = new Map(
    notes.map((note) => [getNoteFingerprint(note), note.id])
  );
  const readingNoteFingerprints = new Map(
    readingNotes.map((note) => [getReadingNoteFingerprint(note), note.id])
  );
  const mapNodeFingerprints = new Map(
    mapNodes.map((node) => [getMindMapNodeFingerprint(node), node.id])
  );
  const synthesisFingerprints = new Map(
    synthesisSections.map((section) => [
      getSynthesisSectionFingerprint(section),
      section.id,
    ])
  );
  let skippedDuplicateCount = 0;

  const normalizedSources: ResearchLiteratureSource[] = [];

  importedSources.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    const originalId =
      readOptionalString(item.id) ??
      createFallbackImportId(currentProjectId, "source", index);
    const sourceType = validSourceTypes.includes(
      item.sourceType as ResearchLiteratureSourceType
    )
      ? (item.sourceType as ResearchLiteratureSourceType)
      : "other";
    const status = validLiteratureStatuses.includes(
      item.status as ResearchLiteratureStatus
    )
      ? (item.status as ResearchLiteratureStatus)
      : "unread";
    const candidate = {
      title:
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : "Untitled source",
      authors: readOptionalString(item.authors),
      year: readOptionalString(item.year),
      sourceType,
      status,
      link: readOptionalString(item.link),
      themes: readStringArray(item.themes),
      keyQuote: readOptionalString(item.keyQuote),
      notes: readOptionalString(item.notes),
      pinned: readBoolean(item.pinned),
      createdAt: readOptionalString(item.createdAt) ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const fingerprint = getSourceFingerprint(candidate);
    const existingById = existingSourceById.get(originalId);
    const existingDuplicateId =
      existingById && getSourceFingerprint(existingById) === fingerprint
        ? existingById.id
        : sourceFingerprints.get(fingerprint);

    if (existingDuplicateId) {
      sourceIdMap.set(originalId, existingDuplicateId);
      skippedDuplicateCount += 1;
      return;
    }

    const id = createUniqueImportId(
      originalId,
      usedSourceIds,
      currentProjectId,
      "source",
      index
    );
    sourceIdMap.set(originalId, id);

    const normalizedSource: ResearchLiteratureSource = {
      id,
      projectId: currentProjectId,
      ...candidate,
    };

    normalizedSources.push(normalizedSource);
    sourceFingerprints.set(fingerprint, id);
    existingSourceById.set(id, normalizedSource);
  });

  const normalizedNotes: ResearchLiteratureNote[] = [];

  importedNotes.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    const originalId =
      readOptionalString(item.id) ??
      createFallbackImportId(currentProjectId, "lit-note", index);
    const noteKind = validNoteKinds.includes(
      item.noteKind as ResearchLiteratureNoteKind
    )
      ? (item.noteKind as ResearchLiteratureNoteKind)
      : "summary";
    const sourceId =
      typeof item.sourceId === "string"
        ? sourceIdMap.get(item.sourceId) ?? item.sourceId
        : undefined;
    const linkedSource = sourceId
      ? existingSourceById.get(sourceId) ??
        normalizedSources.find((source) => source.id === sourceId)
      : undefined;
    const candidate = {
      sourceId,
      sourceTitle: readOptionalString(item.sourceTitle) ?? linkedSource?.title,
      noteKind,
      title:
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : "Untitled source note",
      body:
        typeof item.body === "string" && item.body.trim()
          ? item.body.trim()
          : "No details added yet.",
      themes: readStringArray(item.themes),
      keyQuote: readOptionalString(item.keyQuote),
      argumentSlot: readOptionalString(item.argumentSlot),
      pinned: readBoolean(item.pinned),
      createdAt: readOptionalString(item.createdAt) ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const fingerprint = getNoteFingerprint(candidate);
    const existingById = existingNoteById.get(originalId);
    const existingDuplicateId =
      existingById && getNoteFingerprint(existingById) === fingerprint
        ? existingById.id
        : noteFingerprints.get(fingerprint);

    if (existingDuplicateId) {
      noteIdMap.set(originalId, existingDuplicateId);
      skippedDuplicateCount += 1;
      return;
    }

    const id = createUniqueImportId(
      originalId,
      usedNoteIds,
      currentProjectId,
      "lit-note",
      index
    );
    noteIdMap.set(originalId, id);

    const normalizedNote: ResearchLiteratureNote = {
      id,
      projectId: currentProjectId,
      ...candidate,
    };

    normalizedNotes.push(normalizedNote);
    noteFingerprints.set(fingerprint, id);
    existingNoteById.set(id, normalizedNote);
  });

  const normalizedMapNodes: ResearchMindMapNode[] = [];

  const normalizedReadingNotes: ResearchLiteratureReadingNote[] = [];

  importedReadingNotes.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    const originalId =
      readOptionalString(item.id) ??
      createFallbackImportId(currentProjectId, "reading-note", index);
    const sourceId =
      typeof item.sourceId === "string"
        ? sourceIdMap.get(item.sourceId) ?? item.sourceId
        : undefined;
    const linkedSource = sourceId
      ? existingSourceById.get(sourceId) ??
        normalizedSources.find((source) => source.id === sourceId)
      : undefined;
    const candidate = {
      sourceId: sourceId ?? "",
      sourceTitle:
        readOptionalString(item.sourceTitle) ??
        linkedSource?.title ??
        "Untitled source",
      sections: readReadingNoteSections(item.sections),
      body: readOptionalString(item.body),
      extractedThemes: readStringArray(item.extractedThemes),
      manualThemes: readStringArray(item.manualThemes),
      pinned: readBoolean(item.pinned),
      createdAt: readOptionalString(item.createdAt) ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const fingerprint = getReadingNoteFingerprint(candidate);
    const existingById = existingReadingNoteById.get(originalId);
    const existingDuplicateId =
      existingById && getReadingNoteFingerprint(existingById) === fingerprint
        ? existingById.id
        : readingNoteFingerprints.get(fingerprint);

    if (existingDuplicateId) {
      skippedDuplicateCount += 1;
      return;
    }

    const id = createUniqueImportId(
      originalId,
      usedReadingNoteIds,
      currentProjectId,
      "reading-note",
      index
    );
    const normalizedReadingNote: ResearchLiteratureReadingNote = {
      id,
      projectId: currentProjectId,
      ...candidate,
    };

    normalizedReadingNotes.push(normalizedReadingNote);
    readingNoteFingerprints.set(fingerprint, id);
    existingReadingNoteById.set(id, normalizedReadingNote);
  });

  importedMapNodes.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    const originalId =
      readOptionalString(item.id) ??
      createFallbackImportId(currentProjectId, "mindmap-node", index);
    const nodeType = validMindMapNodeTypes.includes(
      item.nodeType as ResearchMindMapNodeType
    )
      ? (item.nodeType as ResearchMindMapNodeType)
      : "argument";
    const sourceId =
      typeof item.sourceId === "string"
        ? sourceIdMap.get(item.sourceId) ?? item.sourceId
        : undefined;
    const noteId =
      typeof item.noteId === "string"
        ? noteIdMap.get(item.noteId) ?? item.noteId
        : undefined;
    const linkedSource = sourceId
      ? existingSourceById.get(sourceId) ??
        normalizedSources.find((source) => source.id === sourceId)
      : undefined;
    const linkedNote = noteId
      ? existingNoteById.get(noteId) ??
        normalizedNotes.find((note) => note.id === noteId)
      : undefined;
    const candidate = {
      nodeType,
      title:
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : "Untitled map node",
      body: readOptionalString(item.body),
      sourceId,
      sourceTitle: readOptionalString(item.sourceTitle) ?? linkedSource?.title,
      noteId,
      noteTitle: readOptionalString(item.noteTitle) ?? linkedNote?.title,
      synthesisSectionId: readOptionalString(item.synthesisSectionId),
      synthesisSectionTitle: readOptionalString(item.synthesisSectionTitle),
      relatedThemes: readStringArray(item.relatedThemes ?? item.themes),
      x: readOptionalNumber(item.x),
      y: readOptionalNumber(item.y),
      color: readOptionalString(item.color),
      pinned: readBoolean(item.pinned),
      createdAt: readOptionalString(item.createdAt) ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const fingerprint = getMindMapNodeFingerprint({
      ...candidate,
      themes: item.themes,
      relatedThemes: candidate.relatedThemes,
    });
    const existingById = existingMapNodeById.get(originalId);
    const existingDuplicateId =
      existingById && getMindMapNodeFingerprint(existingById) === fingerprint
        ? existingById.id
        : mapNodeFingerprints.get(fingerprint);

    if (existingDuplicateId) {
      skippedDuplicateCount += 1;
      return;
    }

    const id = createUniqueImportId(
      originalId,
      usedMapNodeIds,
      currentProjectId,
      "mindmap-node",
      index
    );
    const normalizedNode: ResearchMindMapNode = {
      id,
      projectId: currentProjectId,
      ...candidate,
    };

    normalizedMapNodes.push(normalizedNode);
    mapNodeFingerprints.set(fingerprint, id);
    existingMapNodeById.set(id, normalizedNode);
  });

  const normalizedSynthesisSections: ResearchSynthesisSection[] = [];

  importedSynthesisSections.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    const originalId =
      readOptionalString(item.id) ??
      createFallbackImportId(currentProjectId, "synthesis-section", index);
    const status = validSynthesisStatuses.includes(
      item.status as ResearchSynthesisSectionStatus
    )
      ? (item.status as ResearchSynthesisSectionStatus)
      : "idea";
    const candidate = {
      title:
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : "Untitled synthesis section",
      claim:
        typeof item.claim === "string" && item.claim.trim()
          ? item.claim.trim()
          : "No claim added yet.",
      themes: readStringArray(item.themes),
      linkedSourceIds: readStringArray(item.linkedSourceIds).map(
        (sourceId) => sourceIdMap.get(sourceId) ?? sourceId
      ),
      linkedNoteIds: readStringArray(item.linkedNoteIds).map(
        (noteId) => noteIdMap.get(noteId) ?? noteId
      ),
      draftNote: readOptionalString(item.draftNote),
      status,
      pinned: readBoolean(item.pinned),
      createdAt: readOptionalString(item.createdAt) ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const fingerprint = getSynthesisSectionFingerprint(candidate);
    const existingById = existingSynthesisById.get(originalId);
    const existingDuplicateId =
      existingById &&
      getSynthesisSectionFingerprint(existingById) === fingerprint
        ? existingById.id
        : synthesisFingerprints.get(fingerprint);

    if (existingDuplicateId) {
      skippedDuplicateCount += 1;
      return;
    }

    const id = createUniqueImportId(
      originalId,
      usedSynthesisIds,
      currentProjectId,
      "synthesis-section",
      index
    );
    const normalizedSection: ResearchSynthesisSection = {
      id,
      projectId: currentProjectId,
      ...candidate,
    };

    normalizedSynthesisSections.push(normalizedSection);
    synthesisFingerprints.set(fingerprint, id);
    existingSynthesisById.set(id, normalizedSection);
  });

  const normalizedPrismaRecords: ResearchPrismaRecord[] = [];

  importedPrismaRecords.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    const originalId =
      readOptionalString(item.id) ??
      createFallbackImportId(currentProjectId, "prisma", index);
    const status = validPrismaStatuses.includes(
      item.status as ResearchPrismaStatus
    )
      ? (item.status as ResearchPrismaStatus)
      : "identified";
    const sourceId =
      typeof item.sourceId === "string"
        ? sourceIdMap.get(item.sourceId) ?? item.sourceId
        : undefined;
    const linkedSource = sourceId
      ? existingSourceById.get(sourceId) ??
        normalizedSources.find((source) => source.id === sourceId)
      : undefined;
    const candidate = {
      sourceId,
      sourceTitle: readOptionalString(item.sourceTitle) ?? linkedSource?.title,
      status,
      exclusionReason: readOptionalString(item.exclusionReason),
      inclusionNotes: readOptionalString(item.inclusionNotes),
      screeningNotes: readOptionalString(item.screeningNotes),
      database: readOptionalString(item.database),
      sourceOrigin: readOptionalString(item.sourceOrigin),
      searchString: readOptionalString(item.searchString),
      importedAt: readOptionalString(item.importedAt),
      screenedAt: readOptionalString(item.screenedAt),
      createdAt: readOptionalString(item.createdAt) ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const fingerprint = createFingerprint([
      candidate.sourceTitle,
      candidate.status,
      candidate.exclusionReason,
      candidate.inclusionNotes,
      candidate.screeningNotes,
    ]);

    if (existingPrismaFingerprints.has(fingerprint)) {
      skippedDuplicateCount += 1;
      return;
    }

    const id = createUniqueImportId(
      originalId,
      usedPrismaIds,
      currentProjectId,
      "prisma",
      index
    );
    const normalizedRecord: ResearchPrismaRecord = {
      id,
      projectId: currentProjectId,
      ...candidate,
    };

    normalizedPrismaRecords.push(normalizedRecord);
    existingPrismaFingerprints.add(fingerprint);
  });

  const normalizedPrismaCriteria: ResearchPrismaCriteria[] =
    importedPrismaCriteria
      ? [
          {
            projectId: currentProjectId,
            inclusionCriteria: readStringArray(
              importedPrismaCriteria.inclusionCriteria
            ),
            exclusionCriteria: readStringArray(
              importedPrismaCriteria.exclusionCriteria
            ),
            updatedAt: new Date().toISOString(),
          },
        ]
      : [];

  return {
    sources: normalizedSources,
    notes: normalizedNotes,
    readingNotes: normalizedReadingNotes,
    mindMapNodes: normalizedMapNodes,
    synthesisSections: normalizedSynthesisSections,
    prismaRecords: normalizedPrismaRecords,
    prismaCriteria: normalizedPrismaCriteria,
    skippedDuplicateCount,
  };
}
