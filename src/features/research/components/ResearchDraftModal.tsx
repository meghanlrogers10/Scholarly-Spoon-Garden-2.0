import { useState, type FormEvent } from "react";
import { ResearchLargeContentWarning } from "./ResearchLargeContentWarning";
import type {
  ResearchDraft,
  ResearchDraftInput,
  ResearchDraftStatus,
} from "../types";

type ResearchDraftModalProps = {
  projectId: string;
  draft?: ResearchDraft;
  onClose: () => void;
  onSaveDraft: (draft: ResearchDraftInput) => void;
};

const draftStatusLabels: Record<ResearchDraftStatus, string> = {
  "not-started": "Not started",
  sketching: "Sketching",
  drafting: "Drafting",
  revising: "Revising",
  waiting: "Waiting",
  done: "Done",
  parked: "Parked",
};

export function ResearchDraftModal({
  projectId,
  draft,
  onClose,
  onSaveDraft,
}: ResearchDraftModalProps) {
  const [title, setTitle] = useState(draft?.title ?? "");
  const [section, setSection] = useState(draft?.section ?? "");
  const [status, setStatus] = useState<ResearchDraftStatus>(
    draft?.status ?? "drafting"
  );
  const [link, setLink] = useState(draft?.link ?? "");
  const [versionLabel, setVersionLabel] = useState(draft?.versionLabel ?? "");
  const [versionNotes, setVersionNotes] = useState(draft?.versionNotes ?? "");
  const [lastWorkedAt, setLastWorkedAt] = useState(draft?.lastWorkedAt ?? "");
  const [whereLeftOff, setWhereLeftOff] = useState(draft?.whereLeftOff ?? "");
  const [nextWritingMove, setNextWritingMove] = useState(
    draft?.nextWritingMove ?? ""
  );
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [pinned, setPinned] = useState(draft?.pinned ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      return;
    }

    onSaveDraft({
      projectId,
      title: cleanedTitle,
      section: section.trim() || "Unassigned section",
      status,
      link,
      versionLabel,
      versionNotes,
      lastWorkedAt,
      whereLeftOff,
      nextWritingMove,
      notes,
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
        aria-labelledby="research-draft-modal-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">{draft ? "Edit draft" : "New draft"}</p>
            <h2 id="research-draft-modal-title">
              {draft ? "Update the draft record." : "Track a manuscript draft."}
            </h2>
            <p>
              This is manual version tracking for now. Google Docs integration
              comes later.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close draft modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <label>
            <span>Draft title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="SCD theory section draft"
              autoFocus
            />
          </label>

          <div className="research-modal__row">
            <label>
              <span>Manuscript section</span>
              <input
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="Introduction, Theory, Methods, Results..."
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ResearchDraftStatus)
                }
              >
                {Object.entries(draftStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="research-modal__row">
            <label>
              <span>Google Docs/document link</span>
              <input
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="Google Doc, Word file, Overleaf, folder link..."
              />
            </label>

            <label>
              <span>Last worked date</span>
              <input
                type="date"
                value={lastWorkedAt}
                onChange={(event) => setLastWorkedAt(event.target.value)}
              />
            </label>
          </div>

          <div className="research-modal__row">
            <label>
              <span>Version label</span>
              <input
                value={versionLabel}
                onChange={(event) => setVersionLabel(event.target.value)}
                placeholder="v2 theory cleanup, R&R draft, June pass..."
              />
            </label>

            <label>
              <span>Version notes</span>
              <input
                value={versionNotes}
                onChange={(event) => setVersionNotes(event.target.value)}
                placeholder="What changed in this version?"
              />
            </label>
          </div>

          <label className="research-checkbox-label">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            <span>Pin this draft</span>
          </label>

          <label>
            <span>Where I left off</span>
            <textarea
              value={whereLeftOff}
              onChange={(event) => setWhereLeftOff(event.target.value)}
              placeholder="Last paragraph touched, unresolved comment, section needing a bridge..."
              rows={3}
            />
          </label>

          <label>
            <span>Next writing move</span>
            <textarea
              value={nextWritingMove}
              onChange={(event) => setNextWritingMove(event.target.value)}
              placeholder="The first concrete move when restarting this draft..."
              rows={3}
            />
          </label>

          <label>
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What changed? What still needs work? Where did you leave off?"
              rows={5}
            />
          </label>

          <ResearchLargeContentWarning
            fields={[
              { label: "where I left off", value: whereLeftOff },
              { label: "next writing move", value: nextWritingMove },
              { label: "draft notes", value: notes },
              { label: "version notes", value: versionNotes },
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
              {draft ? "Save draft" : "Add draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
