import type { RefObject, PointerEvent } from "react";
import type {
  ResearchLiteratureNote,
  ResearchLiteratureSource,
  ResearchMindMapNode,
  ResearchMindMapNodeType,
  ResearchSynthesisSection,
} from "../../types";
import type { LiteratureThemeSummary } from "./LiteratureThemesPanel";

type MindMapNodeTypeFilter = "all" | ResearchMindMapNodeType;

type LiteratureMindMapPanelProps = {
  themeSummaries: LiteratureThemeSummary[];
  filteredMapThemeSummaries: LiteratureThemeSummary[];
  mapNodes: ResearchMindMapNode[];
  filteredMapNodes: ResearchMindMapNode[];
  sources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  synthesisSections: ResearchSynthesisSection[];
  mindMapSearchTerm: string;
  mindMapNodeTypeFilter: MindMapNodeTypeFilter;
  mindMapPinnedOnly: boolean;
  boardRef: RefObject<HTMLDivElement | null>;
  draggingNodeId: string | null;
  onMindMapSearchTermChange: (value: string) => void;
  onMindMapNodeTypeFilterChange: (value: MindMapNodeTypeFilter) => void;
  onMindMapPinnedOnlyChange: (value: boolean) => void;
  onResetMindMapFilters: () => void;
  onTogglePinnedNode: (nodeId: string) => void;
  onEditNode: (node: ResearchMindMapNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onExportMindMapMarkdown: () => void;
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

const mindMapNodeTypeLabels: Record<ResearchMindMapNodeType, string> = {
  theme: "Theme",
  source: "Source",
  note: "Source note",
  argument: "Argument",
  gap: "Gap",
  question: "Question",
};

export function LiteratureMindMapPanel({
  themeSummaries,
  filteredMapThemeSummaries,
  mapNodes,
  filteredMapNodes,
  sources,
  notes,
  synthesisSections,
  mindMapSearchTerm,
  mindMapNodeTypeFilter,
  mindMapPinnedOnly,
  boardRef,
  draggingNodeId,
  onMindMapSearchTermChange,
  onMindMapNodeTypeFilterChange,
  onMindMapPinnedOnlyChange,
  onResetMindMapFilters,
  onTogglePinnedNode,
  onEditNode,
  onDeleteNode,
  onExportMindMapMarkdown,
  getMapNodePosition,
  onMapNodePointerDown,
  onMapNodePointerMove,
  onMapNodePointerUp,
}: LiteratureMindMapPanelProps) {
  return (
    <section className="literature-panel">
      <div className="literature-panel__header">
        <div>
          <p className="literature-panel__eyebrow">Literature mind map</p>
          <h2>Theme map</h2>
          <p>
            This first version generates map nodes from your literature themes
            and lets you add manual nodes for argument structure, gaps,
            questions, sources, and source notes.
          </p>
        </div>

        <button
          className="research-secondary-button"
          type="button"
          onClick={onExportMindMapMarkdown}
          disabled={themeSummaries.length + mapNodes.length === 0}
        >
          Export Map Markdown
        </button>
      </div>

      <div className="literature-filter-panel literature-filter-panel--wide">
        <label>
          <span>Search</span>
          <input
            value={mindMapSearchTerm}
            onChange={(event) => onMindMapSearchTermChange(event.target.value)}
            placeholder="Search theme, title, body, linked item..."
          />
        </label>

        <label>
          <span>Node type</span>
          <select
            value={mindMapNodeTypeFilter}
            onChange={(event) =>
              onMindMapNodeTypeFilterChange(
                event.target.value as MindMapNodeTypeFilter
              )
            }
          >
            <option value="all">All node types</option>
            {Object.entries(mindMapNodeTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="research-checkbox-label literature-filter-checkbox">
          <input
            type="checkbox"
            checked={mindMapPinnedOnly}
            onChange={(event) => onMindMapPinnedOnlyChange(event.target.checked)}
          />
          <span>Pinned only</span>
        </label>

        <button
          className="research-chip-button"
          type="button"
          onClick={onResetMindMapFilters}
        >
          Reset
        </button>
      </div>

      <p className="literature-filter-summary">
        Showing {filteredMapThemeSummaries.length + filteredMapNodes.length} of{" "}
        {themeSummaries.length + mapNodes.length} map nodes
      </p>

      <div className="literature-mindmap-board" ref={boardRef}>
        <div className="literature-mindmap-theme-lane">
          {filteredMapThemeSummaries.map((summary) => (
            <article
              key={summary.theme}
              className="literature-mindmap-node literature-mindmap-node--theme"
            >
              <span>Theme node</span>
              <h3>{summary.theme}</h3>
              <p>
                {summary.sources.length} sources · {summary.readCount} read ·{" "}
                {summary.citedCount} cited · {summary.sourceNoteCount} source
                notes
              </p>
            </article>
          ))}
        </div>

        {filteredMapNodes.map((node, index) => {
          const linkedSource = node.sourceId
            ? sources.find((source) => source.id === node.sourceId)
            : undefined;
          const linkedNote = node.noteId
            ? notes.find((note) => note.id === node.noteId)
            : undefined;
          const linkedSourceTitle = linkedSource?.title ?? node.sourceTitle;
          const linkedNoteTitle = linkedNote?.title ?? node.noteTitle;
          const linkedSynthesisSection = node.synthesisSectionId
            ? synthesisSections.find(
                (section) => section.id === node.synthesisSectionId
              )
            : undefined;
          const linkedSynthesisSectionTitle =
            linkedSynthesisSection?.title ?? node.synthesisSectionTitle;
          const position = getMapNodePosition(node, index);

          return (
            <article
              key={node.id}
              className={`literature-mindmap-node literature-mindmap-node--manual literature-mindmap-node--${node.nodeType} ${
                draggingNodeId === node.id ? "is-dragging" : ""
              }`}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                borderColor: node.color,
              }}
              onPointerDown={(event) =>
                onMapNodePointerDown(event, node, index)
              }
              onPointerMove={onMapNodePointerMove}
              onPointerUp={onMapNodePointerUp}
              onPointerCancel={onMapNodePointerUp}
            >
              <div className="literature-mindmap-node__header">
                <span>
                  {node.pinned ? "Pinned · " : ""}
                  {mindMapNodeTypeLabels[node.nodeType]}
                </span>

                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => onTogglePinnedNode(node.id)}
                >
                  {node.pinned ? "Unpin" : "Pin"}
                </button>
              </div>

              <h3>{node.title}</h3>

              {node.body ? <p>{node.body}</p> : null}

              <div className="literature-mindmap-node__links">
                {linkedSourceTitle ? <span>{linkedSourceTitle}</span> : null}
                {linkedNoteTitle ? <span>{linkedNoteTitle}</span> : null}
                {linkedSynthesisSectionTitle ? (
                  <span>{linkedSynthesisSectionTitle}</span>
                ) : null}
                {node.relatedThemes?.map((theme) => (
                  <span key={theme}>{theme}</span>
                ))}
              </div>

              <div className="research-project-card__actions">
                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => onEditNode(node)}
                >
                  Edit
                </button>

                <button
                  className="research-chip-button research-chip-button--danger"
                  type="button"
                  onClick={() => onDeleteNode(node.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}

        {themeSummaries.length === 0 && mapNodes.length === 0 ? (
          <div className="research-empty-state">
            No map nodes yet. Add themes to sources or create a manual map node.
          </div>
        ) : null}

        {themeSummaries.length + mapNodes.length > 0 &&
        filteredMapThemeSummaries.length + filteredMapNodes.length === 0 ? (
          <div className="research-empty-state">
            No map nodes match these filters.
          </div>
        ) : null}
      </div>
    </section>
  );
}
