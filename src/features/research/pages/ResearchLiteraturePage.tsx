import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ResearchLiteratureModal } from "../components/ResearchLiteratureModal";
import { ResearchLiteratureNoteModal } from "../components/ResearchLiteratureNoteModal";
import { ResearchMindMapNodeModal } from "../components/ResearchMindMapNodeModal";
import { ResearchProjectSubnav } from "../components/ResearchProjectSubnav";
import { ResearchSynthesisSectionModal } from "../components/ResearchSynthesisSectionModal";
import { LiteratureImportExportControls } from "../components/literature/LiteratureImportExportControls";
import {
  LiteratureWorkspaceTabs,
  type LiteratureTab,
} from "../components/literature/LiteratureWorkspaceTabs";
import type { LiteratureThemeSummary } from "../components/literature/LiteratureThemesPanel";
import {
  downloadJson,
  normalizeImportedWorkspace,
  slugifyFilename,
} from "../components/literature/literatureWorkspaceImportExport";
import {
  buildLiteratureReviewHtml,
  buildLiteratureReviewMarkdown,
  downloadTextFile,
} from "../components/literature/literatureWritingExport";
import { useResearchLiterature } from "../hooks/useResearchLiterature";
import { useResearchLiteratureNotes } from "../hooks/useResearchLiteratureNotes";
import { useResearchLiteratureReadingNotes } from "../hooks/useResearchLiteratureReadingNotes";
import { useResearchMindMap } from "../hooks/useResearchMindMap";
import { useResearchPrisma } from "../hooks/useResearchPrisma";
import { useResearchProjects } from "../hooks/useResearchProjects";
import { useResearchSynthesis } from "../hooks/useResearchSynthesis";
import type {
  ResearchLiteratureNote,
  ResearchLiteratureNoteInput,
  ResearchLiteratureNoteKind,
  ResearchLiteratureReadingNote,
  ResearchLiteratureSource,
  ResearchLiteratureSourceInput,
  ResearchLiteratureSourceType,
  ResearchLiteratureStatus,
  ResearchMindMapNode,
  ResearchMindMapNodeInput,
  ResearchMindMapNodeType,
  ResearchSynthesisSection,
  ResearchSynthesisSectionInput,
  ResearchSynthesisSectionStatus,
} from "../types";

type SourceTypeFilter = "all" | ResearchLiteratureSourceType;
type StatusFilter = "all" | ResearchLiteratureStatus;
type NoteKindFilter = "all" | ResearchLiteratureNoteKind;
type LinkedSourceFilter = "all" | "none" | string;
type ThemeFilter = "all" | string;
type MindMapNodeTypeFilter = "all" | ResearchMindMapNodeType;
type SynthesisStatusFilter = "all" | ResearchSynthesisSectionStatus;

const literatureNoteKindLabels: Record<ResearchLiteratureNoteKind, string> = {
  summary: "Summary",
  theory: "Theory",
  methods: "Methods",
  findings: "Findings",
  quote: "Quote",
  gap: "Gap",
  argument: "Argument",
  "future-research": "Future research",
  question: "Question",
};

const mindMapNodeTypeLabels: Record<ResearchMindMapNodeType, string> = {
  theme: "Theme",
  source: "Source",
  note: "Source note",
  argument: "Argument",
  gap: "Gap",
  question: "Question",
};

function getSourceThemes(source: ResearchLiteratureSource) {
  return Array.isArray(source.themes) ? source.themes : [];
}

function getNoteThemes(note: ResearchLiteratureNote) {
  return Array.isArray(note.themes) ? note.themes : [];
}

function getSectionThemes(section: ResearchSynthesisSection) {
  return Array.isArray(section.themes) ? section.themes : [];
}

function normalizeComparable(value?: string) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeThemes(themes: string[]) {
  return Array.from(
    new Set(themes.map((theme) => normalizeComparable(theme)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function mapNoteKindToNodeType(
  noteKind: ResearchLiteratureNoteKind
): ResearchMindMapNodeType {
  if (noteKind === "gap" || noteKind === "question" || noteKind === "argument") {
    return noteKind;
  }

  return "note";
}

function formatReadingNoteBody(note: ResearchLiteratureReadingNote) {
  return Object.entries(note.sections)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value.trim()}`)
    .join("\n\n");
}

function sourceMatchesSearch(source: ResearchLiteratureSource, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const themes = getSourceThemes(source);

  return (
    source.title.toLowerCase().includes(normalizedQuery) ||
    (source.authors?.toLowerCase().includes(normalizedQuery) ?? false) ||
    (source.year?.toLowerCase().includes(normalizedQuery) ?? false) ||
    (source.notes?.toLowerCase().includes(normalizedQuery) ?? false) ||
    (source.keyQuote?.toLowerCase().includes(normalizedQuery) ?? false) ||
    themes.some((theme) => theme.toLowerCase().includes(normalizedQuery))
  );
}

function noteMatchesSearch(note: ResearchLiteratureNote, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const themes = getNoteThemes(note);

  return (
    note.title.toLowerCase().includes(normalizedQuery) ||
    note.body.toLowerCase().includes(normalizedQuery) ||
    (note.sourceTitle?.toLowerCase().includes(normalizedQuery) ?? false) ||
    (note.keyQuote?.toLowerCase().includes(normalizedQuery) ?? false) ||
    (note.argumentSlot?.toLowerCase().includes(normalizedQuery) ?? false) ||
    literatureNoteKindLabels[note.noteKind]
      .toLowerCase()
      .includes(normalizedQuery) ||
    themes.some((theme) => theme.toLowerCase().includes(normalizedQuery))
  );
}

export function ResearchLiteraturePage() {
  const { projectId } = useParams();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<LiteratureTab>("queue");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceTypeFilter, setSourceTypeFilter] =
    useState<SourceTypeFilter>("all");
  const [noteSearchTerm, setNoteSearchTerm] = useState("");
  const [noteKindFilter, setNoteKindFilter] =
    useState<NoteKindFilter>("all");
  const [noteSourceFilter, setNoteSourceFilter] =
    useState<LinkedSourceFilter>("all");
  const [noteThemeFilter, setNoteThemeFilter] = useState<ThemeFilter>("all");
  const [notePinnedOnly, setNotePinnedOnly] = useState(false);
  const [synthesisSearchTerm, setSynthesisSearchTerm] = useState("");
  const [synthesisStatusFilter, setSynthesisStatusFilter] =
    useState<SynthesisStatusFilter>("all");
  const [synthesisThemeFilter, setSynthesisThemeFilter] =
    useState<ThemeFilter>("all");
  const [synthesisPinnedOnly, setSynthesisPinnedOnly] = useState(false);
  const [mindMapSearchTerm, setMindMapSearchTerm] = useState("");
  const [mindMapNodeTypeFilter, setMindMapNodeTypeFilter] =
    useState<MindMapNodeTypeFilter>("all");
  const [mindMapPinnedOnly, setMindMapPinnedOnly] = useState(false);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] =
    useState<ResearchLiteratureSource | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] =
    useState<ResearchLiteratureNote | null>(null);
  const [isMapNodeModalOpen, setIsMapNodeModalOpen] = useState(false);
  const [editingMapNode, setEditingMapNode] =
    useState<ResearchMindMapNode | null>(null);
  const [isSynthesisSectionModalOpen, setIsSynthesisSectionModalOpen] =
    useState(false);
  const [editingSynthesisSection, setEditingSynthesisSection] =
    useState<ResearchSynthesisSection | null>(null);
  const mindMapBoardRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [workspaceMessage, setWorkspaceMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { projects } = useResearchProjects();
  const {
    sources: allSources,
    getSourcesForProject,
    createSource,
    updateSource,
    togglePinnedSource,
    deleteSource,
    mergeSources,
    refreshSources,
  } = useResearchLiterature();
  const {
    notes: allNotes,
    getNotesForProject,
    createNote,
    updateNote,
    togglePinnedNote,
    deleteNote,
    mergeNotes,
    refreshNotes,
  } = useResearchLiteratureNotes();
  const {
    readingNotes: allReadingNotes,
    getReadingNotesForProject,
    upsertReadingNote,
    mergeReadingNotes,
    refreshReadingNotes,
  } = useResearchLiteratureReadingNotes();
  const {
    nodes: allMapNodes,
    getNodesForProject,
    createNode,
    updateNode,
    updateNodePosition,
    togglePinnedNode,
    deleteNode,
    mergeNodes,
    refreshNodes,
  } = useResearchMindMap();
  const {
    sections: allSynthesisSections,
    getSectionsForProject,
    createSection,
    updateSection,
    togglePinnedSection,
    deleteSection,
    mergeSections,
    refreshSections,
  } = useResearchSynthesis();
  const {
    records: allPrismaRecords,
    criteria: allPrismaCriteria,
    getRecordsForProject,
    getCriteriaForProject,
    createPrismaRecord,
    updatePrismaRecord,
    deletePrismaRecord,
    upsertCriteria,
    mergePrismaRecords,
    mergePrismaCriteria,
    refreshPrisma,
  } = useResearchPrisma();

  useEffect(() => {
    refreshSources();
    refreshNotes();
    refreshReadingNotes();
    refreshNodes();
    refreshSections();
    refreshPrisma();
  // Refresh localStorage-backed literature workspace data only on route transitions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const project = projects.find((item) => item.id === projectId);

  if (!project || !projectId) {
    return (
      <section className="research-page page-stack">
        <div className="research-hero-panel">
          <div>
            <p className="eyebrow">Research</p>
            <h1>Project not found.</h1>
            <p>Go back to the Research page and choose a project.</p>
          </div>

          <Link className="research-secondary-link" to="/research">
            ← Back to Research
          </Link>
        </div>
      </section>
    );
  }

  const currentProject = project;
  const currentProjectId = projectId;
  const sources = getSourcesForProject(currentProjectId);
  const notes = getNotesForProject(currentProjectId);
  const readingNotes = getReadingNotesForProject(currentProjectId);
  const mapNodes = getNodesForProject(currentProjectId);
  const synthesisSections = getSectionsForProject(currentProjectId);
  const prismaRecords = getRecordsForProject(currentProjectId);
  const prismaCriteria = getCriteriaForProject(currentProjectId);
  const filteredSources = sources.filter((source) => {
    const matchesStatus =
      statusFilter === "all" || source.status === statusFilter;

    const matchesSourceType =
      sourceTypeFilter === "all" || source.sourceType === sourceTypeFilter;

    return (
      matchesStatus &&
      matchesSourceType &&
      sourceMatchesSearch(source, searchTerm)
    );
  });

  const pinnedSources = sources.filter((source) => source.pinned);
  const pinnedNotes = notes.filter((note) => note.pinned);
  const pinnedMapNodes = mapNodes.filter((node) => node.pinned);
  const pinnedSynthesisSections = synthesisSections.filter(
    (section) => section.pinned
  );
  const citedSources = sources.filter((source) => source.status === "cited");
  const readSources = sources.filter((source) =>
    ["read", "notes-taken", "cited"].includes(source.status)
  );
  const unreadSources = sources.filter((source) => source.status === "unread");

  const allThemes = Array.from(
    new Set([
      ...sources.flatMap((source) => getSourceThemes(source)),
      ...notes.flatMap((note) => getNoteThemes(note)),
      ...readingNotes.flatMap((note) => [
        ...note.extractedThemes,
        ...note.manualThemes,
      ]),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const themeSummaries = allThemes.map((theme) => {
    const themeSources = sources.filter((source) =>
      getSourceThemes(source).includes(theme)
    );
    const themeNotes = notes.filter((note) => getNoteThemes(note).includes(theme));
    const themeReadingNotes = readingNotes.filter((note) =>
      [...note.extractedThemes, ...note.manualThemes].includes(theme)
    );

    return {
      theme,
      sources: themeSources,
      notes: themeNotes,
      readCount: themeSources.filter((source) =>
        ["read", "notes-taken", "cited"].includes(source.status)
      ).length,
      citedCount: themeSources.filter((source) => source.status === "cited")
        .length,
      quoteCount: themeSources.filter((source) => source.keyQuote).length,
      noteCount: themeSources.filter((source) => source.notes).length,
      sourceNoteCount: themeNotes.length + themeReadingNotes.length,
    };
  });
  const synthesisThemeOptions = Array.from(
    new Set([
      ...allThemes,
      ...synthesisSections.flatMap((section) => getSectionThemes(section)),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = noteMatchesSearch(note, noteSearchTerm);
    const matchesKind =
      noteKindFilter === "all" || note.noteKind === noteKindFilter;
    const matchesSource =
      noteSourceFilter === "all" ||
      (noteSourceFilter === "none" && !note.sourceId) ||
      note.sourceId === noteSourceFilter;
    const matchesTheme =
      noteThemeFilter === "all" || getNoteThemes(note).includes(noteThemeFilter);
    const matchesPinned = !notePinnedOnly || note.pinned;

    return (
      matchesSearch &&
      matchesKind &&
      matchesSource &&
      matchesTheme &&
      matchesPinned
    );
  });

  const filteredSynthesisSections = synthesisSections.filter((section) => {
    const normalizedQuery = synthesisSearchTerm.trim().toLowerCase();
    const linkedSources = section.linkedSourceIds
      .map((sourceId) => sources.find((source) => source.id === sourceId))
      .filter(Boolean) as ResearchLiteratureSource[];
    const linkedNotes = section.linkedNoteIds
      .map((noteId) => notes.find((note) => note.id === noteId))
      .filter(Boolean) as ResearchLiteratureNote[];
    const matchesSearch =
      !normalizedQuery ||
      section.title.toLowerCase().includes(normalizedQuery) ||
      section.claim.toLowerCase().includes(normalizedQuery) ||
      (section.draftNote?.toLowerCase().includes(normalizedQuery) ?? false) ||
      getSectionThemes(section).some((theme) =>
        theme.toLowerCase().includes(normalizedQuery)
      ) ||
      linkedSources.some((source) =>
        source.title.toLowerCase().includes(normalizedQuery)
      ) ||
      linkedNotes.some((note) =>
        note.title.toLowerCase().includes(normalizedQuery)
      );
    const matchesStatus =
      synthesisStatusFilter === "all" ||
      section.status === synthesisStatusFilter;
    const matchesTheme =
      synthesisThemeFilter === "all" ||
      getSectionThemes(section).includes(synthesisThemeFilter);
    const matchesPinned = !synthesisPinnedOnly || section.pinned;

    return matchesSearch && matchesStatus && matchesTheme && matchesPinned;
  });

  const filteredMapThemeSummaries = themeSummaries.filter((summary) => {
    const normalizedQuery = mindMapSearchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedQuery || summary.theme.toLowerCase().includes(normalizedQuery);
    const matchesType =
      mindMapNodeTypeFilter === "all" || mindMapNodeTypeFilter === "theme";

    return matchesSearch && matchesType && !mindMapPinnedOnly;
  });

  const filteredMapNodes = mapNodes.filter((node) => {
    const normalizedQuery = mindMapSearchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedQuery ||
      node.title.toLowerCase().includes(normalizedQuery) ||
      (node.body?.toLowerCase().includes(normalizedQuery) ?? false) ||
      (node.sourceTitle?.toLowerCase().includes(normalizedQuery) ?? false) ||
      (node.noteTitle?.toLowerCase().includes(normalizedQuery) ?? false) ||
      (node.synthesisSectionTitle
        ?.toLowerCase()
        .includes(normalizedQuery) ??
        false) ||
      (node.relatedThemes ?? []).some((theme) =>
        theme.toLowerCase().includes(normalizedQuery)
      ) ||
      mindMapNodeTypeLabels[node.nodeType]
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesType =
      mindMapNodeTypeFilter === "all" ||
      node.nodeType === mindMapNodeTypeFilter;
    const matchesPinned = !mindMapPinnedOnly || node.pinned;

    return matchesSearch && matchesType && matchesPinned;
  });

  function openNewSourceModal() {
    setEditingSource(null);
    setIsSourceModalOpen(true);
  }

  function openEditSourceModal(source: ResearchLiteratureSource) {
    setEditingSource(source);
    setIsSourceModalOpen(true);
  }

  function closeSourceModal() {
    setEditingSource(null);
    setIsSourceModalOpen(false);
  }

  function openNewNoteModal() {
    setEditingNote(null);
    setIsNoteModalOpen(true);
  }

  function openEditNoteModal(note: ResearchLiteratureNote) {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  }

  function closeNoteModal() {
    setEditingNote(null);
    setIsNoteModalOpen(false);
  }

  function openNewMapNodeModal() {
    setEditingMapNode(null);
    setIsMapNodeModalOpen(true);
  }

  function openEditMapNodeModal(node: ResearchMindMapNode) {
    setEditingMapNode(node);
    setIsMapNodeModalOpen(true);
  }

  function closeMapNodeModal() {
    setEditingMapNode(null);
    setIsMapNodeModalOpen(false);
  }

  function openNewSynthesisSectionModal() {
    setEditingSynthesisSection(null);
    setIsSynthesisSectionModalOpen(true);
  }

  function openEditSynthesisSectionModal(section: ResearchSynthesisSection) {
    setEditingSynthesisSection(section);
    setIsSynthesisSectionModalOpen(true);
  }

  function closeSynthesisSectionModal() {
    setEditingSynthesisSection(null);
    setIsSynthesisSectionModalOpen(false);
  }

  function handleSaveSource(input: ResearchLiteratureSourceInput) {
    if (editingSource) {
      updateSource(editingSource.id, input);
      return;
    }

    createSource(input);
  }

  function handleImportReferenceSources(
    importedSources: ResearchLiteratureSourceInput[],
    skippedDuplicateCount: number,
    failedParseCount: number
  ) {
    importedSources.forEach((source) => createSource(source));

    setWorkspaceMessage({
      type: importedSources.length > 0 ? "success" : "error",
      text: `Imported ${importedSources.length} sources. Skipped ${skippedDuplicateCount} duplicates. Could not parse ${failedParseCount} records.`,
    });
  }

  function handleSaveNote(input: ResearchLiteratureNoteInput) {
    if (editingNote) {
      updateNote(editingNote.id, input);
      return;
    }

    createNote(input);
  }

  function handleSaveMapNode(input: ResearchMindMapNodeInput) {
    if (editingMapNode) {
      updateNode(editingMapNode.id, input);
      return;
    }

    createNode(input);
  }

  function mindMapNodeAlreadyExists(input: ResearchMindMapNodeInput) {
    return mapNodes.some(
      (node) =>
        node.nodeType === input.nodeType &&
        normalizeComparable(node.title) === normalizeComparable(input.title) &&
        normalizeComparable(node.sourceId) ===
          normalizeComparable(input.sourceId) &&
        normalizeComparable(node.noteId) === normalizeComparable(input.noteId) &&
        normalizeComparable(node.synthesisSectionId) ===
          normalizeComparable(input.synthesisSectionId)
    );
  }

  function sendToMindMap(input: ResearchMindMapNodeInput) {
    const normalizedInput = {
      ...input,
      relatedThemes: dedupeThemes(input.relatedThemes ?? []),
    };

    if (mindMapNodeAlreadyExists(normalizedInput)) {
      setWorkspaceMessage({
        type: "success",
        text: "That item is already on the mind map.",
      });
      setActiveTab("mindmap");
      return;
    }

    createNode(normalizedInput);
    setWorkspaceMessage({
      type: "success",
      text: "Sent item to the mind map.",
    });
    setActiveTab("mindmap");
  }

  function sendSourceToMindMap(source: ResearchLiteratureSource) {
    sendToMindMap({
      projectId: currentProjectId,
      nodeType: "source",
      title: source.title,
      body: [
        [source.authors, source.year].filter(Boolean).join(" · "),
        source.keyQuote ? `Key quote: ${source.keyQuote}` : "",
        source.notes,
      ]
        .filter(Boolean)
        .join("\n\n"),
      sourceId: source.id,
      sourceTitle: source.title,
      relatedThemes: getSourceThemes(source),
      pinned: false,
    });
  }

  function sendNoteToMindMap(note: ResearchLiteratureNote) {
    sendToMindMap({
      projectId: currentProjectId,
      nodeType: mapNoteKindToNodeType(note.noteKind),
      title: note.title,
      body: [note.keyQuote ? `Key quote: ${note.keyQuote}` : "", note.body]
        .filter(Boolean)
        .join("\n\n"),
      sourceId: note.sourceId,
      sourceTitle: note.sourceTitle,
      noteId: note.id,
      noteTitle: note.title,
      relatedThemes: getNoteThemes(note),
      pinned: false,
    });
  }

  function sendReadingNoteToMindMap(note: ResearchLiteratureReadingNote) {
    sendToMindMap({
      projectId: currentProjectId,
      nodeType: "note",
      title: `Reading notes: ${note.sourceTitle}`,
      body: formatReadingNoteBody(note),
      sourceId: note.sourceId,
      sourceTitle: note.sourceTitle,
      noteId: note.id,
      noteTitle: `Reading notes: ${note.sourceTitle}`,
      relatedThemes: [...note.extractedThemes, ...note.manualThemes],
      pinned: false,
    });
  }

  function sendThemeToMindMap(themeOrSummary: string | LiteratureThemeSummary) {
    const summary =
      typeof themeOrSummary === "string"
        ? themeSummaries.find((item) => item.theme === themeOrSummary)
        : themeOrSummary;
    const theme =
      typeof themeOrSummary === "string" ? themeOrSummary : themeOrSummary.theme;

    sendToMindMap({
      projectId: currentProjectId,
      nodeType: "theme",
      title: theme,
      body: summary
        ? `${summary.sources.length} sources · ${summary.readCount} read · ${summary.citedCount} cited · ${summary.sourceNoteCount} source notes`
        : "Theme from reading notes.",
      relatedThemes: [theme],
      pinned: false,
    });
  }

  function sendSynthesisSectionToMindMap(section: ResearchSynthesisSection) {
    sendToMindMap({
      projectId: currentProjectId,
      nodeType: "argument",
      title: section.title,
      body: [section.claim, section.draftNote].filter(Boolean).join("\n\n"),
      synthesisSectionId: section.id,
      synthesisSectionTitle: section.title,
      relatedThemes: getSectionThemes(section),
      pinned: section.pinned,
    });
  }

  function handleSaveSynthesisSection(input: ResearchSynthesisSectionInput) {
    if (editingSynthesisSection) {
      updateSection(editingSynthesisSection.id, input);
      return;
    }

    createSection(input);
  }

  function handleExportWorkspace() {
    const exportedAt = new Date().toISOString();
    const filenameBase = slugifyFilename(currentProject.shortName || currentProject.title);

    downloadJson(`${filenameBase || "literature-workspace"}-${currentProjectId}.json`, {
      exportedAt,
      projectId: currentProjectId,
      projectTitle: currentProject.title,
      sources,
      notes,
      readingNotes,
      mindMapNodes: mapNodes,
      synthesisSections,
      prismaRecords,
      prismaCriteria,
    });

    setWorkspaceMessage({
      type: "success",
      text: `Exported ${sources.length} sources, ${notes.length} source notes, ${readingNotes.length} reading lab notes, ${mapNodes.length} map nodes, and ${synthesisSections.length} outline sections.`,
    });
  }

  function buildLiteratureWritingPacketOptions() {
    return {
      projectTitle: currentProject.title,
      exportedAt: new Date().toISOString(),
      sources,
      notes,
      readingNotes,
      themes: allThemes,
      synthesisSections,
      mindMapNodes: mapNodes,
      prismaRecords,
      prismaCriteria,
    };
  }

  function handleExportLiteratureReviewMarkdown() {
    const filenameBase = slugifyFilename(
      currentProject.shortName || currentProject.title
    );

    downloadTextFile(
      `${filenameBase || "literature-review"}-literature-review.md`,
      buildLiteratureReviewMarkdown(buildLiteratureWritingPacketOptions()),
      "text/markdown"
    );

    setWorkspaceMessage({
      type: "success",
      text: "Exported literature review Markdown packet.",
    });
  }

  function handleExportLiteratureReviewWord() {
    const filenameBase = slugifyFilename(
      currentProject.shortName || currentProject.title
    );

    downloadTextFile(
      `${filenameBase || "literature-review"}-literature-review.doc`,
      buildLiteratureReviewHtml(buildLiteratureWritingPacketOptions()),
      "application/msword"
    );

    setWorkspaceMessage({
      type: "success",
      text: "Exported Word-compatible literature review packet.",
    });
  }

  function handlePrintLiteratureReviewPacket() {
    const blob = new Blob(
      [buildLiteratureReviewHtml(buildLiteratureWritingPacketOptions())],
      { type: "text/html" }
    );
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!printWindow) {
      URL.revokeObjectURL(url);
      setWorkspaceMessage({
        type: "error",
        text: "Could not open the printable literature review packet.",
      });
      return;
    }

    setWorkspaceMessage({
      type: "success",
      text: "Opened printable literature review packet.",
    });
  }

  function handleExportMindMapMarkdown() {
    const filenameBase = slugifyFilename(
      currentProject.shortName || currentProject.title
    );
    const nodeTypes = Object.keys(
      mindMapNodeTypeLabels
    ) as ResearchMindMapNodeType[];
    const manualNodeSections = nodeTypes
      .map((nodeType) => {
        const nodesForType = mapNodes.filter((node) => node.nodeType === nodeType);

        if (nodesForType.length === 0) {
          return "";
        }

        return [
          `## ${mindMapNodeTypeLabels[nodeType]} Nodes`,
          nodesForType
            .map((node) => {
              const linkedItems = [
                node.sourceTitle ? `Source: ${node.sourceTitle}` : "",
                node.noteTitle ? `Note: ${node.noteTitle}` : "",
                node.synthesisSectionTitle
                  ? `Synthesis: ${node.synthesisSectionTitle}`
                  : "",
                node.relatedThemes?.length
                  ? `Themes: ${node.relatedThemes.join(", ")}`
                  : "",
              ].filter(Boolean);

              return [
                `- ${node.title}${node.pinned ? " (pinned)" : ""}`,
                linkedItems.length > 0 ? `  - ${linkedItems.join(" · ")}` : "",
                node.body ? `  - ${node.body.replace(/\n/g, "\n    ")}` : "",
              ]
                .filter(Boolean)
                .join("\n");
            })
            .join("\n"),
        ].join("\n\n");
      })
      .filter(Boolean);

    const markdown = [
      `# ${currentProject.title} Mind Map`,
      `Exported: ${new Date().toISOString()}`,
      "## Generated Theme Nodes",
      themeSummaries.length > 0
        ? themeSummaries
            .map(
              (summary) =>
                `- ${summary.theme}: ${summary.sources.length} sources, ${summary.sourceNoteCount} source notes, ${summary.citedCount} cited`
            )
            .join("\n")
        : "_No generated theme nodes yet._",
      manualNodeSections.length > 0
        ? manualNodeSections.join("\n\n")
        : "## Manual Nodes\n\n_No manual mind map nodes yet._",
    ].join("\n\n");

    downloadTextFile(
      `${filenameBase || "literature"}-mind-map.md`,
      markdown,
      "text/markdown"
    );

    setWorkspaceMessage({
      type: "success",
      text: "Exported mind map Markdown.",
    });
  }

  async function handleImportWorkspace(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const normalized = normalizeImportedWorkspace(parsed, {
        currentProjectId,
        allSources,
        allNotes,
        allReadingNotes,
        allMapNodes,
        allSynthesisSections,
        allPrismaRecords,
        allPrismaCriteria,
        sources,
        notes,
        readingNotes,
        mapNodes,
        synthesisSections,
        prismaRecords,
        prismaCriteria,
      });

      mergeSources(normalized.sources);
      mergeNotes(normalized.notes);
      mergeReadingNotes(normalized.readingNotes);
      mergeNodes(normalized.mindMapNodes);
      mergeSections(normalized.synthesisSections);
      mergePrismaRecords(normalized.prismaRecords);
      mergePrismaCriteria(normalized.prismaCriteria);

      const importedCount =
        normalized.sources.length +
        normalized.notes.length +
        normalized.readingNotes.length +
        normalized.mindMapNodes.length +
        normalized.synthesisSections.length +
        normalized.prismaRecords.length +
        normalized.prismaCriteria.length;

      setWorkspaceMessage({
        type: "success",
        text: `Imported ${importedCount} new records. Skipped ${normalized.skippedDuplicateCount} duplicates.`,
      });
    } catch (error) {
      setWorkspaceMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not import this literature workspace file.",
      });
    }
  }

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setSourceTypeFilter("all");
  }

  function resetNoteFilters() {
    setNoteSearchTerm("");
    setNoteKindFilter("all");
    setNoteSourceFilter("all");
    setNoteThemeFilter("all");
    setNotePinnedOnly(false);
  }

  function resetSynthesisFilters() {
    setSynthesisSearchTerm("");
    setSynthesisStatusFilter("all");
    setSynthesisThemeFilter("all");
    setSynthesisPinnedOnly(false);
  }

  function resetMindMapFilters() {
    setMindMapSearchTerm("");
    setMindMapNodeTypeFilter("all");
    setMindMapPinnedOnly(false);
  }

  function getDefaultMapNodePosition(index: number) {
    return {
      x: 24 + (index % 3) * 320,
      y: 190 + Math.floor(index / 3) * 220,
    };
  }

  function getMapNodePosition(node: ResearchMindMapNode, index: number) {
    const fallback = getDefaultMapNodePosition(index);

    return {
      x: node.x ?? fallback.x,
      y: node.y ?? fallback.y,
    };
  }

  function resetMindMapLayout() {
    mapNodes.forEach((node, index) => {
      const position = getDefaultMapNodePosition(index);
      updateNodePosition(node.id, position.x, position.y);
    });
  }

  function handleMapNodePointerDown(
    event: PointerEvent<HTMLElement>,
    node: ResearchMindMapNode,
    index: number
  ) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea")) {
      return;
    }

    const boardRect = mindMapBoardRef.current?.getBoundingClientRect();
    if (!boardRect) {
      return;
    }

    const position = getMapNodePosition(node, index);
    dragStateRef.current = {
      nodeId: node.id,
      offsetX: event.clientX - boardRect.left - position.x,
      offsetY: event.clientY - boardRect.top - position.y,
    };
    setDraggingNodeId(node.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleMapNodePointerMove(event: PointerEvent<HTMLElement>) {
    const dragState = dragStateRef.current;
    const boardRect = mindMapBoardRef.current?.getBoundingClientRect();

    if (!dragState || !boardRect) {
      return;
    }

    const nextX = Math.min(
      Math.max(event.clientX - boardRect.left - dragState.offsetX, 0),
      Math.max(boardRect.width - 300, 0)
    );
    const nextY = Math.min(
      Math.max(event.clientY - boardRect.top - dragState.offsetY, 0),
      Math.max(boardRect.height - 180, 0)
    );

    updateNodePosition(dragState.nodeId, Math.round(nextX), Math.round(nextY));
  }

  function handleMapNodePointerUp(event: PointerEvent<HTMLElement>) {
    dragStateRef.current = null;
    setDraggingNodeId(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function viewThemeSources(theme: string) {
    setSearchTerm(theme);
    setStatusFilter("all");
    setSourceTypeFilter("all");
    setActiveTab("queue");
  }

  function viewThemeNotes(theme: string) {
    resetNoteFilters();
    setNoteThemeFilter(theme);
    setActiveTab("notes");
  }

  function viewThemeSynthesis(theme: string) {
    resetSynthesisFilters();
    setSynthesisThemeFilter(theme);
    setActiveTab("synthesis");
  }

  function viewThemeMap(theme: string) {
    resetMindMapFilters();
    setMindMapSearchTerm(theme);
    setActiveTab("mindmap");
  }

  return (
    <section className="research-page page-stack">
      <div className="research-hero-panel">
        <div>
          <Link className="research-secondary-link" to={`/research/${currentProjectId}`}>
            ← Back to {currentProject.shortName}
          </Link>

          <p className="eyebrow">{currentProject.shortName}</p>
          <h1>Literature Workspace</h1>
          <p>
            Reading queue, themes, synthesis notes, and a literature mind map in
            one place. This is where sources become an argument.
          </p>
        </div>

        <LiteratureImportExportControls
          onAddSource={openNewSourceModal}
          onExportWorkspace={handleExportWorkspace}
          onImportWorkspace={handleImportWorkspace}
          onExportReviewMarkdown={handleExportLiteratureReviewMarkdown}
          onExportReviewWord={handleExportLiteratureReviewWord}
          onPrintReviewPacket={handlePrintLiteratureReviewPacket}
        />
      </div>

      <ResearchProjectSubnav projectId={currentProjectId} />

      {workspaceMessage ? (
        <div
          className={`research-workspace-message research-workspace-message--${workspaceMessage.type}`}
        >
          {workspaceMessage.text}
        </div>
      ) : null}

      <div className="research-task-summary">
        <span>{sources.length} sources</span>
        <span>{readSources.length} read</span>
        <span>{unreadSources.length} unread</span>
        <span>{citedSources.length} cited</span>
        <span>{pinnedSources.length} pinned</span>
        <span>{notes.length} source notes</span>
        <span>{pinnedNotes.length} pinned notes</span>
        <span>{mapNodes.length} map nodes</span>
        <span>{pinnedMapNodes.length} pinned map nodes</span>
        <span>{synthesisSections.length} outline sections</span>
        <span>{pinnedSynthesisSections.length} pinned sections</span>
        <span>{allThemes.length} themes</span>
      </div>

      <LiteratureWorkspaceTabs
        activeTab={activeTab}
        projectId={currentProjectId}
        sources={sources}
        filteredSources={filteredSources}
        notes={notes}
        filteredNotes={filteredNotes}
        readingNotes={readingNotes}
        allThemes={allThemes}
        themeSummaries={themeSummaries}
        synthesisSections={synthesisSections}
        filteredSynthesisSections={filteredSynthesisSections}
        synthesisThemeOptions={synthesisThemeOptions}
        mapNodes={mapNodes}
        filteredMapNodes={filteredMapNodes}
        filteredMapThemeSummaries={filteredMapThemeSummaries}
        prismaRecords={prismaRecords}
        prismaCriteria={prismaCriteria}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        sourceTypeFilter={sourceTypeFilter}
        noteSearchTerm={noteSearchTerm}
        noteKindFilter={noteKindFilter}
        noteSourceFilter={noteSourceFilter}
        noteThemeFilter={noteThemeFilter}
        notePinnedOnly={notePinnedOnly}
        synthesisSearchTerm={synthesisSearchTerm}
        synthesisStatusFilter={synthesisStatusFilter}
        synthesisThemeFilter={synthesisThemeFilter}
        synthesisPinnedOnly={synthesisPinnedOnly}
        mindMapSearchTerm={mindMapSearchTerm}
        mindMapNodeTypeFilter={mindMapNodeTypeFilter}
        mindMapPinnedOnly={mindMapPinnedOnly}
        mindMapBoardRef={mindMapBoardRef}
        draggingNodeId={draggingNodeId}
        onActiveTabChange={setActiveTab}
        onNewNote={openNewNoteModal}
        onNewMapNode={openNewMapNodeModal}
        onNewSynthesisSection={openNewSynthesisSectionModal}
        onResetMindMapLayout={resetMindMapLayout}
        onSaveReadingNote={upsertReadingNote}
        onSearchTermChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onSourceTypeFilterChange={setSourceTypeFilter}
        onResetFilters={resetFilters}
        onTogglePinnedSource={togglePinnedSource}
        onEditSource={openEditSourceModal}
        onDeleteSource={deleteSource}
        onSendSourceToMindMap={sendSourceToMindMap}
        onCreatePrismaRecord={createPrismaRecord}
        onUpdatePrismaRecord={updatePrismaRecord}
        onDeletePrismaRecord={deletePrismaRecord}
        onSavePrismaCriteria={upsertCriteria}
        onImportReferenceSources={handleImportReferenceSources}
        onNoteSearchTermChange={setNoteSearchTerm}
        onNoteKindFilterChange={setNoteKindFilter}
        onNoteSourceFilterChange={setNoteSourceFilter}
        onNoteThemeFilterChange={setNoteThemeFilter}
        onNotePinnedOnlyChange={setNotePinnedOnly}
        onResetNoteFilters={resetNoteFilters}
        onTogglePinnedNote={togglePinnedNote}
        onEditNote={openEditNoteModal}
        onDeleteNote={deleteNote}
        onSendNoteToMindMap={sendNoteToMindMap}
        onSendReadingNoteToMindMap={sendReadingNoteToMindMap}
        onSendThemeToMindMap={sendThemeToMindMap}
        onViewThemeSources={viewThemeSources}
        onViewThemeNotes={viewThemeNotes}
        onViewThemeSynthesis={viewThemeSynthesis}
        onViewThemeMap={viewThemeMap}
        onSynthesisSearchTermChange={setSynthesisSearchTerm}
        onSynthesisStatusFilterChange={setSynthesisStatusFilter}
        onSynthesisThemeFilterChange={setSynthesisThemeFilter}
        onSynthesisPinnedOnlyChange={setSynthesisPinnedOnly}
        onResetSynthesisFilters={resetSynthesisFilters}
        onTogglePinnedSection={togglePinnedSection}
        onEditSection={openEditSynthesisSectionModal}
        onDeleteSection={deleteSection}
        onSendSectionToMindMap={sendSynthesisSectionToMindMap}
        onExportMindMapMarkdown={handleExportMindMapMarkdown}
        onMindMapSearchTermChange={setMindMapSearchTerm}
        onMindMapNodeTypeFilterChange={setMindMapNodeTypeFilter}
        onMindMapPinnedOnlyChange={setMindMapPinnedOnly}
        onResetMindMapFilters={resetMindMapFilters}
        onTogglePinnedNode={togglePinnedNode}
        onEditNode={openEditMapNodeModal}
        onDeleteNode={deleteNode}
        getMapNodePosition={getMapNodePosition}
        onMapNodePointerDown={handleMapNodePointerDown}
        onMapNodePointerMove={handleMapNodePointerMove}
        onMapNodePointerUp={handleMapNodePointerUp}
      />

      {isSourceModalOpen ? (
        <ResearchLiteratureModal
          projectId={currentProjectId}
          source={editingSource ?? undefined}
          onClose={closeSourceModal}
          onSaveSource={handleSaveSource}
        />
      ) : null}

      {isNoteModalOpen ? (
        <ResearchLiteratureNoteModal
          projectId={currentProjectId}
          note={editingNote ?? undefined}
          sources={sources}
          onClose={closeNoteModal}
          onSaveNote={handleSaveNote}
        />
      ) : null}

      {isMapNodeModalOpen ? (
        <ResearchMindMapNodeModal
          projectId={currentProjectId}
          node={editingMapNode ?? undefined}
          sources={sources}
          notes={notes}
          synthesisSections={synthesisSections}
          onClose={closeMapNodeModal}
          onSaveNode={handleSaveMapNode}
        />
      ) : null}

      {isSynthesisSectionModalOpen ? (
        <ResearchSynthesisSectionModal
          projectId={currentProjectId}
          section={editingSynthesisSection ?? undefined}
          sources={sources}
          notes={notes}
          onClose={closeSynthesisSectionModal}
          onSaveSection={handleSaveSynthesisSection}
        />
      ) : null}
    </section>
  );
}
