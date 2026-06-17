import type {
  ResearchLiteratureNote,
  ResearchLiteratureSource,
} from "../../types";

export type LiteratureThemeSummary = {
  theme: string;
  sources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  readCount: number;
  citedCount: number;
  quoteCount: number;
  noteCount: number;
  sourceNoteCount: number;
};

type LiteratureThemesPanelProps = {
  themeSummaries: LiteratureThemeSummary[];
  onViewThemeSources: (theme: string) => void;
  onViewThemeNotes: (theme: string) => void;
  onViewThemeSynthesis: (theme: string) => void;
  onViewThemeMap: (theme: string) => void;
  onSendThemeToMindMap: (summary: LiteratureThemeSummary) => void;
};

export function LiteratureThemesPanel({
  themeSummaries,
  onViewThemeSources,
  onViewThemeNotes,
  onViewThemeSynthesis,
  onViewThemeMap,
  onSendThemeToMindMap,
}: LiteratureThemesPanelProps) {
  return (
    <section className="literature-panel">
      <div className="literature-panel__header">
        <div>
          <p className="literature-panel__eyebrow">Theme atlas</p>
          <h2>Active themes</h2>
          <p>
            Themes are built from the theme tags on your sources. This is the
            start of the old mind-map connection.
          </p>
        </div>
      </div>

      <div className="literature-theme-grid">
        {themeSummaries.map((summary) => (
          <article key={summary.theme} className="literature-theme-card">
            <p className="literature-theme-card__eyebrow">Theme</p>
            <h3>{summary.theme}</h3>

            <div className="literature-theme-card__stats">
              <span>{summary.sources.length} sources</span>
              <span>{summary.readCount} read</span>
              <span>{summary.citedCount} cited</span>
              <span>{summary.quoteCount} quotes</span>
              <span>{summary.noteCount} notes</span>
              <span>{summary.sourceNoteCount} source notes</span>
            </div>

            <ul>
              {summary.sources.slice(0, 5).map((source) => (
                <li key={source.id}>{source.title}</li>
              ))}
              {summary.notes.slice(0, 5).map((note) => (
                <li key={note.id}>{note.title}</li>
              ))}
            </ul>

            <div className="literature-theme-card__actions">
              <button
                className="research-chip-button"
                type="button"
                onClick={() => onViewThemeSources(summary.theme)}
              >
                View sources
              </button>
              <button
                className="research-chip-button"
                type="button"
                onClick={() => onViewThemeNotes(summary.theme)}
              >
                View notes
              </button>
              <button
                className="research-chip-button"
                type="button"
                onClick={() => onViewThemeSynthesis(summary.theme)}
              >
                View synthesis
              </button>
              <button
                className="research-chip-button"
                type="button"
                onClick={() => onViewThemeMap(summary.theme)}
              >
                View map
              </button>
              <button
                className="research-chip-button"
                type="button"
                onClick={() => onSendThemeToMindMap(summary)}
              >
                Send to Mind Map
              </button>
            </div>
          </article>
        ))}

        {themeSummaries.length === 0 ? (
          <div className="research-empty-state">
            No themes yet. Add comma-separated themes to sources in the Reading
            Queue.
          </div>
        ) : null}
      </div>
    </section>
  );
}
