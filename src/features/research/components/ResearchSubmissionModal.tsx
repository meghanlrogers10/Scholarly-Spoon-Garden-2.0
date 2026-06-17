import { useState, type FormEvent } from "react";
import type {
  ResearchSubmission,
  ResearchSubmissionInput,
  ResearchSubmissionStatus,
} from "../types";

type ResearchSubmissionModalProps = {
  projectId: string;
  submission?: ResearchSubmission;
  onClose: () => void;
  onSaveSubmission: (submission: ResearchSubmissionInput) => void;
};

const submissionStatusLabels: Record<ResearchSubmissionStatus, string> = {
  targeting: "Targeting",
  preparing: "Preparing",
  submitted: "Submitted",
  "revise-resubmit": "Revise & resubmit",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function ResearchSubmissionModal({
  projectId,
  submission,
  onClose,
  onSaveSubmission,
}: ResearchSubmissionModalProps) {
  const [journalName, setJournalName] = useState(submission?.journalName ?? "");
  const [status, setStatus] = useState<ResearchSubmissionStatus>(
    submission?.status ?? "targeting"
  );
  const [manuscriptVersion, setManuscriptVersion] = useState(
    submission?.manuscriptVersion ?? ""
  );
  const [submittedAt, setSubmittedAt] = useState(submission?.submittedAt ?? "");
  const [decisionAt, setDecisionAt] = useState(submission?.decisionAt ?? "");
  const [nextAction, setNextAction] = useState(submission?.nextAction ?? "");
  const [notes, setNotes] = useState(submission?.notes ?? "");
  const [pinned, setPinned] = useState(submission?.pinned ?? false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedJournalName = journalName.trim();

    if (!cleanedJournalName) {
      return;
    }

    onSaveSubmission({
      projectId,
      journalName: cleanedJournalName,
      status,
      manuscriptVersion,
      submittedAt,
      decisionAt,
      nextAction,
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
        aria-labelledby="research-submission-modal-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">
              {submission ? "Edit submission" : "New submission"}
            </p>
            <h2 id="research-submission-modal-title">
              {submission
                ? "Update the journal record."
                : "Track a target journal or submission."}
            </h2>
            <p>
              This is the simple version: journal, status, dates, next action,
              and notes.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close submission modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <div className="research-modal__row">
            <label>
              <span>Journal</span>
              <input
                value={journalName}
                onChange={(event) => setJournalName(event.target.value)}
                placeholder="Criminology, JQC, Justice Quarterly..."
                autoFocus
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ResearchSubmissionStatus)
                }
              >
                {Object.entries(submissionStatusLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <label>
            <span>Manuscript version, optional</span>
            <input
              value={manuscriptVersion}
              onChange={(event) => setManuscriptVersion(event.target.value)}
              placeholder="Full draft v1, R&R draft, submission copy..."
            />
          </label>

          <div className="research-modal__row">
            <label>
              <span>Submitted date</span>
              <input
                type="date"
                value={submittedAt}
                onChange={(event) => setSubmittedAt(event.target.value)}
              />
            </label>

            <label>
              <span>Decision date</span>
              <input
                type="date"
                value={decisionAt}
                onChange={(event) => setDecisionAt(event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Next action</span>
            <input
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              placeholder="Format references, draft cover letter, wait for decision..."
            />
          </label>

          <label className="research-checkbox-label">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            <span>Pin this journal record</span>
          </label>

          <label>
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Fit, reviewer notes, desk reject risk, editor notes, R&R plan..."
              rows={5}
            />
          </label>

          <div className="research-modal__actions">
            <button
              className="research-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="research-primary-button" type="submit">
              {submission ? "Save submission" : "Add submission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}