import { useState, type FormEvent } from "react";
import { ResearchLargeContentWarning } from "./ResearchLargeContentWarning";
import type {
  ResearchLiteratureNote,
  ResearchLiteratureSource,
  ResearchSynthesisSection,
  ResearchSynthesisSectionInput,
  ResearchSynthesisSectionStatus,
} from "../types";

type ResearchSynthesisSectionModalProps = {
  projectId: string;
  section?: ResearchSynthesisSection;
  sources: ResearchLiteratureSource[];
  notes: ResearchLiteratureNote[];
  onClose: () => void;
  onSaveSection: (section: ResearchSynthesisSectionInput) => void;
};

const synthesisStatusLabels: Record<ResearchSynthesisSectionStatus, string> = {
  idea: "Idea",
  drafting: "Drafting",
  "needs-evidence": "Needs evidence",
  solid: "Solid",
  parked: "Parked",
};

function parseThemes(value: string) {
  return value
    .split(",")
    .map((theme) => theme.trim())
    .filter(Boolean);
}

function toggleSelection(values: string[], value: string) {
  if (values.includes(value)) {
    return values.filter((item) => item !== value);
  }

  return [...values, value];
}

export function ResearchSynthesisSectionModal({
  projectId,
  section,
  sources,
  notes,
  onClose,
  onSaveSection,
}: ResearchSynthesisSectionModalProps) {
  const [title, setTitle] = useState(section?.title ?? "");
  const [claim, setClaim] = useState(section?.claim ?? "");
  const [status, setStatus] = useState<ResearchSynthesisSectionStatus>(
    section?.status ?? "idea"
  );
  const [themes, setThemes] = useState(section?.themes.join(", ") ?? "");
  const [linkedSourceIds, setLinkedSourceIds] = useState<string[]>(
    section?.linkedSourceIds ?? []
  );
  const [linkedNoteIds, setLinkedNoteIds] = useState<string[]>(
    section?.linkedNoteIds ?? []
  );
  const [draftNote, setDraftNote] = useState(section?.draftNote ?? "");
  const [pinned, setPinned] = useState(section?.pinned ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();
    const cleanedClaim = claim.trim();

    if (!cleanedTitle || !cleanedClaim) {
      return;
    }

    onSaveSection({
      projectId,
      title: cleanedTitle,
      claim: cleanedClaim,
      status,
      themes: parseThemes(themes),
      linkedSourceIds,
      linkedNoteIds,
      draftNote,
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
        aria-labelledby="research-synthesis-section-modal-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">
              {section ? "Edit synthesis section" : "New synthesis section"}
            </p>
            <h2 id="research-synthesis-section-modal-title">
              {section
                ? "Update this outline section."
                : "Build a literature review section."}
            </h2>
            <p>
              Capture the claim, evidence links, draft notes, and status for a
              piece of the literature review.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close synthesis section modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <div className="research-modal__row">
            <label>
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Theory frame, empirical gap, mechanism..."
                autoFocus
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ResearchSynthesisSectionStatus)
                }
              >
                {Object.entries(synthesisStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Claim</span>
            <textarea
              value={claim}
              onChange={(event) => setClaim(event.target.value)}
              placeholder="The argumentative point this section needs to make."
              rows={3}
            />
          </label>

          <label>
            <span>Themes, comma-separated</span>
            <input
              value={themes}
              onChange={(event) => setThemes(event.target.value)}
              placeholder="state capacity, inequality, institutional trust"
            />
          </label>

          <div className="research-modal__checklist">
            <span>Linked sources</span>
            <div>
              {sources.map((source) => (
                <label key={source.id} className="research-checkbox-label">
                  <input
                    type="checkbox"
                    checked={linkedSourceIds.includes(source.id)}
                    onChange={() =>
                      setLinkedSourceIds((currentIds) =>
                        toggleSelection(currentIds, source.id)
                      )
                    }
                  />
                  <span>{source.title}</span>
                </label>
              ))}

              {sources.length === 0 ? <p>No sources available yet.</p> : null}
            </div>
          </div>

          <div className="research-modal__checklist">
            <span>Linked source notes</span>
            <div>
              {notes.map((note) => (
                <label key={note.id} className="research-checkbox-label">
                  <input
                    type="checkbox"
                    checked={linkedNoteIds.includes(note.id)}
                    onChange={() =>
                      setLinkedNoteIds((currentIds) =>
                        toggleSelection(currentIds, note.id)
                      )
                    }
                  />
                  <span>{note.title}</span>
                </label>
              ))}

              {notes.length === 0 ? <p>No source notes available yet.</p> : null}
            </div>
          </div>

          <label>
            <span>Draft note</span>
            <textarea
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              placeholder="Paragraph sketch, missing evidence, transition notes, or revision reminders."
              rows={5}
            />
          </label>

          <label className="research-checkbox-label">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            <span>Pin this synthesis section</span>
          </label>

          <ResearchLargeContentWarning
            fields={[
              { label: "claim", value: claim },
              { label: "draft note", value: draftNote },
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
              {section ? "Save section" : "Add section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
