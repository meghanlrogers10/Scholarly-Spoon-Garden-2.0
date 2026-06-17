import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ResearchDraftModal } from "../components/ResearchDraftModal";
import { ResearchProjectSubnav } from "../components/ResearchProjectSubnav";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { useResearchDrafts } from "../hooks/useResearchDrafts";
import { useResearchProjects } from "../hooks/useResearchProjects";
import type {
  ResearchDraft,
  ResearchDraftInput,
  ResearchDraftStatus,
} from "../types";

const draftStatusLabels: Record<ResearchDraftStatus, string> = {
  "not-started": "Not started",
  sketching: "Sketching",
  drafting: "Drafting",
  revising: "Revising",
  waiting: "Waiting",
  done: "Done",
  parked: "Parked",
};

type DraftStatusFilter = "all" | ResearchDraftStatus;
type DraftSectionFilter = "all" | string;

function formatDraftDate(value?: string) {
  if (!value) {
    return "Not logged";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeLink(value: string) {
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return `https://${value}`;
  }

  return value;
}

function slugifyFilename(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "draft-map"
  );
}

function draftMatchesSearch(draft: ResearchDraft, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();

  return [
    draft.title,
    draft.section,
    draft.status,
    draft.link,
    draft.versionLabel,
    draft.versionNotes,
    draft.whereLeftOff,
    draft.nextWritingMove,
    draft.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function buildDraftMapMarkdown(projectTitle: string, drafts: ResearchDraft[]) {
  const sections = drafts.map((draft) =>
    [
      `## ${draft.section}: ${draft.title}`,
      `- Status: ${draftStatusLabels[draft.status]}`,
      draft.versionLabel ? `- Version: ${draft.versionLabel}` : undefined,
      draft.lastWorkedAt ? `- Last worked: ${draft.lastWorkedAt}` : undefined,
      draft.link ? `- Document: ${draft.link}` : undefined,
      draft.whereLeftOff ? `- Where I left off: ${draft.whereLeftOff}` : undefined,
      draft.nextWritingMove
        ? `- Next writing move: ${draft.nextWritingMove}`
        : undefined,
      draft.versionNotes ? `- Version notes: ${draft.versionNotes}` : undefined,
      draft.notes ? `- Notes: ${draft.notes}` : undefined,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `# ${projectTitle} Draft Map`,
    `Exported: ${new Date().toISOString()}`,
    sections.length > 0 ? sections.join("\n\n") : "_No drafts tracked yet._",
  ].join("\n\n");
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ResearchDraftsPage() {
  const { projectId } = useParams();
  const location = useLocation();

  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<ResearchDraft | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DraftStatusFilter>("all");
  const [sectionFilter, setSectionFilter] = useState<DraftSectionFilter>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const { projects } = useResearchProjects();
  const {
    getDraftsForProject,
    createDraft,
    updateDraft,
    togglePinnedDraft,
    deleteDraft,
    refreshDrafts,
  } = useResearchDrafts();
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();

  useEffect(() => {
    refreshDrafts();
  // Refresh localStorage-backed drafts only when navigating between research routes.
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
  const drafts = getDraftsForProject(projectId);
  const pinnedDrafts = drafts.filter((draft) => draft.pinned);
  const activeDrafts = drafts.filter(
    (draft) => ["sketching", "drafting", "revising"].includes(draft.status)
  );
  const completeDrafts = drafts.filter((draft) => draft.status === "done");
  const sectionOptions = Array.from(
    new Set(drafts.map((draft) => draft.section).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const restartDraft =
    pinnedDrafts.find((draft) => draft.nextWritingMove || draft.whereLeftOff) ??
    activeDrafts.find((draft) => draft.nextWritingMove || draft.whereLeftOff) ??
    drafts.find((draft) => draft.nextWritingMove || draft.whereLeftOff);
  const filteredDrafts = drafts.filter((draft) => {
    const matchesStatus =
      statusFilter === "all" || draft.status === statusFilter;
    const matchesSection =
      sectionFilter === "all" || draft.section === sectionFilter;
    const matchesPinned = !pinnedOnly || draft.pinned;

    return (
      matchesStatus &&
      matchesSection &&
      matchesPinned &&
      draftMatchesSearch(draft, searchTerm)
    );
  });

  function openNewDraftModal() {
    setEditingDraft(null);
    setIsDraftModalOpen(true);
  }

  function openEditDraftModal(draft: ResearchDraft) {
    setEditingDraft(draft);
    setIsDraftModalOpen(true);
  }

  function closeDraftModal() {
    setEditingDraft(null);
    setIsDraftModalOpen(false);
  }

  function handleSaveDraft(input: ResearchDraftInput) {
    if (editingDraft) {
      updateDraft(editingDraft.id, input);
      return;
    }

    createDraft(input);
  }

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setSectionFilter("all");
    setPinnedOnly(false);
  }

  function handleExportDraftMap() {
    downloadTextFile(
      `${slugifyFilename(
        currentProject.shortName || currentProject.title
      )}-draft-map.md`,
      buildDraftMapMarkdown(currentProject.title, drafts),
      "text/markdown"
    );
  }

  function handleAddDraftMoveToToday(draft: ResearchDraft) {
    if (!draft.nextWritingMove) {
      return;
    }

    addLinkedTaskToToday({
      source: "draft-next-move",
      sourceId: draft.id,
      title: draft.nextWritingMove,
      area: "Research",
      spoonCost: 2,
      priority: draft.pinned ? "High" : "Medium",
      notes: [
        `Draft: ${draft.title}`,
        `Section: ${draft.section}`,
        draft.whereLeftOff ? `Where left off: ${draft.whereLeftOff}` : undefined,
        draft.link ? `Link: ${draft.link}` : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
      projectId,
      taskType: "writing",
      nextAction: draft.nextWritingMove,
      estimatedMinutes: 30,
      lowEnergyFriendly: true,
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
          <h1>Drafts</h1>
          <p>
            Track manuscript sections, current versions, links, and where you
            left off. This is a map, not a filing cabinet.
          </p>
        </div>

        <div className="research-hero-panel__actions">
          <button
            className="research-primary-button"
            type="button"
            onClick={openNewDraftModal}
          >
            + Add Draft
          </button>

          <button
            className="research-secondary-button"
            type="button"
            onClick={handleExportDraftMap}
          >
            Export Draft Map
          </button>
        </div>
      </div>

      <ResearchProjectSubnav projectId={projectId} />

      <div className="research-task-summary">
        <span>{drafts.length} drafts</span>
        <span>{activeDrafts.length} active</span>
        <span>{completeDrafts.length} complete</span>
        <span>{pinnedDrafts.length} pinned</span>
      </div>

      {restartDraft ? (
        <section className="research-draft-restart-panel">
          <div>
            <p className="research-draft-card__eyebrow">Restart writing</p>
            <h2>{restartDraft.title}</h2>
            <p>{restartDraft.section}</p>
          </div>

          <div className="research-draft-restart-panel__grid">
            <div>
              <span>Where I left off</span>
              <p>{restartDraft.whereLeftOff || "No stopping point logged yet."}</p>
            </div>

            <div>
              <span>Next writing move</span>
              <p>{restartDraft.nextWritingMove || "Add the next concrete move."}</p>
            </div>
          </div>

          {restartDraft.link ? (
            <a
              className="research-open-button"
              href={normalizeLink(restartDraft.link)}
              target="_blank"
              rel="noreferrer"
            >
              Open document
            </a>
          ) : null}
        </section>
      ) : null}

      <section className="research-task-filter-panel">
        <div>
          <p className="research-task-filter-panel__eyebrow">Draft filters</p>
          <h2>Find the section you can restart.</h2>
        </div>

        <div className="research-task-filter-grid">
          <label>
            <span>Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search section, link, next move, notes..."
            />
          </label>

          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as DraftStatusFilter)
              }
            >
              <option value="all">All statuses</option>
              {Object.entries(draftStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Section</span>
            <select
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
            >
              <option value="all">All sections</option>
              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </label>

          <label className="research-checkbox-label">
            <input
              type="checkbox"
              checked={pinnedOnly}
              onChange={(event) => setPinnedOnly(event.target.checked)}
            />
            <span>Pinned only</span>
          </label>
        </div>

        <div className="research-task-filter-actions">
          <button
            className="research-chip-button"
            type="button"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      </section>

      <section className="research-draft-list">
        {filteredDrafts.map((draft) => (
          <article
            key={draft.id}
            className={`research-draft-card research-draft-card--${draft.status}`}
          >
            <div className="research-draft-card__header">
              <div>
                <p className="research-draft-card__eyebrow">
                  {draft.pinned ? "Pinned · " : ""}
                  {draft.section} · {draftStatusLabels[draft.status]}
                </p>

                <h2>{draft.title}</h2>
              </div>

              <button
                className="research-chip-button"
                type="button"
                onClick={() => togglePinnedDraft(draft.id)}
              >
                {draft.pinned ? "Unpin" : "Pin"}
              </button>
            </div>

            <div className="research-draft-card__meta">
              <span>{draftStatusLabels[draft.status]}</span>
              <span>Last worked: {formatDraftDate(draft.lastWorkedAt)}</span>
              {draft.versionLabel ? (
                <span>Version: {draft.versionLabel}</span>
              ) : null}

              {draft.link ? (
                <a
                  href={normalizeLink(draft.link)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open link
                </a>
              ) : (
                <span>No link yet</span>
              )}
            </div>

            {draft.whereLeftOff || draft.nextWritingMove ? (
              <div className="research-draft-card__restart">
                <div>
                  <span>Where I left off</span>
                  <p>{draft.whereLeftOff || "No stopping point logged."}</p>
                </div>
                <div>
                  <span>Next writing move</span>
                  <p>{draft.nextWritingMove || "No next move logged."}</p>
                </div>
              </div>
            ) : null}

            {draft.versionNotes ? (
              <p className="research-draft-card__notes">
                <strong>Version notes:</strong> {draft.versionNotes}
              </p>
            ) : null}

            {draft.notes ? (
              <p className="research-draft-card__notes">{draft.notes}</p>
            ) : null}

            <div className="research-project-card__actions">
              <button
                className="research-chip-button"
                type="button"
                onClick={() => openEditDraftModal(draft)}
              >
                Edit
              </button>

              {draft.nextWritingMove && draft.status !== "done" ? (
                <button
                  className="research-chip-button"
                  type="button"
                  disabled={isSourceOnToday("draft-next-move", draft.id)}
                  onClick={() => handleAddDraftMoveToToday(draft)}
                >
                  {isSourceOnToday("draft-next-move", draft.id)
                    ? "On Today"
                    : "Add to Today"}
                </button>
              ) : null}

              <button
                className="research-chip-button research-chip-button--danger"
                type="button"
                onClick={() => deleteDraft(draft.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {drafts.length === 0 ? (
          <div className="research-empty-state">
            No drafts tracked yet. Add the current manuscript file or section so
            future you knows where to restart.
          </div>
        ) : null}

        {drafts.length > 0 && filteredDrafts.length === 0 ? (
          <div className="research-empty-state">
            No drafts match these filters.
          </div>
        ) : null}
      </section>

      {isDraftModalOpen ? (
        <ResearchDraftModal
          projectId={projectId}
          draft={editingDraft ?? undefined}
          onClose={closeDraftModal}
          onSaveDraft={handleSaveDraft}
        />
      ) : null}
    </section>
  );
}
