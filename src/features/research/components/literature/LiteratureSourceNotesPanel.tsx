import { useEffect, useMemo, useState } from "react";
import type {
  ResearchLiteratureNote,
  ResearchLiteratureNoteKind,
  ResearchLiteratureReadingNote,
  ResearchLiteratureReadingNoteInput,
  ResearchLiteratureReadingNoteSections,
  ResearchLiteratureSource,
} from "../../types";

type NoteKindFilter = "all" | ResearchLiteratureNoteKind;

type LiteratureSourceNotesPanelProps = {
  projectId: string;
  notes: ResearchLiteratureNote[];
  filteredNotes: ResearchLiteratureNote[];
  readingNotes: ResearchLiteratureReadingNote[];
  sources: ResearchLiteratureSource[];
  allThemes: string[];
  noteSearchTerm: string;
  noteKindFilter: NoteKindFilter;
  noteSourceFilter: string;
  noteThemeFilter: string;
  notePinnedOnly: boolean;
  onSaveReadingNote: (note: ResearchLiteratureReadingNoteInput) => void;
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
  onSendThemeToMindMap: (theme: string) => void;
};

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

const emptyReadingSections: ResearchLiteratureReadingNoteSections = {
  researchQuestion: "",
  litReview: "",
  theory: "",
  hypotheses: "",
  dataSample: "",
  methods: "",
  findingsConclusion: "",
  quotes: "",
  futureResearch: "",
  generalNotes: "",
};

const readingSectionFields: Array<{
  key: keyof ResearchLiteratureReadingNoteSections;
  label: string;
}> = [
  { key: "researchQuestion", label: "Research Question" },
  { key: "litReview", label: "Lit Review" },
  { key: "theory", label: "Theory" },
  { key: "hypotheses", label: "Hypotheses" },
  { key: "dataSample", label: "Data/Sample" },
  { key: "methods", label: "Methods" },
  { key: "findingsConclusion", label: "Findings/Conclusion" },
  { key: "quotes", label: "Quotes" },
  { key: "futureResearch", label: "Future Research" },
  { key: "generalNotes", label: "General Notes" },
];

function getNoteThemes(note: ResearchLiteratureNote) {
  return Array.isArray(note.themes) ? note.themes : [];
}

function normalizeTheme(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function dedupeThemes(themes: string[]) {
  return Array.from(
    new Set(themes.map((theme) => normalizeTheme(theme)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function extractThemesFromSections(
  sections: ResearchLiteratureReadingNoteSections
) {
  const text = Object.values(sections).join("\n");
  const matches = text.match(/\{([^{}]+)\}/g) ?? [];

  return dedupeThemes(
    matches.map((match) => match.replace(/^\{|\}$/g, ""))
  );
}

function hasReadingNoteContent(
  sections: ResearchLiteratureReadingNoteSections,
  manualThemes: string[]
) {
  return (
    Object.values(sections).some((value) => value.trim()) ||
    manualThemes.length > 0
  );
}

function formatSavedTime(value?: string) {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LiteratureSourceNotesPanel({
  projectId,
  notes,
  filteredNotes,
  readingNotes,
  sources,
  allThemes,
  noteSearchTerm,
  noteKindFilter,
  noteSourceFilter,
  noteThemeFilter,
  notePinnedOnly,
  onSaveReadingNote,
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
}: LiteratureSourceNotesPanelProps) {
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [sections, setSections] =
    useState<ResearchLiteratureReadingNoteSections>(emptyReadingSections);
  const [manualThemes, setManualThemes] = useState<string[]>([]);
  const [manualThemeInput, setManualThemeInput] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>();

  const selectedSource = sources.find((source) => source.id === selectedSourceId);
  const selectedReadingNote = readingNotes.find(
    (note) => note.sourceId === selectedSourceId
  );
  const hasSelectedReadingNote = Boolean(selectedReadingNote);
  const selectedReadingNotePinned = selectedReadingNote?.pinned ?? false;
  const extractedThemes = useMemo(
    () => extractThemesFromSections(sections),
    [sections]
  );
  const finalThemes = useMemo(
    () => dedupeThemes([...extractedThemes, ...manualThemes]),
    [extractedThemes, manualThemes]
  );

  useEffect(() => {
    // Sync local note editor draft when the selected source changes.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!selectedSourceId) {
      setSections(emptyReadingSections);
      setManualThemes([]);
      setLastSavedAt(undefined);
      return;
    }

    setSections(selectedReadingNote?.sections ?? emptyReadingSections);
    setManualThemes(selectedReadingNote?.manualThemes ?? []);
    setLastSavedAt(selectedReadingNote?.updatedAt);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedSourceId, selectedReadingNote]);

  useEffect(() => {
    if (!selectedSource) {
      return;
    }

    if (!hasSelectedReadingNote && !hasReadingNoteContent(sections, manualThemes)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const now = new Date().toISOString();

      onSaveReadingNote({
        projectId,
        sourceId: selectedSource.id,
        sourceTitle: selectedSource.title,
        sections,
        body: sections.generalNotes,
        extractedThemes,
        manualThemes,
        pinned: selectedReadingNotePinned,
      });
      setLastSavedAt(now);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [
    extractedThemes,
    manualThemes,
    onSaveReadingNote,
    projectId,
    sections,
    hasSelectedReadingNote,
    selectedReadingNotePinned,
    selectedSource,
  ]);

  function updateSection(
    key: keyof ResearchLiteratureReadingNoteSections,
    value: string
  ) {
    setSections((currentSections) => ({
      ...currentSections,
      [key]: value,
    }));
  }

  function addManualTheme() {
    const nextTheme = normalizeTheme(manualThemeInput);

    if (!nextTheme) {
      return;
    }

    setManualThemes((currentThemes) =>
      currentThemes.includes(nextTheme)
        ? currentThemes
        : [...currentThemes, nextTheme].sort((a, b) => a.localeCompare(b))
    );
    setManualThemeInput("");
  }

  function removeManualTheme(theme: string) {
    setManualThemes((currentThemes) =>
      currentThemes.filter((item) => item !== theme)
    );
  }

  return (
    <section className="literature-panel">
      <div className="literature-panel__header">
        <div>
          <p className="literature-panel__eyebrow">Reading Notes Lab</p>
          <h2>Source-centered notes</h2>
          <p>
            Select a source once, write while reading, and tag themes inline
            with curly braces like {"{state capacity}"}.
          </p>
        </div>
      </div>

      <div className="literature-reading-lab">
        {sources.length === 0 ? (
          <div className="research-empty-state">
            No sources yet. Add a source in the Reading Queue before opening the
            Reading Notes Lab.
          </div>
        ) : (
          <>
            <aside className="literature-reading-lab__sources">
              <label>
                <span>Source</span>
                <select
                  value={selectedSourceId}
                  onChange={(event) => setSelectedSourceId(event.target.value)}
                >
                  <option value="">Choose a source...</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="literature-reading-lab__source-list">
                {sources.map((source) => {
                  const sourceReadingNote = readingNotes.find(
                    (note) => note.sourceId === source.id
                  );

                  return (
                    <button
                      key={source.id}
                      className={
                        selectedSourceId === source.id ? "is-selected" : ""
                      }
                      type="button"
                      onClick={() => setSelectedSourceId(source.id)}
                    >
                      <strong>{source.title}</strong>
                      <span>
                        {sourceReadingNote
                          ? `Saved ${formatSavedTime(sourceReadingNote.updatedAt)}`
                          : "No lab notes yet"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="literature-reading-lab__editor">
              {!selectedSource ? (
                <div className="research-empty-state">
                  Select a source to start source-centered reading notes.
                </div>
              ) : (
                <>
                  <article className="literature-reading-lab__context">
                    <div>
                      <p className="literature-panel__eyebrow">
                        Selected source
                      </p>
                      <h3>{selectedSource.title}</h3>
                      <p>
                        {[selectedSource.authors, selectedSource.year]
                          .filter(Boolean)
                          .join(" · ") || "No citation details yet"}
                      </p>
                    </div>

                    <div className="research-project-card__actions">
                      <span>Last saved: {formatSavedTime(lastSavedAt)}</span>
                      {selectedReadingNote ? (
                        <button
                          className="research-chip-button"
                          type="button"
                          onClick={() =>
                            onSendReadingNoteToMindMap(selectedReadingNote)
                          }
                        >
                          Send to Mind Map
                        </button>
                      ) : null}
                    </div>
                  </article>

                  <div className="literature-reading-lab__themes">
                    <div>
                      <strong>Themes</strong>
                      <p>Inline tags plus manual themes become theme chips.</p>
                    </div>

                    <div className="literature-reading-lab__theme-input">
                      <input
                        value={manualThemeInput}
                        onChange={(event) =>
                          setManualThemeInput(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addManualTheme();
                          }
                        }}
                        placeholder="Add manual theme"
                      />
                      <button
                        className="research-chip-button"
                        type="button"
                        onClick={addManualTheme}
                      >
                        Add
                      </button>
                    </div>

                    <div className="literature-reading-lab__theme-chips">
                      {finalThemes.length > 0 ? (
                        finalThemes.map((theme) => {
                          const isManualTheme = manualThemes.includes(theme);

                          return isManualTheme ? (
                            <button
                              key={theme}
                              className="literature-chip-button"
                              type="button"
                              onClick={() => removeManualTheme(theme)}
                            >
                              {theme} ×
                            </button>
                          ) : (
                            <span key={theme}>{theme}</span>
                          );
                        })
                      ) : (
                        <span>No themes yet</span>
                      )}
                    </div>

                    {finalThemes.length > 0 ? (
                      <button
                        className="research-chip-button"
                        type="button"
                        onClick={() =>
                          finalThemes.forEach((theme) =>
                            onSendThemeToMindMap(theme)
                          )
                        }
                      >
                        Send themes to Mind Map
                      </button>
                    ) : null}
                  </div>

                  <div className="literature-reading-lab__sections">
                    {readingSectionFields.map((field) => (
                      <label key={field.key}>
                        <span>{field.label}</span>
                        <textarea
                          value={sections[field.key]}
                          onChange={(event) =>
                            updateSection(field.key, event.target.value)
                          }
                          rows={field.key === "generalNotes" ? 8 : 5}
                          placeholder={`Notes for ${field.label.toLowerCase()}...`}
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="literature-panel__header">
        <div>
          <p className="literature-panel__eyebrow">Curated source notes</p>
          <h2>Reusable note cards</h2>
          <p>
            Structured notes still work here for quotes, gaps, arguments, and
            synthesis pieces you want to reuse across the project.
          </p>
        </div>
      </div>

      <div className="literature-filter-panel literature-filter-panel--wide">
        <label>
          <span>Search</span>
          <input
            value={noteSearchTerm}
            onChange={(event) => onNoteSearchTermChange(event.target.value)}
            placeholder="Search title, body, quote, source..."
          />
        </label>

        <label>
          <span>Kind</span>
          <select
            value={noteKindFilter}
            onChange={(event) =>
              onNoteKindFilterChange(event.target.value as NoteKindFilter)
            }
          >
            <option value="all">All kinds</option>
            {Object.entries(literatureNoteKindLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Linked source</span>
          <select
            value={noteSourceFilter}
            onChange={(event) => onNoteSourceFilterChange(event.target.value)}
          >
            <option value="all">All sources</option>
            <option value="none">No linked source</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Theme</span>
          <select
            value={noteThemeFilter}
            onChange={(event) => onNoteThemeFilterChange(event.target.value)}
          >
            <option value="all">All themes</option>
            {allThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>

        <label className="research-checkbox-label literature-filter-checkbox">
          <input
            type="checkbox"
            checked={notePinnedOnly}
            onChange={(event) => onNotePinnedOnlyChange(event.target.checked)}
          />
          <span>Pinned only</span>
        </label>

        <button
          className="research-chip-button"
          type="button"
          onClick={onResetNoteFilters}
        >
          Reset
        </button>
      </div>

      <p className="literature-filter-summary">
        Showing {filteredNotes.length} of {notes.length} curated notes
      </p>

      <section className="research-literature-list">
        {filteredNotes.map((note) => {
          const linkedSource = note.sourceId
            ? sources.find((source) => source.id === note.sourceId)
            : undefined;
          const linkedSourceTitle = linkedSource?.title ?? note.sourceTitle;

          return (
            <article
              key={note.id}
              className="research-literature-card research-literature-note-card"
            >
              <div className="research-literature-card__header">
                <div>
                  <p className="research-literature-card__eyebrow">
                    {note.pinned ? "Pinned · " : ""}
                    {literatureNoteKindLabels[note.noteKind]}
                  </p>

                  <h2>{note.title}</h2>

                  <p className="research-literature-card__citation">
                    {linkedSourceTitle
                      ? `Linked source: ${linkedSourceTitle}`
                      : "No linked source"}
                  </p>
                </div>

                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => onTogglePinnedNote(note.id)}
                >
                  {note.pinned ? "Unpin" : "Pin"}
                </button>
              </div>

              <div className="research-literature-card__meta">
                {getNoteThemes(note).length > 0 ? (
                  getNoteThemes(note).map((theme) => (
                    <span key={theme}>{theme}</span>
                  ))
                ) : (
                  <span>No themes yet</span>
                )}
              </div>

              {note.keyQuote ? (
                <blockquote className="research-literature-card__quote">
                  {note.keyQuote}
                </blockquote>
              ) : null}

              <p className="research-literature-card__notes">{note.body}</p>

              {note.argumentSlot ? (
                <p className="research-literature-note-card__slot">
                  <strong>Argument slot:</strong> {note.argumentSlot}
                </p>
              ) : null}

              <div className="research-project-card__actions">
                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => onSendNoteToMindMap(note)}
                >
                  Send to Mind Map
                </button>

                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => onEditNote(note)}
                >
                  Edit
                </button>

                <button
                  className="research-chip-button research-chip-button--danger"
                  type="button"
                  onClick={() => onDeleteNote(note.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}

        {notes.length === 0 ? (
          <div className="research-empty-state">
            No curated source notes yet. Use the lab above for active reading,
            or add a reusable note card when a source gives you a useful quote,
            argument piece, gap, or synthesis point.
          </div>
        ) : null}

        {notes.length > 0 && filteredNotes.length === 0 ? (
          <div className="research-empty-state">
            No curated source notes match these filters.
          </div>
        ) : null}
      </section>
    </section>
  );
}
