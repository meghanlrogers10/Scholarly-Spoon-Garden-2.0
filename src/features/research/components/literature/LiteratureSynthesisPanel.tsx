import type {
  ResearchLiteratureNote,
  ResearchLiteratureSource,
  ResearchSynthesisSection,
  ResearchSynthesisSectionStatus,
} from "../../types";
import type { LiteratureThemeSummary } from "./LiteratureThemesPanel";

type SynthesisStatusFilter = "all" | ResearchSynthesisSectionStatus;

type LiteratureSynthesisPanelProps = {
  synthesisSections: ResearchSynthesisSection[];
  filteredSynthesisSections: ResearchSynthesisSection[];
  sources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  themeSummaries: LiteratureThemeSummary[];
  synthesisThemeOptions: string[];
  synthesisSearchTerm: string;
  synthesisStatusFilter: SynthesisStatusFilter;
  synthesisThemeFilter: string;
  synthesisPinnedOnly: boolean;
  onSynthesisSearchTermChange: (value: string) => void;
  onSynthesisStatusFilterChange: (value: SynthesisStatusFilter) => void;
  onSynthesisThemeFilterChange: (value: string) => void;
  onSynthesisPinnedOnlyChange: (value: boolean) => void;
  onResetSynthesisFilters: () => void;
  onTogglePinnedSection: (sectionId: string) => void;
  onEditSection: (section: ResearchSynthesisSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onSendSectionToMindMap: (section: ResearchSynthesisSection) => void;
};

const synthesisSectionStatusLabels: Record<
  ResearchSynthesisSectionStatus,
  string
> = {
  idea: "Idea",
  drafting: "Drafting",
  "needs-evidence": "Needs evidence",
  solid: "Solid",
  parked: "Parked",
};

export function LiteratureSynthesisPanel({
  synthesisSections,
  filteredSynthesisSections,
  sources,
  notes,
  themeSummaries,
  synthesisThemeOptions,
  synthesisSearchTerm,
  synthesisStatusFilter,
  synthesisThemeFilter,
  synthesisPinnedOnly,
  onSynthesisSearchTermChange,
  onSynthesisStatusFilterChange,
  onSynthesisThemeFilterChange,
  onSynthesisPinnedOnlyChange,
  onResetSynthesisFilters,
  onTogglePinnedSection,
  onEditSection,
  onDeleteSection,
  onSendSectionToMindMap,
}: LiteratureSynthesisPanelProps) {
  return (
    <section className="literature-panel">
      <div className="literature-panel__header">
        <div>
          <p className="literature-panel__eyebrow">Synthesis</p>
          <h2>Outline Builder</h2>
          <p>
            Build literature-review sections from claims, themes, linked
            sources, and source notes.
          </p>
        </div>
      </div>

      <div className="literature-filter-panel literature-filter-panel--wide">
        <label>
          <span>Search</span>
          <input
            value={synthesisSearchTerm}
            onChange={(event) =>
              onSynthesisSearchTermChange(event.target.value)
            }
            placeholder="Search title, claim, draft note, evidence..."
          />
        </label>

        <label>
          <span>Status</span>
          <select
            value={synthesisStatusFilter}
            onChange={(event) =>
              onSynthesisStatusFilterChange(
                event.target.value as SynthesisStatusFilter
              )
            }
          >
            <option value="all">All statuses</option>
            {Object.entries(synthesisSectionStatusLabels).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span>Theme</span>
          <select
            value={synthesisThemeFilter}
            onChange={(event) =>
              onSynthesisThemeFilterChange(event.target.value)
            }
          >
            <option value="all">All themes</option>
            {synthesisThemeOptions.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>

        <label className="research-checkbox-label literature-filter-checkbox">
          <input
            type="checkbox"
            checked={synthesisPinnedOnly}
            onChange={(event) =>
              onSynthesisPinnedOnlyChange(event.target.checked)
            }
          />
          <span>Pinned only</span>
        </label>

        <button
          className="research-chip-button"
          type="button"
          onClick={onResetSynthesisFilters}
        >
          Reset
        </button>
      </div>

      <p className="literature-filter-summary">
        Showing {filteredSynthesisSections.length} of{" "}
        {synthesisSections.length} synthesis sections
      </p>

      <div className="literature-outline-list">
        {filteredSynthesisSections.map((section) => {
          const linkedSources = section.linkedSourceIds
            .map((sourceId) => sources.find((source) => source.id === sourceId))
            .filter(Boolean) as ResearchLiteratureSource[];
          const linkedNotes = section.linkedNoteIds
            .map((noteId) => notes.find((note) => note.id === noteId))
            .filter(Boolean) as ResearchLiteratureNote[];

          return (
            <article key={section.id} className="literature-outline-card">
              <div className="research-literature-card__header">
                <div>
                  <p className="research-literature-card__eyebrow">
                    {section.pinned ? "Pinned · " : ""}
                    {synthesisSectionStatusLabels[section.status]}
                  </p>

                  <h2>{section.title}</h2>
                </div>

                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => onTogglePinnedSection(section.id)}
                >
                  {section.pinned ? "Unpin" : "Pin"}
                </button>
              </div>

              <p className="literature-outline-card__claim">{section.claim}</p>

              <div className="research-literature-card__meta">
                {section.themes.length > 0 ? (
                  section.themes.map((theme) => <span key={theme}>{theme}</span>)
                ) : (
                  <span>No themes yet</span>
                )}
              </div>

              <div className="literature-outline-card__evidence">
                <div>
                  <strong>Linked sources</strong>
                  {linkedSources.length > 0 ? (
                    linkedSources.map((source) => (
                      <span key={source.id}>{source.title}</span>
                    ))
                  ) : (
                    <span>No linked sources</span>
                  )}
                </div>

                <div>
                  <strong>Linked notes</strong>
                  {linkedNotes.length > 0 ? (
                    linkedNotes.map((note) => (
                      <span key={note.id}>{note.title}</span>
                    ))
                  ) : (
                    <span>No linked notes</span>
                  )}
                </div>
              </div>

              {section.draftNote ? (
                <p className="literature-outline-card__draft">
                  {section.draftNote}
                </p>
              ) : null}

              <div className="research-project-card__actions">
                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => onSendSectionToMindMap(section)}
                >
                  Send to Mind Map
                </button>

                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => onEditSection(section)}
                >
                  Edit
                </button>

                <button
                  className="research-chip-button research-chip-button--danger"
                  type="button"
                  onClick={() => onDeleteSection(section.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}

        {synthesisSections.length === 0 ? (
          <div className="research-empty-state">
            No outline sections yet. Add a synthesis section to start turning
            the literature map into an argument.
          </div>
        ) : null}

        {synthesisSections.length > 0 &&
        filteredSynthesisSections.length === 0 ? (
          <div className="research-empty-state">
            No synthesis sections match these filters.
          </div>
        ) : null}
      </div>

      <div className="literature-panel__header">
        <div>
          <p className="literature-panel__eyebrow">Grouped synthesis</p>
          <h2>Theme-based synthesis notes</h2>
          <p>
            This groups your sources by theme so you can see what each part of
            the literature review is actually supported by.
          </p>
        </div>
      </div>

      <div className="literature-synthesis-list">
        {themeSummaries.map((summary) => (
          <article key={summary.theme} className="literature-synthesis-card">
            <h3>{summary.theme}</h3>

            {summary.sources.map((source) => (
              <div key={source.id} className="literature-synthesis-source">
                <strong>{source.title}</strong>
                <span>
                  {[source.authors, source.year].filter(Boolean).join(" · ") ||
                    "No citation details"}
                </span>

                {source.keyQuote ? <blockquote>{source.keyQuote}</blockquote> : null}

                {source.notes ? <p>{source.notes}</p> : null}
              </div>
            ))}
          </article>
        ))}

        {themeSummaries.length === 0 ? (
          <div className="research-empty-state">
            No synthesis groups yet. Add themes and notes to your sources.
          </div>
        ) : null}
      </div>
    </section>
  );
}
