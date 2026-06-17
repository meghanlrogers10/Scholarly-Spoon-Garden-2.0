import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ResearchProjectSubnav } from "../components/ResearchProjectSubnav";
import { ResearchSubmissionModal } from "../components/ResearchSubmissionModal";
import { useResearchProjects } from "../hooks/useResearchProjects";
import { useResearchSubmissions } from "../hooks/useResearchSubmissions";
import type {
  ResearchSubmission,
  ResearchSubmissionInput,
  ResearchSubmissionStatus,
} from "../types";

const submissionStatusLabels: Record<ResearchSubmissionStatus, string> = {
  targeting: "Targeting",
  preparing: "Preparing",
  submitted: "Submitted",
  "revise-resubmit": "Revise & resubmit",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function formatSubmissionDate(value?: string) {
  if (!value) {
    return "Not logged";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ResearchSubmissionsPage() {
  const { projectId } = useParams();
  const location = useLocation();

  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] =
    useState<ResearchSubmission | null>(null);

  const { projects } = useResearchProjects();
  const {
    getSubmissionsForProject,
    createSubmission,
    updateSubmission,
    togglePinnedSubmission,
    deleteSubmission,
    refreshSubmissions,
  } = useResearchSubmissions();

  useEffect(() => {
    refreshSubmissions();
  // Refresh localStorage-backed submissions only when navigating between research routes.
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

  const submissions = getSubmissionsForProject(projectId);
  const pinnedSubmissions = submissions.filter((submission) => submission.pinned);
  const activeSubmissions = submissions.filter((submission) =>
    ["targeting", "preparing", "submitted", "revise-resubmit"].includes(
      submission.status
    )
  );
  const finishedSubmissions = submissions.filter((submission) =>
    ["accepted", "rejected", "withdrawn"].includes(submission.status)
  );

  function openNewSubmissionModal() {
    setEditingSubmission(null);
    setIsSubmissionModalOpen(true);
  }

  function openEditSubmissionModal(submission: ResearchSubmission) {
    setEditingSubmission(submission);
    setIsSubmissionModalOpen(true);
  }

  function closeSubmissionModal() {
    setEditingSubmission(null);
    setIsSubmissionModalOpen(false);
  }

  function handleSaveSubmission(input: ResearchSubmissionInput) {
    if (editingSubmission) {
      updateSubmission(editingSubmission.id, input);
      return;
    }

    createSubmission(input);
  }

  return (
    <section className="research-page page-stack">
      <div className="research-hero-panel">
        <div>
          <Link className="research-secondary-link" to={`/research/${projectId}`}>
            ← Back to {project.shortName}
          </Link>

          <p className="eyebrow">{project.shortName}</p>
          <h1>Submissions</h1>
          <p>
            Track target journals, submission status, dates, next actions, and
            decision notes.
          </p>
        </div>

        <div className="research-hero-panel__actions">
          <button
            className="research-primary-button"
            type="button"
            onClick={openNewSubmissionModal}
          >
            + Add Journal Record
          </button>
        </div>
      </div>

      <ResearchProjectSubnav projectId={projectId} />

      <div className="research-task-summary">
        <span>{submissions.length} records</span>
        <span>{activeSubmissions.length} active</span>
        <span>{finishedSubmissions.length} finished</span>
        <span>{pinnedSubmissions.length} pinned</span>
      </div>

      <section className="research-submission-list">
        {submissions.map((submission) => (
          <article
            key={submission.id}
            className={`research-submission-card research-submission-card--${submission.status}`}
          >
            <div className="research-submission-card__header">
              <div>
                <p className="research-submission-card__eyebrow">
                  {submission.pinned ? "Pinned · " : ""}
                  {submissionStatusLabels[submission.status]}
                </p>

                <h2>{submission.journalName}</h2>
              </div>

              <button
                className="research-chip-button"
                type="button"
                onClick={() => togglePinnedSubmission(submission.id)}
              >
                {submission.pinned ? "Unpin" : "Pin"}
              </button>
            </div>

            <div className="research-submission-card__meta">
              <span>Submitted: {formatSubmissionDate(submission.submittedAt)}</span>
              <span>Decision: {formatSubmissionDate(submission.decisionAt)}</span>

              {submission.manuscriptVersion ? (
                <span>{submission.manuscriptVersion}</span>
              ) : (
                <span>No version logged</span>
              )}
            </div>

            {submission.nextAction ? (
              <p className="research-submission-card__next">
                <strong>Next:</strong> {submission.nextAction}
              </p>
            ) : null}

            {submission.notes ? (
              <p className="research-submission-card__notes">
                {submission.notes}
              </p>
            ) : null}

            <div className="research-project-card__actions">
              <button
                className="research-chip-button"
                type="button"
                onClick={() => openEditSubmissionModal(submission)}
              >
                Edit
              </button>

              <button
                className="research-chip-button research-chip-button--danger"
                type="button"
                onClick={() => deleteSubmission(submission.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {submissions.length === 0 ? (
          <div className="research-empty-state">
            No submission records yet. Add the target journal or current
            submission status so this project has a clear endgame.
          </div>
        ) : null}
      </section>

      {isSubmissionModalOpen ? (
        <ResearchSubmissionModal
          projectId={projectId}
          submission={editingSubmission ?? undefined}
          onClose={closeSubmissionModal}
          onSaveSubmission={handleSaveSubmission}
        />
      ) : null}
    </section>
  );
}
