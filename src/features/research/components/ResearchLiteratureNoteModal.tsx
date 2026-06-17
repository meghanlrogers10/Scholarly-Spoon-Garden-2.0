import { useState, type FormEvent } from "react";
import { ResearchLargeContentWarning } from "./ResearchLargeContentWarning";
import type {
  ResearchLiteratureNote,
  ResearchLiteratureNoteInput,
  ResearchLiteratureNoteKind,
  ResearchLiteratureSource,
} from "../types";

type ResearchLiteratureNoteModalProps = {
  projectId: string;
  note?: ResearchLiteratureNote;
  sources: ResearchLiteratureSource[];
  onClose: () => void;
  onSaveNote: (note: ResearchLiteratureNoteInput) => void;
};

const noteKindLabels: Record<ResearchLiteratureNoteKind, string> = {
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

function parseThemes(value: string) {
  return value
    .split(",")
    .map((theme) => theme.trim())
    .filter(Boolean);
}

export function ResearchLiteratureNoteModal({
  projectId,
  note,
  sources,
  onClose,
  onSaveNote,
}: ResearchLiteratureNoteModalProps) {
  const [sourceId, setSourceId] = useState(note?.sourceId ?? "");
  const [noteKind, setNoteKind] = useState<ResearchLiteratureNoteKind>(
    note?.noteKind ?? "summary"
  );
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [themes, setThemes] = useState(note?.themes.join(", ") ?? "");
  const [keyQuote, setKeyQuote] = useState(note?.keyQuote ?? "");
  const [argumentSlot, setArgumentSlot] = useState(note?.argumentSlot ?? "");
  const [pinned, setPinned] = useState(note?.pinned ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      return;
    }

    const selectedSource = sources.find((source) => source.id === sourceId);

    onSaveNote({
      projectId,
      sourceId: selectedSource?.id,
      sourceTitle: selectedSource?.title,
      noteKind,
      title: cleanedTitle,
      body,
      themes: parseThemes(themes),
      keyQuote,
      argumentSlot,
      pinned,
    });

    onClose();
  }

  return (
    <div className="research-modal-backdrop" role="presentation">
      <div
        className="research-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="research-literature-note-modal-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">{note ? "Edit note" : "New source note"}</p>
            <h2 id="research-literature-note-modal-title">
              {note ? "Update this source note." : "Capture what this source does."}
            </h2>
            <p>
              Use this for theory, methods, findings, gaps, quotes, and argument
              pieces.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close literature note modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <div className="research-modal__row">
            <label>
              <span>Linked source</span>
              <select
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
              >
                <option value="">No linked source</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Note type</span>
              <select
                value={noteKind}
                onChange={(event) =>
                  setNoteKind(event.target.value as ResearchLiteratureNoteKind)
                }
              >
                {Object.entries(noteKindLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What should future you remember?"
              autoFocus
            />
          </label>

          <label>
            <span>Body</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Main note, summary, mechanism, finding, or synthesis point."
              rows={5}
            />
          </label>

          <label>
            <span>Themes, comma-separated</span>
            <input
              value={themes}
              onChange={(event) => setThemes(event.target.value)}
              placeholder="state capacity, inequality, homicide"
            />
          </label>

          <label>
            <span>Key quote</span>
            <textarea
              value={keyQuote}
              onChange={(event) => setKeyQuote(event.target.value)}
              placeholder="Optional quote worth keeping close."
              rows={3}
            />
          </label>

          <label>
            <span>Argument slot</span>
            <input
              value={argumentSlot}
              onChange={(event) => setArgumentSlot(event.target.value)}
              placeholder="Intro puzzle, theory boundary, methods defense, discussion..."
            />
          </label>

          <label className="research-checkbox-label">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            <span>Pin this note</span>
          </label>

          <ResearchLargeContentWarning
            fields={[
              { label: "note body", value: body },
              { label: "key quote", value: keyQuote },
            ]}
          />

          <div className="research-modal__actions">
            <button
              className="research-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="research-primary-button" type="submit">
              {note ? "Save note" : "Add note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
