import type { PointerEvent, RefObject } from "react";
import type {
  ResearchLiteratureNote,
  ResearchLiteratureNoteKind,
  ResearchLiteratureReadingNote,
  ResearchLiteratureReadingNoteInput,
  ResearchLiteratureSource,
  ResearchLiteratureSourceInput,
  ResearchLiteratureSourceType,
  ResearchLiteratureStatus,
  ResearchMindMapNode,
  ResearchMindMapNodeType,
  ResearchPrismaCriteria,
  ResearchPrismaRecord,
  ResearchPrismaRecordInput,
  ResearchSynthesisSection,
  ResearchSynthesisSectionStatus,
} from "../../types";
import { LiteratureMindMapPanel } from "./LiteratureMindMapPanel";
import { LiteraturePrismaPanel } from "./LiteraturePrismaPanel";
import { LiteratureReadingQueuePanel } from "./LiteratureReadingQueuePanel";
import { LiteratureSourceNotesPanel } from "./LiteratureSourceNotesPanel";
import { LiteratureSynthesisPanel } from "./LiteratureSynthesisPanel";
import {
  LiteratureThemesPanel,
  type LiteratureThemeSummary,
} from "./LiteratureThemesPanel";

export type LiteratureTab =
  | "queue"
  | "notes"
  | "themes"
  | "synthesis"
  | "mindmap"
  | "prisma";

type SourceTypeFilter = "all" | ResearchLiteratureSourceType;
type StatusFilter = "all" | ResearchLiteratureStatus;
type NoteKindFilter = "all" | ResearchLiteratureNoteKind;
type MindMapNodeTypeFilter = "all" | ResearchMindMapNodeType;
type SynthesisStatusFilter = "all" | ResearchSynthesisSectionStatus;

type LiteratureWorkspaceTabsProps = {
  activeTab: LiteratureTab;
  projectId: string;
  sources: ResearchLiteratureSource[];
  filteredSources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  filteredNotes: ResearchLiteratureNote[];
  readingNotes: ResearchLiteratureReadingNote[];
  allThemes: string[];
  themeSummaries: LiteratureThemeSummary[];
  synthesisSections: ResearchSynthesisSection[];
  filteredSynthesisSections: ResearchSynthesisSection[];
  synthesisThemeOptions: string[];
  mapNodes: ResearchMindMapNode[];
  filteredMapNodes: ResearchMindMapNode[];
  filteredMapThemeSummaries: LiteratureThemeSummary[];
  prismaRecords: ResearchPrismaRecord[];
  prismaCriteria: ResearchPrismaCriteria;
  searchTerm: string;
  statusFilter: StatusFilter;
  sourceTypeFilter: SourceTypeFilter;
  noteSearchTerm: string;
  noteKindFilter: NoteKindFilter;
  noteSourceFilter: string;
  noteThemeFilter: string;
  notePinnedOnly: boolean;
  synthesisSearchTerm: string;
  synthesisStatusFilter: SynthesisStatusFilter;
  synthesisThemeFilter: string;
  synthesisPinnedOnly: boolean;
  mindMapSearchTerm: string;
  mindMapNodeTypeFilter: MindMapNodeTypeFilter;
  mindMapPinnedOnly: boolean;
  mindMapBoardRef: RefObject<HTMLDivElement | null>;
  draggingNodeId: string | null;
  onActiveTabChange: (tab: LiteratureTab) => void;
  onNewNote: () => void;
  onNewMapNode: () => void;
  onNewSynthesisSection: () => void;
  onResetMindMapLayout: () => void;
  onSaveReadingNote: (note: ResearchLiteratureReadingNoteInput) => void;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSourceTypeFilterChange: (value: SourceTypeFilter) => void;
  onResetFilters: () => void;
  onTogglePinnedSource: (sourceId: string) => void;
  onEditSource: (source: ResearchLiteratureSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onSendSourceToMindMap: (source: ResearchLiteratureSource) => void;
  onCreatePrismaRecord: (input: ResearchPrismaRecordInput) => void;
  onUpdatePrismaRecord: (
    recordId: string,
    input: ResearchPrismaRecordInput
  ) => void;
  onDeletePrismaRecord: (recordId: string) => void;
  onSavePrismaCriteria: (
    projectId: string,
    inclusionCriteria: string[],
    exclusionCriteria: string[]
  ) => void;
  onImportReferenceSources: (
    sources: ResearchLiteratureSourceInput[],
    skippedDuplicateCount: number,
    failedParseCount: number
  ) => void;
  onNoteSearchTermChange: (value: string) => void;
  onNoteKindFilterChange: (value: NoteKindFilter) => void;
  onNoteSourceFilterChange: (value: string) => void;
  onNoteThemeFilterChange: (value: string) => void;
  onNotePinnedOnlyChange: (value: boolean) => void;
  onResetNoteFilters: () => void;
  onTogglePinnedNote: (noteId: string) => void;
  onEditNote: (note: ResearchLiteratureNote) => void;
  onDeleteNote: (noteId: string) => void;
  onSendNoteToMindMap: (note: ResearchLiteratureNote) => void;
  onSendReadingNoteToMindMap: (note: ResearchLiteratureReadingNote) => void;
  onSendThemeToMindMap: (theme: string | LiteratureThemeSummary) => void;
  onViewThemeSources: (theme: string) => void;
  onViewThemeNotes: (theme: string) => void;
  onViewThemeSynthesis: (theme: string) => void;
  onViewThemeMap: (theme: string) => void;
  onSynthesisSearchTermChange: (value: string) => void;
  onSynthesisStatusFilterChange: (value: SynthesisStatusFilter) => void;
  onSynthesisThemeFilterChange: (value: string) => void;
  onSynthesisPinnedOnlyChange: (value: boolean) => void;
  onResetSynthesisFilters: () => void;
  onTogglePinnedSection: (sectionId: string) => void;
  onEditSection: (section: ResearchSynthesisSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onSendSectionToMindMap: (section: ResearchSynthesisSection) => void;
  onExportMindMapMarkdown: () => void;
  onMindMapSearchTermChange: (value: string) => void;
  onMindMapNodeTypeFilterChange: (value: MindMapNodeTypeFilter) => void;
  onMindMapPinnedOnlyChange: (value: boolean) => void;
  onResetMindMapFilters: () => void;
  onTogglePinnedNode: (nodeId: string) => void;
  onEditNode: (node: ResearchMindMapNode) => void;
  onDeleteNode: (nodeId: string) => void;
  getMapNodePosition: (
    node: ResearchMindMapNode,
    index: number
  ) => { x: number; y: number };
  onMapNodePointerDown: (
    event: PointerEvent<HTMLElement>,
    node: ResearchMindMapNode,
    index: number
  ) => void;
  onMapNodePointerMove: (event: PointerEvent<HTMLElement>) => void;
  onMapNodePointerUp: (event: PointerEvent<HTMLElement>) => void;
};

const tabLabels: Record<LiteratureTab, string> = {
  queue: "Reading Queue",
  notes: "Source Notes",
  themes: "Themes",
  synthesis: "Synthesis",
  mindmap: "Mind Map",
  prisma: "PRISMA",
};

export function LiteratureWorkspaceTabs({
  activeTab,
  projectId,
  sources,
  filteredSources,
  notes,
  filteredNotes,
  readingNotes,
  allThemes,
  themeSummaries,
  synthesisSections,
  filteredSynthesisSections,
  synthesisThemeOptions,
  mapNodes,
  filteredMapNodes,
  filteredMapThemeSummaries,
  prismaRecords,
  prismaCriteria,
  searchTerm,
  statusFilter,
  sourceTypeFilter,
  noteSearchTerm,
  noteKindFilter,
  noteSourceFilter,
  noteThemeFilter,
  notePinnedOnly,
  synthesisSearchTerm,
  synthesisStatusFilter,
  synthesisThemeFilter,
  synthesisPinnedOnly,
  mindMapSearchTerm,
  mindMapNodeTypeFilter,
  mindMapPinnedOnly,
  mindMapBoardRef,
  draggingNodeId,
  onActiveTabChange,
  onNewNote,
  onNewMapNode,
  onNewSynthesisSection,
  onResetMindMapLayout,
  onSaveReadingNote,
  onSearchTermChange,
  onStatusFilterChange,
  onSourceTypeFilterChange,
  onResetFilters,
  onTogglePinnedSource,
  onEditSource,
  onDeleteSource,
  onSendSourceToMindMap,
  onCreatePrismaRecord,
  onUpdatePrismaRecord,
  onDeletePrismaRecord,
  onSavePrismaCriteria,
  onImportReferenceSources,
  onNoteSearchTermChange,
  onNoteKindFilterChange,
  onNoteSourceFilterChange,
  onNoteThemeFilterChange,
  onNotePinnedOnlyChange,
  onResetNoteFilters,
  onTogglePinnedNote,
  onEditNote,
  onDeleteNote,
  onSendNoteToMindMap,
  onSendReadingNoteToMindMap,
  onSendThemeToMindMap,
  onViewThemeSources,
  onViewThemeNotes,
  onViewThemeSynthesis,
  onViewThemeMap,
  onSynthesisSearchTermChange,
  onSynthesisStatusFilterChange,
  onSynthesisThemeFilterChange,
  onSynthesisPinnedOnlyChange,
  onResetSynthesisFilters,
  onTogglePinnedSection,
  onEditSection,
  onDeleteSection,
  onSendSectionToMindMap,
  onExportMindMapMarkdown,
  onMindMapSearchTermChange,
  onMindMapNodeTypeFilterChange,
  onMindMapPinnedOnlyChange,
  onResetMindMapFilters,
  onTogglePinnedNode,
  onEditNode,
  onDeleteNode,
  getMapNodePosition,
  onMapNodePointerDown,
  onMapNodePointerMove,
  onMapNodePointerUp,
}: LiteratureWorkspaceTabsProps) {
  return (
    <>
      <div className="literature-workspace-tabs" role="tablist">
        {(Object.keys(tabLabels) as LiteratureTab[]).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "is-active" : ""}
            type="button"
            onClick={() => onActiveTabChange(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === "notes" ? (
        <div className="research-tab-action-bar">
          <button
            className="research-primary-button"
            type="button"
            onClick={onNewNote}
          >
            + Add Source Note
          </button>
        </div>
      ) : null}

      {activeTab === "mindmap" ? (
        <div className="research-tab-action-bar">
          <button
            className="research-primary-button"
            type="button"
            onClick={onNewMapNode}
          >
            + Add Map Node
          </button>

          <button
            className="research-secondary-button"
            type="button"
            onClick={onResetMindMapLayout}
          >
            Reset layout
          </button>
        </div>
      ) : null}

      {activeTab === "synthesis" ? (
        <div className="research-tab-action-bar">
          <button
            className="research-primary-button"
            type="button"
            onClick={onNewSynthesisSection}
          >
            + Add Synthesis Section
          </button>
        </div>
      ) : null}

      {activeTab === "queue" ? (
        <LiteratureReadingQueuePanel
          projectId={projectId}
          sources={sources}
          filteredSources={filteredSources}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          sourceTypeFilter={sourceTypeFilter}
          onSearchTermChange={onSearchTermChange}
          onStatusFilterChange={onStatusFilterChange}
          onSourceTypeFilterChange={onSourceTypeFilterChange}
          onResetFilters={onResetFilters}
          onTogglePinnedSource={onTogglePinnedSource}
          onEditSource={onEditSource}
          onDeleteSource={onDeleteSource}
          onSendSourceToMindMap={onSendSourceToMindMap}
          onViewThemeSources={onViewThemeSources}
          onImportReferenceSources={onImportReferenceSources}
          prismaRecords={prismaRecords}
        />
      ) : null}

      {activeTab === "notes" ? (
        <LiteratureSourceNotesPanel
          projectId={projectId}
          notes={notes}
          filteredNotes={filteredNotes}
          readingNotes={readingNotes}
          sources={sources}
          allThemes={allThemes}
          noteSearchTerm={noteSearchTerm}
          noteKindFilter={noteKindFilter}
          noteSourceFilter={noteSourceFilter}
          noteThemeFilter={noteThemeFilter}
          notePinnedOnly={notePinnedOnly}
          onSaveReadingNote={onSaveReadingNote}
          onNoteSearchTermChange={onNoteSearchTermChange}
          onNoteKindFilterChange={onNoteKindFilterChange}
          onNoteSourceFilterChange={onNoteSourceFilterChange}
          onNoteThemeFilterChange={onNoteThemeFilterChange}
          onNotePinnedOnlyChange={onNotePinnedOnlyChange}
          onResetNoteFilters={onResetNoteFilters}
          onTogglePinnedNote={onTogglePinnedNote}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
          onSendNoteToMindMap={onSendNoteToMindMap}
          onSendReadingNoteToMindMap={onSendReadingNoteToMindMap}
          onSendThemeToMindMap={(theme) => onSendThemeToMindMap(theme)}
        />
      ) : null}

      {activeTab === "themes" ? (
        <LiteratureThemesPanel
          themeSummaries={themeSummaries}
          onViewThemeSources={onViewThemeSources}
          onViewThemeNotes={onViewThemeNotes}
          onViewThemeSynthesis={onViewThemeSynthesis}
          onViewThemeMap={onViewThemeMap}
          onSendThemeToMindMap={onSendThemeToMindMap}
        />
      ) : null}

      {activeTab === "synthesis" ? (
        <LiteratureSynthesisPanel
          synthesisSections={synthesisSections}
          filteredSynthesisSections={filteredSynthesisSections}
          sources={sources}
          notes={notes}
          themeSummaries={themeSummaries}
          synthesisThemeOptions={synthesisThemeOptions}
          synthesisSearchTerm={synthesisSearchTerm}
          synthesisStatusFilter={synthesisStatusFilter}
          synthesisThemeFilter={synthesisThemeFilter}
          synthesisPinnedOnly={synthesisPinnedOnly}
          onSynthesisSearchTermChange={onSynthesisSearchTermChange}
          onSynthesisStatusFilterChange={onSynthesisStatusFilterChange}
          onSynthesisThemeFilterChange={onSynthesisThemeFilterChange}
          onSynthesisPinnedOnlyChange={onSynthesisPinnedOnlyChange}
          onResetSynthesisFilters={onResetSynthesisFilters}
          onTogglePinnedSection={onTogglePinnedSection}
          onEditSection={onEditSection}
          onDeleteSection={onDeleteSection}
          onSendSectionToMindMap={onSendSectionToMindMap}
        />
      ) : null}

      {activeTab === "mindmap" ? (
        <LiteratureMindMapPanel
          themeSummaries={themeSummaries}
          filteredMapThemeSummaries={filteredMapThemeSummaries}
          mapNodes={mapNodes}
          filteredMapNodes={filteredMapNodes}
          sources={sources}
          notes={notes}
          synthesisSections={synthesisSections}
          mindMapSearchTerm={mindMapSearchTerm}
          mindMapNodeTypeFilter={mindMapNodeTypeFilter}
          mindMapPinnedOnly={mindMapPinnedOnly}
          boardRef={mindMapBoardRef}
          draggingNodeId={draggingNodeId}
          onMindMapSearchTermChange={onMindMapSearchTermChange}
          onMindMapNodeTypeFilterChange={onMindMapNodeTypeFilterChange}
          onMindMapPinnedOnlyChange={onMindMapPinnedOnlyChange}
          onResetMindMapFilters={onResetMindMapFilters}
          onTogglePinnedNode={onTogglePinnedNode}
          onEditNode={onEditNode}
          onDeleteNode={onDeleteNode}
          onExportMindMapMarkdown={onExportMindMapMarkdown}
          getMapNodePosition={getMapNodePosition}
          onMapNodePointerDown={onMapNodePointerDown}
          onMapNodePointerMove={onMapNodePointerMove}
          onMapNodePointerUp={onMapNodePointerUp}
        />
      ) : null}

      {activeTab === "prisma" ? (
        <LiteraturePrismaPanel
          projectId={projectId}
          sources={sources}
          records={prismaRecords}
          criteria={prismaCriteria}
          onCreateRecord={onCreatePrismaRecord}
          onUpdateRecord={onUpdatePrismaRecord}
          onDeleteRecord={onDeletePrismaRecord}
          onSaveCriteria={onSavePrismaCriteria}
        />
      ) : null}
    </>
  );
}
