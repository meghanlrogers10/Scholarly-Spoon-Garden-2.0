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

function escapeExportHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br />");
}

function entryExportHtml(entry: ResearchLogEntry) {
  const body = entry.bodyHtml || escapeExportHtml(entry.body);
  const source = entry.sourceFile
    ? `<p class="source"><strong>Source:</strong> <a href="${entry.sourceFile.dataUrl}">${escapeExportHtml(entry.sourceFile.name)}</a></p>`
    : "";
  const attachments = (entry.attachments ?? [])
    .map((attachment) =>
      attachment.mimeType.startsWith("image/")
        ? `<figure><img src="${attachment.dataUrl}" alt="${escapeExportHtml(attachment.name)}" /><figcaption>${escapeExportHtml(attachment.name)}</figcaption></figure>`
        : `<p><a href="${attachment.dataUrl}">${escapeExportHtml(attachment.name)}</a></p>`,
    )
    .join("");

  return `<article><p class="meta">${escapeExportHtml(entry.branch || "Main")} · ${escapeExportHtml(entry.entryType)} · ${escapeExportHtml(formatEntryDate(entry.createdAt))}</p><h2>${escapeExportHtml(entry.title)}</h2>${source}<div>${body}</div>${attachments}</article>`;
}

function buildResearchLogExport(projectTitle: string, entries: ResearchLogEntry[]) {
  const branchNames = Array.from(new Set(entries.map((entry) => entry.branch || "Main")));
  const sections = branchNames
    .map((branchName) => {
      const branchEntries = entries.filter(
        (entry) => (entry.branch || "Main") === branchName,
      );
      return `<section><h1>${escapeExportHtml(branchName)}</h1>${branchEntries
        .map(entryExportHtml)
        .join("")}</section>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeExportHtml(projectTitle)} Research Log</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;line-height:1.5;color:#202b2c}article{border-top:1px solid #ccd5d3;padding:24px 0}h1{margin-top:40px}.meta,.source{color:#60706e;font-size:14px}img{max-width:100%;height:auto}figure{margin:18px 0}figcaption{color:#60706e;font-size:13px}</style></head><body><h1>${escapeExportHtml(projectTitle)} Research Log</h1><p>Exported ${escapeExportHtml(new Date().toLocaleString())}</p>${sections}</body></html>`;
}

function downloadResearchExport(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function ResearchLogPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ResearchLogEntry | null>(
    null
  );
  const [selectedBranch, setSelectedBranch] = useState("Main");
  const [newBranchName, setNewBranchName] = useState("");
  const [editingBranchName, setEditingBranchName] = useState<string | null>(null);
  const [branchRenameValue, setBranchRenameValue] = useState("");
  const [branchError, setBranchError] = useState("");

  const { projects } = useResearchProjects();
  const {
    getEntriesForProject,
    createLogEntry,
    updateLogEntry,
    togglePinnedEntry,
    renameBranch,
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
  const branchNames = Array.from(
    new Set(
      entries.length > 0
        ? entries.map((entry) => entry.branch || "Main")
        : ["Main"],
    ),
  );
  const activeBranch = branchNames.includes(selectedBranch) ? selectedBranch : "Main";
  const visibleEntries = entries.filter(
    (entry) => (entry.branch || "Main") === activeBranch,
  );
  const pinnedEntries = entries.filter((entry) => entry.pinned);
  const decisions = entries.filter((entry) => entry.entryType === "decision");
  const blockers = entries.filter((entry) => entry.entryType === "blocker");
  const resultsEntries = entries.filter((entry) => entry.entryType === "results");

  function openNewEntryModal() {
    setEditingEntry(null);
    setIsLogModalOpen(true);
  }

  function handleCreateBranch() {
    const cleanedName = newBranchName.trim();

    if (!cleanedName) {
      return;
    }

    if (branchNames.includes(cleanedName)) {
      setSelectedBranch(cleanedName);
      setNewBranchName("");
      return;
    }

    setSelectedBranch(cleanedName);
    setNewBranchName("");
    setEditingEntry(null);
    setIsLogModalOpen(true);
  }

  function startRenamingBranch(branchName: string) {
    setEditingBranchName(branchName);
    setBranchRenameValue(branchName);
    setBranchError("");
  }

  function saveRenamedBranch() {
    if (!editingBranchName) {
      return;
    }

    const cleanedName = branchRenameValue.trim();

    if (!cleanedName) {
      setBranchError("Branch name cannot be empty.");
      return;
    }

    if (cleanedName !== editingBranchName && branchNames.includes(cleanedName)) {
      setBranchError("That branch name is already in use.");
      return;
    }

    renameBranch(currentProject.id, editingBranchName, cleanedName);
    setSelectedBranch(cleanedName);
    setEditingBranchName(null);
    setBranchRenameValue("");
    setBranchError("");
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

  function exportResearchLog(format: "html" | "word" | "print") {
    const html = buildResearchLogExport(currentProject.title, entries);

    if (format === "html") {
      downloadResearchExport(
        `${currentProject.shortName || "research"}-log.html`,
        html,
        "text/html;charset=utf-8",
      );
      return;
    }

    if (format === "word") {
      downloadResearchExport(
        `${currentProject.shortName || "research"}-log.doc`,
        html,
        "application/msword",
      );
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer");

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
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
            className="research-chip-button"
            type="button"
            onClick={() => exportResearchLog("html")}
          >
            Export HTML
          </button>
          <button
            className="research-chip-button"
            type="button"
            onClick={() => exportResearchLog("word")}
          >
            Export Word
          </button>
          <button
            className="research-chip-button"
            type="button"
            onClick={() => exportResearchLog("print")}
          >
            Print / PDF
          </button>
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
        <span>{branchNames.length} branches</span>
        <span>{pinnedEntries.length} pinned</span>
        <span>{decisions.length} decisions</span>
        <span>{blockers.length} blockers</span>
        <span>{resultsEntries.length} results</span>
      </div>

      <section className="research-notebook-shell">
        <aside className="research-branch-sidebar" aria-label="Research log branches">
          <div className="research-branch-sidebar__header">
            <div>
              <p className="eyebrow">Notebook</p>
              <h2>Branches</h2>
            </div>
          </div>
          <div className="research-branch-list">
            {branchNames.map((branchName) =>
              editingBranchName === branchName ? (
                <div className="research-branch-edit-row" key={branchName}>
                  <input
                    value={branchRenameValue}
                    autoFocus
                    onChange={(event) => setBranchRenameValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveRenamedBranch();
                      if (event.key === "Escape") setEditingBranchName(null);
                    }}
                  />
                  <button
                    className="research-chip-button"
                    type="button"
                    onClick={saveRenamedBranch}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="research-branch-row" key={branchName}>
                  <button
                    type="button"
                    className={`research-branch-button${
                      activeBranch === branchName ? " is-active" : ""
                    }`}
                    onClick={() => setSelectedBranch(branchName)}
                  >
                    <span>{branchName}</span>
                    <small>
                      {entries.filter((entry) => (entry.branch || "Main") === branchName).length}
                    </small>
                  </button>
                  <button
                    className="research-branch-rename"
                    type="button"
                    title={`Rename ${branchName}`}
                    aria-label={`Rename ${branchName}`}
                    onClick={() => startRenamingBranch(branchName)}
                  >
                    Rename
                  </button>
                </div>
              ),
            )}
          </div>
          {branchError ? <p className="research-form-error">{branchError}</p> : null}
          <div className="research-branch-create">
            <input
              value={newBranchName}
              onChange={(event) => setNewBranchName(event.target.value)}
              placeholder="New branch"
              onKeyDown={(event) => {
                if (event.key === "Enter") handleCreateBranch();
              }}
            />
            <button
              className="research-chip-button"
              type="button"
              onClick={handleCreateBranch}
              disabled={!newBranchName.trim()}
            >
              + Branch
            </button>
          </div>
        </aside>

        <div className="research-notebook-main">
          <div className="research-notebook-main__header">
            <div>
              <p className="eyebrow">Current branch</p>
              <h2>{activeBranch}</h2>
              <p className="research-muted-copy">
                Paste tables, images, and notes directly into one running research trail.
              </p>
            </div>
            <button
              className="research-primary-button"
              type="button"
              onClick={openNewEntryModal}
            >
              + Add note
            </button>
          </div>

      <section className="research-log-list">
        {visibleEntries.map((entry) => (
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
                <p className="research-log-card__provenance">
                  {entry.branch || "Main"}
                  {entry.sourceFile ? ` · Source: ${entry.sourceFile.name}` : ""}
                </p>
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

                {entry.bodyHtml ? (
                  <div
                    className="research-log-card__body research-log-card__body--rich"
                    dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
                  />
                ) : (
                  <p className="research-log-card__body">
                    <strong>Interpretation:</strong> {entry.body}
                  </p>
                )}
              </div>
            ) : (
              entry.bodyHtml ? (
                <div
                  className="research-log-card__body research-log-card__body--rich"
                  dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
                />
              ) : (
                <p className="research-log-card__body">{entry.body}</p>
              )
            )}

            {entry.sourceFile || entry.attachments?.length ? (
              <div className="research-log-card__files">
                {entry.sourceFile ? (
                  <a
                    className="research-file-link"
                    href={entry.sourceFile.dataUrl}
                    download={entry.sourceFile.name}
                  >
                    Source: {entry.sourceFile.name}
                  </a>
                ) : null}
                {entry.attachments?.map((attachment) =>
                  attachment.mimeType.startsWith("image/") ? (
                    <figure key={attachment.id} className="research-log-attachment-image">
                      <img src={attachment.dataUrl} alt={attachment.name} />
                      <figcaption>{attachment.name}</figcaption>
                    </figure>
                  ) : (
                    <a
                      key={attachment.id}
                      className="research-file-link"
                      href={attachment.dataUrl}
                      download={attachment.name}
                    >
                      {attachment.name}
                    </a>
                  ),
                )}
              </div>
            ) : null}

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

        {visibleEntries.length === 0 ? (
          <div className="research-empty-state">
            This branch is empty. Add a quick note, paste a table, or attach the
            source file that produced the result.
          </div>
        ) : null}
          </section>
        </div>
      </section>

      {isLogModalOpen ? (
        <ResearchLogEntryModal
          projectId={projectId}
          branchName={editingEntry?.branch ?? activeBranch}
          entry={editingEntry ?? undefined}
          onClose={closeLogModal}
          onSaveEntry={handleSaveEntry}
        />
      ) : null}
    </section>
  );
}
