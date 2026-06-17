import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ResearchLogEntryModal } from "../components/ResearchLogEntryModal";
import { ResearchProjectSubnav } from "../components/ResearchProjectSubnav";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { useResearchLog } from "../hooks/useResearchLog";
import { useResearchProjects } from "../hooks/useResearchProjects";
import type {
  ResearchLogEntry,
  ResearchLogEntryInput,
  ResearchLogEntryType,
} from "../types";

const entryTypeLabels: Record<ResearchLogEntryType, string> = {
  progress: "Progress",
  decision: "Decision",
  blocker: "Blocker",
  idea: "Idea",
  "next-action": "Next action",
  results: "Results",
};

const outputTypeLabels = {
  stata: "Stata output",
  "excel-table": "Excel/table",
  figure: "Figure",
  model: "Model",
  text: "Text",
  mixed: "Mixed",
};

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ResearchLogPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ResearchLogEntry | null>(
    null
  );

  const { projects } = useResearchProjects();
  const {
    getEntriesForProject,
    createLogEntry,
    updateLogEntry,
    togglePinnedEntry,
    deleteLogEntry,
    refreshLogEntries,
  } = useResearchLog();
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();

  useEffect(() => {
    refreshLogEntries();
  // Refresh localStorage-backed log entries only when navigating between research routes.
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

  const currentProject = project;
  const entries = getEntriesForProject(projectId);
  const pinnedEntries = entries.filter((entry) => entry.pinned);
  const decisions = entries.filter((entry) => entry.entryType === "decision");
  const blockers = entries.filter((entry) => entry.entryType === "blocker");
  const nextActions = entries.filter(
    (entry) => entry.entryType === "next-action"
  );
  const resultsEntries = entries.filter((entry) => entry.entryType === "results");

  function openNewEntryModal() {
    setEditingEntry(null);
    setIsLogModalOpen(true);
  }

  function openEditEntryModal(entry: ResearchLogEntry) {
    setEditingEntry(entry);
    setIsLogModalOpen(true);
  }

  function closeLogModal() {
    setEditingEntry(null);
    setIsLogModalOpen(false);
  }

  function handleSaveEntry(input: ResearchLogEntryInput) {
    if (editingEntry) {
      updateLogEntry(editingEntry.id, input);
      return;
    }

    createLogEntry(input);
  }

  function handleAddLogEntryToToday(entry: ResearchLogEntry) {
    addLinkedTaskToToday({
      source: "research-log-follow-up",
      sourceId: entry.id,
      title: entry.title,
      area: "Research",
      spoonCost: 1,
      priority: "Medium",
      notes: entry.body
        ? `From research log for ${currentProject.title}\n${entry.body}`
        : `From research log for ${currentProject.title}`,
      projectId,
      taskType: "research",
      nextAction: entry.title,
      lowEnergyFriendly: true,
      estimatedMinutes: 20,
    });
  }

  return (
    <section className="research-page page-stack">
      <div className="research-hero-panel">
        <div>
          <Link className="research-secondary-link" to={`/research/${projectId}`}>
            ← Back to {currentProject.shortName}
          </Link>

          <p className="eyebrow">{currentProject.shortName}</p>
          <h1>Research Log</h1>
          <p>
            This is the project memory. Capture decisions, blockers, ideas,
            progress notes, and restart breadcrumbs.
          </p>
        </div>

        <div className="research-hero-panel__actions">
          <button
            className="research-primary-button"
            type="button"
            onClick={openNewEntryModal}
          >
            + Add Log Entry
          </button>
        </div>
      </div>

      <ResearchProjectSubnav projectId={projectId} />

      <div className="research-task-summary">
        <span>{entries.length} entries</span>
        <span>{pinnedEntries.length} pinned</span>
        <span>{decisions.length} decisions</span>
        <span>{blockers.length} blockers</span>
        <span>{nextActions.length} next actions</span>
        <span>{resultsEntries.length} results</span>
      </div>

      <section className="research-log-list">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className={`research-log-card research-log-card--${entry.entryType}`}
          >
            <div className="research-log-card__header">
              <div>
                <p className="research-log-card__eyebrow">
                  {entry.pinned ? "Pinned · " : ""}
                  {entryTypeLabels[entry.entryType]} ·{" "}
                  {formatEntryDate(entry.createdAt)}
                </p>

                <h2>{entry.title}</h2>
              </div>

              <button
                className="research-chip-button"
                type="button"
                onClick={() => togglePinnedEntry(entry.id)}
              >
                {entry.pinned ? "Unpin" : "Pin"}
              </button>
            </div>

            {entry.entryType === "results" ? (
              <div className="research-results-entry">
                <div className="research-results-entry__meta">
                  {entry.doFile ? <span>Script: {entry.doFile}</span> : null}
                  {entry.folderPath ? <span>Path: {entry.folderPath}</span> : null}
                  {entry.datasetUsed ? (
                    <span>Dataset: {entry.datasetUsed}</span>
                  ) : null}
                  {entry.outputLabel ? (
                    <span>Output: {entry.outputLabel}</span>
                  ) : null}
                  {entry.outputType ? (
                    <span>Type: {outputTypeLabels[entry.outputType]}</span>
                  ) : null}
                  {entry.runDate ? <span>Run: {entry.runDate}</span> : null}
                  {entry.versionCheckpoint ? (
                    <span>Version: {entry.versionCheckpoint}</span>
                  ) : null}
                  {entry.tags?.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>

                {entry.commandNotes ? (
                  <p className="research-log-card__body">
                    <strong>Command notes:</strong> {entry.commandNotes}
                  </p>
                ) : null}

                {entry.resultBlocks?.length ? (
                  <div className="research-result-block-list">
                    {entry.resultBlocks.map((block) => (
                      <section
                        key={block.id}
                        className={`research-result-block research-result-block--${block.type}`}
                      >
                        {block.title ? <h3>{block.title}</h3> : null}

                        {block.type === "stata" ? (
                          <pre className="research-result-stata-output">
                            {block.text || block.plainText}
                          </pre>
                        ) : null}

                        {block.type === "excel-table" ? (
                          <div className="research-result-table-output">
                            {block.html ? (
                              <div
                                dangerouslySetInnerHTML={{ __html: block.html }}
                              />
                            ) : (
                              <pre>{block.plainText}</pre>
                            )}
                          </div>
                        ) : null}

                        {block.type === "image" && block.imageDataUrl ? (
                          <figure className="research-result-figure-output">
                            <img
                              src={block.imageDataUrl}
                              alt={block.caption || block.title || "Result figure"}
                            />
                            {block.caption ? (
                              <figcaption>{block.caption}</figcaption>
                            ) : null}
                          </figure>
                        ) : null}

                        {block.type === "note" && block.text ? (
                          <p className="research-log-card__body">{block.text}</p>
                        ) : null}
                      </section>
                    ))}
                  </div>
                ) : null}

                <p className="research-log-card__body">
                  <strong>Interpretation:</strong> {entry.body}
                </p>
              </div>
            ) : (
              <p className="research-log-card__body">{entry.body}</p>
            )}

            <div className="research-project-card__actions">
              <button
                className="research-chip-button"
                type="button"
                onClick={() => openEditEntryModal(entry)}
              >
                Edit
              </button>

              {entry.entryType === "next-action" ? (
                <button
                  className="research-chip-button"
                  type="button"
                  disabled={isSourceOnToday("research-log-follow-up", entry.id)}
                  onClick={() => handleAddLogEntryToToday(entry)}
                >
                  {isSourceOnToday("research-log-follow-up", entry.id)
                    ? "On Today"
                    : "Add to Today"}
                </button>
              ) : null}

              <button
                className="research-chip-button research-chip-button--danger"
                type="button"
                onClick={() => deleteLogEntry(entry.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {entries.length === 0 ? (
          <div className="research-empty-state">
            No log entries yet. Add one sentence about what future you needs to
            remember.
          </div>
        ) : null}
      </section>

      {isLogModalOpen ? (
        <ResearchLogEntryModal
          projectId={projectId}
          entry={editingEntry ?? undefined}
          onClose={closeLogModal}
          onSaveEntry={handleSaveEntry}
        />
      ) : null}
    </section>
  );
}
