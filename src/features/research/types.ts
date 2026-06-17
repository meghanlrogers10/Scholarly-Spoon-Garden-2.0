export type ResearchFocusLevel = "primary" | "secondary" | "paused";

export type ResearchProjectStatus = "active" | "archived" | "deleted";

export type ResearchStageKey =
  | "lit-framing"
  | "lit-theory-draft"
  | "data-analyses"
  | "methods-draft"
  | "results-draft"
  | "discussion-draft"
  | "structural-revision"
  | "line-edit"
  | "submission-prep";

export type ResearchProjectColor =
  | "purple"
  | "pink"
  | "sky"
  | "mint"
  | "coral"
  | "gold";

export type ResearchProjectDuration = 3 | 6 | 9 | 12;

export type ResearchProject = {
  id: string;
  isSampleData?: boolean;
  source?: "sample-data";
  title: string;
  shortName: string;
  description: string;
  focusLevel: ResearchFocusLevel;
  status: ResearchProjectStatus;
  currentStage: ResearchStageKey;
  targetJournal?: string;
  nextAction: string;
  dueDate?: string;
  startDate?: string;
  durationMonths?: ResearchProjectDuration;
  createdAt?: string;
  updatedAt: string;
  color: ResearchProjectColor;
  taskCount: number;
  completedTaskCount: number;
  literatureCount: number;
  notesCount: number;
  journalStatus?: string;
};

export type NewResearchProjectInput = {
  title: string;
  shortName: string;
  description: string;
  focusLevel: ResearchFocusLevel;
  targetJournal?: string;
  durationMonths: ResearchProjectDuration;
};

export type UpdateResearchProjectInput = {
  id: string;
  title: string;
  shortName: string;
  description: string;
  focusLevel: ResearchFocusLevel;
  currentStage: ResearchStageKey;
  targetJournal?: string;
  nextAction: string;
  dueDate?: string;
  durationMonths?: ResearchProjectDuration;
};

export type ResearchTaskStatus = "todo" | "doing" | "done";

export type ResearchTaskPriority = "low" | "medium" | "high";

export type ResearchTask = {
  id: string;
  isSampleData?: boolean;
  source?: "sample-data";
  projectId: string;
  title: string;
  stageKey: ResearchStageKey;
  status: ResearchTaskStatus;
  priority: ResearchTaskPriority;
  spoonCost: 1 | 2 | 3 | 4 | 5;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ResearchTaskInput = {
  projectId: string;
  title: string;
  stageKey: ResearchStageKey;
  status: ResearchTaskStatus;
  priority: ResearchTaskPriority;
  spoonCost: 1 | 2 | 3 | 4 | 5;
  dueDate?: string;
  notes?: string;
};

export type ResearchLogEntryType =
  | "progress"
  | "decision"
  | "blocker"
  | "idea"
  | "next-action"
  | "results";

export type ResearchResultOutputType =
  | "stata"
  | "excel-table"
  | "figure"
  | "model"
  | "text"
  | "mixed";

export type ResearchResultBlockType =
  | "stata"
  | "excel-table"
  | "image"
  | "note";

export type ResearchResultBlock = {
  id: string;
  type: ResearchResultBlockType;
  title?: string;
  text?: string;
  html?: string;
  plainText?: string;
  imageDataUrl?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
};

export type ResearchLogEntry = {
  id: string;
  projectId: string;
  entryType: ResearchLogEntryType;
  title: string;
  body: string;
  doFile?: string;
  folderPath?: string;
  datasetUsed?: string;
  outputLabel?: string;
  outputType?: ResearchResultOutputType;
  commandNotes?: string;
  runDate?: string;
  versionCheckpoint?: string;
  resultBlocks?: ResearchResultBlock[];
  tags?: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResearchLogEntryInput = {
  projectId: string;
  entryType: ResearchLogEntryType;
  title: string;
  body: string;
  doFile?: string;
  folderPath?: string;
  datasetUsed?: string;
  outputLabel?: string;
  outputType?: ResearchResultOutputType;
  commandNotes?: string;
  runDate?: string;
  versionCheckpoint?: string;
  resultBlocks?: ResearchResultBlock[];
  tags?: string[];
  pinned: boolean;
};

export type ResearchDraftStatus =
  | "not-started"
  | "sketching"
  | "drafting"
  | "revising"
  | "waiting"
  | "done"
  | "parked";

export type ResearchDraft = {
  id: string;
  projectId: string;
  title: string;
  section: string;
  status: ResearchDraftStatus;
  link?: string;
  versionLabel?: string;
  versionNotes?: string;
  lastWorkedAt?: string;
  whereLeftOff?: string;
  nextWritingMove?: string;
  notes?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResearchDraftInput = {
  projectId: string;
  title: string;
  section: string;
  status: ResearchDraftStatus;
  link?: string;
  versionLabel?: string;
  versionNotes?: string;
  lastWorkedAt?: string;
  whereLeftOff?: string;
  nextWritingMove?: string;
  notes?: string;
  pinned: boolean;
};

export type ResearchSubmissionStatus =
  | "targeting"
  | "preparing"
  | "submitted"
  | "revise-resubmit"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type ResearchSubmission = {
  id: string;
  projectId: string;
  journalName: string;
  status: ResearchSubmissionStatus;
  manuscriptVersion?: string;
  submittedAt?: string;
  decisionAt?: string;
  nextAction?: string;
  notes?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResearchSubmissionInput = {
  projectId: string;
  journalName: string;
  status: ResearchSubmissionStatus;
  manuscriptVersion?: string;
  submittedAt?: string;
  decisionAt?: string;
  nextAction?: string;
  notes?: string;
  pinned: boolean;
};

export type ResearchLiteratureSourceType =
  | "article"
  | "book"
  | "chapter"
  | "report"
  | "dataset"
  | "website"
  | "other";

export type ResearchLiteratureStatus =
  | "unread"
  | "skimmed"
  | "read"
  | "notes-taken"
  | "cited"
  | "parked";

export type ResearchLiteratureSource = {
  id: string;
  projectId: string;
  title: string;
  authors?: string;
  year?: string;
  sourceType: ResearchLiteratureSourceType;
  status: ResearchLiteratureStatus;
  link?: string;
  themes: string[];
  keyQuote?: string;
  notes?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResearchLiteratureSourceInput = {
  projectId: string;
  title: string;
  authors?: string;
  year?: string;
  sourceType: ResearchLiteratureSourceType;
  status: ResearchLiteratureStatus;
  link?: string;
  themes: string[];
  keyQuote?: string;
  notes?: string;
  pinned: boolean;
};

export type ResearchLiteratureNoteKind =
  | "summary"
  | "theory"
  | "methods"
  | "findings"
  | "quote"
  | "gap"
  | "argument"
  | "future-research"
  | "question";

export type ResearchLiteratureNote = {
  id: string;
  projectId: string;
  sourceId?: string;
  sourceTitle?: string;
  noteKind: ResearchLiteratureNoteKind;
  title: string;
  body: string;
  themes: string[];
  keyQuote?: string;
  argumentSlot?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResearchLiteratureNoteInput = {
  projectId: string;
  sourceId?: string;
  sourceTitle?: string;
  noteKind: ResearchLiteratureNoteKind;
  title: string;
  body: string;
  themes: string[];
  keyQuote?: string;
  argumentSlot?: string;
  pinned: boolean;
};

export type ResearchLiteratureReadingNoteSections = {
  researchQuestion: string;
  litReview: string;
  theory: string;
  hypotheses: string;
  dataSample: string;
  methods: string;
  findingsConclusion: string;
  quotes: string;
  futureResearch: string;
  generalNotes: string;
};

export type ResearchLiteratureReadingNote = {
  id: string;
  projectId: string;
  sourceId: string;
  sourceTitle: string;
  sections: ResearchLiteratureReadingNoteSections;
  body?: string;
  extractedThemes: string[];
  manualThemes: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResearchLiteratureReadingNoteInput = {
  projectId: string;
  sourceId: string;
  sourceTitle: string;
  sections: ResearchLiteratureReadingNoteSections;
  body?: string;
  extractedThemes: string[];
  manualThemes: string[];
  pinned?: boolean;
};

export type ResearchMindMapNodeType =
  | "theme"
  | "source"
  | "note"
  | "argument"
  | "gap"
  | "question";

export type ResearchMindMapNode = {
  id: string;
  projectId: string;
  nodeType: ResearchMindMapNodeType;
  title: string;
  body?: string;
  sourceId?: string;
  sourceTitle?: string;
  noteId?: string;
  noteTitle?: string;
  synthesisSectionId?: string;
  synthesisSectionTitle?: string;
  relatedThemes?: string[];
  x?: number;
  y?: number;
  color?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResearchMindMapNodeInput = {
  projectId: string;
  nodeType: ResearchMindMapNodeType;
  title: string;
  body?: string;
  sourceId?: string;
  sourceTitle?: string;
  noteId?: string;
  noteTitle?: string;
  synthesisSectionId?: string;
  synthesisSectionTitle?: string;
  relatedThemes?: string[];
  x?: number;
  y?: number;
  color?: string;
  pinned: boolean;
};

export type ResearchSynthesisSectionStatus =
  | "idea"
  | "drafting"
  | "needs-evidence"
  | "solid"
  | "parked";

export type ResearchSynthesisSection = {
  id: string;
  projectId: string;
  title: string;
  claim: string;
  themes: string[];
  linkedSourceIds: string[];
  linkedNoteIds: string[];
  draftNote?: string;
  status: ResearchSynthesisSectionStatus;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResearchSynthesisSectionInput = {
  projectId: string;
  title: string;
  claim: string;
  themes: string[];
  linkedSourceIds: string[];
  linkedNoteIds: string[];
  draftNote?: string;
  status: ResearchSynthesisSectionStatus;
  pinned: boolean;
};

export type ResearchPrismaStatus =
  | "identified"
  | "screened"
  | "eligible"
  | "included"
  | "excluded";

export type ResearchPrismaRecord = {
  id: string;
  projectId: string;
  sourceId?: string;
  sourceTitle?: string;
  status: ResearchPrismaStatus;
  exclusionReason?: string;
  inclusionNotes?: string;
  screeningNotes?: string;
  database?: string;
  sourceOrigin?: string;
  searchString?: string;
  importedAt?: string;
  screenedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ResearchPrismaRecordInput = {
  projectId: string;
  sourceId?: string;
  sourceTitle?: string;
  status: ResearchPrismaStatus;
  exclusionReason?: string;
  inclusionNotes?: string;
  screeningNotes?: string;
  database?: string;
  sourceOrigin?: string;
  searchString?: string;
  importedAt?: string;
  screenedAt?: string;
};

export type ResearchPrismaCriteria = {
  projectId: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  updatedAt: string;
};
