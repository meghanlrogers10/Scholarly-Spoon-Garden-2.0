import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ResearchFocusBadge } from "../components/ResearchFocusBadge";
import { ResearchProjectSubnav } from "../components/ResearchProjectSubnav";
import { ResearchWorkspaceTile } from "../components/ResearchWorkspaceTile";
import { researchStages } from "../data/researchStages";
import { useResearchDrafts } from "../hooks/useResearchDrafts";
import { useResearchLog } from "../hooks/useResearchLog";
import { useResearchMindMap } from "../hooks/useResearchMindMap";
import { useResearchProjects } from "../hooks/useResearchProjects";
import { useResearchTasks } from "../hooks/useResearchTasks";
import { useResearchSubmissions } from "../hooks/useResearchSubmissions";
import { useResearchLiterature } from "../hooks/useResearchLiterature";
import { useResearchLiteratureNotes } from "../hooks/useResearchLiteratureNotes";
import { useResearchLiteratureReadingNotes } from "../hooks/useResearchLiteratureReadingNotes";
import { useResearchPrisma } from "../hooks/useResearchPrisma";
import { useResearchSynthesis } from "../hooks/useResearchSynthesis";
import {
  buildProjectHtmlPacket,
  buildProjectMarkdownPacket,
  downloadProjectTextFile,
  slugifyProjectFilename,
  type ProjectPacket,
} from "../utils/researchProjectExport";
import type { ResearchLogEntry, ResearchResultBlock } from "../types";

const draftStatusLabels = {
  "not-started": "Not started",
  sketching: "Sketching",
  drafting: "Drafting",
  revising: "Revising",
  waiting: "Waiting",
  done: "Done",
  parked: "Parked",
};

const submissionStatusLabels = {
  targeting: "Targeting",
  preparing: "Preparing",
  submitted: "Submitted",
  "revise-resubmit": "Revise and resubmit",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const activeSubmissionStatuses = [
  "targeting",
  "preparing",
  "submitted",
  "revise-resubmit",
];

const logEntryTypeLabels = {
  progress: "Progress",
  decision: "Decision",
  blocker: "Blocker",
  idea: "Idea",
  "next-action": "Next action",
  results: "Results",
};

const resultOutputTypeLabels = {
  stata: "Stata output",
  "excel-table": "Excel/table",
  figure: "Figure",
  model: "Model",
  text: "Text",
  mixed: "Mixed",
};

type ProjectSearchResultType =
  | "tasks"
  | "log"
  | "drafts"
  | "submissions"
  | "sources"
  | "notes"
  | "prisma"
  | "synthesis"
  | "mindmap";

type ProjectSearchFilter = "all" | ProjectSearchResultType;

type ProjectSearchResult = {
  id: string;
  title: string;
  snippet: string;
  typeLabel: string;
  to: string;
};

type ProjectSearchGroup = {
  key: ProjectSearchResultType;
  label: string;
  results: ProjectSearchResult[];
};

const projectSearchFilterLabels: Record<ProjectSearchFilter, string> = {
  all: "All results",
  tasks: "Tasks",
  log: "Log",
  drafts: "Drafts",
  submissions: "Submissions",
  sources: "Sources",
  notes: "Source Notes",
  prisma: "PRISMA / Screening",
  synthesis: "Synthesis",
  mindmap: "Mind Map",
};

function getTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatShortDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const timestamp = getTimestamp(value);

  if (!timestamp) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function labelFromValue(value: string) {
  return value.replace(/-/g, " ");
}

function searchableText(values: Array<string | number | undefined | string[]>) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string | number => value !== undefined)
    .join(" ")
    .toLowerCase();
}

function matchesSearch(
  query: string,
  values: Array<string | number | undefined | string[]>
) {
  return searchableText(values).includes(query);
}

function resultBlockSearchText(blocks?: ResearchResultBlock[]) {
  return (
    blocks?.flatMap((block) => [
      block.title,
      block.text,
      block.plainText,
      block.caption,
    ]).filter((value): value is string => Boolean(value)) ?? []
  );
}

function resultEntryMeta(entry: ResearchLogEntry) {
  return [
    logEntryTypeLabels[entry.entryType],
    entry.outputLabel,
    entry.outputType ? resultOutputTypeLabels[entry.outputType] : undefined,
    entry.doFile ? `Script: ${entry.doFile}` : undefined,
    entry.datasetUsed ? `Dataset: ${entry.datasetUsed}` : undefined,
    entry.runDate ? `Run ${entry.runDate}` : undefined,
    entry.versionCheckpoint,
    entry.tags?.length ? `Tags: ${entry.tags.join(", ")}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ResearchProjectPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<ProjectSearchFilter>("all");

  const { projects } = useResearchProjects();
  const { getTasksForProject, refreshTasks } = useResearchTasks();
  const { getEntriesForProject, refreshLogEntries } = useResearchLog();
  const { getDraftsForProject, refreshDrafts } = useResearchDrafts();
  const { getSubmissionsForProject, refreshSubmissions } =
    useResearchSubmissions();
  const { getSourcesForProject, refreshSources } = useResearchLiterature();
  const { getNotesForProject, refreshNotes } = useResearchLiteratureNotes();
  const { getReadingNotesForProject, refreshReadingNotes } =
    useResearchLiteratureReadingNotes();
  const { getSectionsForProject, refreshSections } = useResearchSynthesis();
  const { getNodesForProject, refreshNodes } = useResearchMindMap();
  const { getRecordsForProject, getCriteriaForProject, refreshPrisma } =
    useResearchPrisma();

  useEffect(() => {
    refreshTasks();
    refreshLogEntries();
    refreshDrafts();
    refreshSubmissions();
    refreshSources();
    refreshNotes();
    refreshReadingNotes();
    refreshSections();
    refreshNodes();
    refreshPrisma();
  // Refresh localStorage-backed project workspace data only on route transitions.
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
  const projectTasks = getTasksForProject(project.id);
  const completedTasks = projectTasks.filter((task) => task.status === "done");
  const openTasks = projectTasks.filter((task) => task.status !== "done");

  const logEntries = getEntriesForProject(project.id);

  const drafts = getDraftsForProject(project.id);
  const activeDrafts = drafts.filter(
    (draft) => ["sketching", "drafting", "revising"].includes(draft.status)
  );

  const taskMeta =
    projectTasks.length === 0
      ? "No tasks yet"
      : completedTasks.length === projectTasks.length
        ? "All tasks complete"
        : `${completedTasks.length}/${projectTasks.length} complete`;

  const taskDescription =
    openTasks[0]?.title ??
    "All listed tasks are done. Choose the next concrete move.";
  const nextOpenTask = openTasks[0];
  const lowestSpoonOpenTask = [...openTasks].sort((a, b) => {
    if (a.spoonCost !== b.spoonCost) {
      return a.spoonCost - b.spoonCost;
    }

    return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
  })[0];

  const draftMeta =
    drafts.length === 0
      ? "No drafts tracked"
      : `${activeDrafts.length}/${drafts.length} active`;

  const latestLogEntry = [...logEntries].sort(
    (a, b) => getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt)
  )[0];
  const latestDraft = [...drafts].sort(
    (a, b) =>
      getTimestamp(b.lastWorkedAt ?? b.updatedAt) -
      getTimestamp(a.lastWorkedAt ?? a.updatedAt)
  )[0];

  const submissions = getSubmissionsForProject(project.id);
  const activeSubmissions = submissions.filter((submission) =>
    activeSubmissionStatuses.includes(submission.status)
  );
  const activeSubmission = activeSubmissions[0] ?? submissions[0];

  const sources = getSourcesForProject(project.id);
  const notes = getNotesForProject(project.id);
  const readingNotes = getReadingNotesForProject(project.id);
  const synthesisSections = getSectionsForProject(project.id);
  const mindMapNodes = getNodesForProject(project.id);
  const prismaRecords = getRecordsForProject(project.id);
  const prismaCriteria = getCriteriaForProject(project.id);
  const citedSources = sources.filter((source) => source.status === "cited");
  const readSources = sources.filter((source) =>
    ["read", "notes-taken", "cited"].includes(source.status)
  );

  const literatureMeta =
    sources.length === 0
      ? "No sources yet"
      : `${readSources.length}/${sources.length} read · ${citedSources.length} cited`;

  const submissionMeta =
    submissions.length === 0
      ? "Not submitted"
      : `${activeSubmissions.length}/${submissions.length} active`;

  const basePath = `/research/${project.id}`;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const searchGroups: ProjectSearchGroup[] = normalizedSearchTerm
    ? ([
        {
          key: "tasks",
          label: "Tasks",
          results: projectTasks
            .filter((task) =>
              matchesSearch(normalizedSearchTerm, [
                task.title,
                task.notes,
                task.status,
                task.priority,
                researchStages[task.stageKey],
              ])
            )
            .map((task) => ({
              id: task.id,
              title: task.title,
              snippet: `${researchStages[task.stageKey]} · ${labelFromValue(
                task.status
              )} · ${task.priority} priority · ${task.spoonCost} spoon${
                task.spoonCost === 1 ? "" : "s"
              }`,
              typeLabel: "Task",
              to: `${basePath}/tasks`,
            })),
        },
        {
          key: "log",
          label: "Log",
          results: logEntries
            .filter((entry) =>
              matchesSearch(normalizedSearchTerm, [
                entry.title,
                entry.body,
                entry.entryType,
                entry.doFile,
                entry.folderPath,
                entry.datasetUsed,
                entry.outputLabel,
                entry.outputType,
                entry.commandNotes,
                entry.versionCheckpoint,
                entry.tags,
                resultBlockSearchText(entry.resultBlocks),
              ])
            )
            .map((entry) => ({
              id: entry.id,
              title: entry.title,
              snippet: `${resultEntryMeta(entry) || labelFromValue(entry.entryType)} · ${
                formatShortDate(entry.updatedAt) ?? "No date"
              }`,
              typeLabel: "Log",
              to: `${basePath}/notes`,
            })),
        },
        {
          key: "drafts",
          label: "Drafts",
          results: drafts
            .filter((draft) =>
              matchesSearch(normalizedSearchTerm, [
                draft.title,
                draft.section,
                draft.notes,
                draft.link,
                draft.versionLabel,
                draft.versionNotes,
                draft.whereLeftOff,
                draft.nextWritingMove,
                draft.status,
              ])
            )
            .map((draft) => ({
              id: draft.id,
              title: draft.title,
              snippet: `${draft.section} · ${draftStatusLabels[draft.status]}`,
              typeLabel: "Draft",
              to: `${basePath}/drafts`,
            })),
        },
        {
          key: "submissions",
          label: "Submissions",
          results: submissions
            .filter((submission) =>
              matchesSearch(normalizedSearchTerm, [
                submission.journalName,
                submission.status,
                submission.manuscriptVersion,
                submission.nextAction,
                submission.notes,
              ])
            )
            .map((submission) => ({
              id: submission.id,
              title: submission.journalName,
              snippet: `${submissionStatusLabels[submission.status]}${
                submission.nextAction ? ` · ${submission.nextAction}` : ""
              }`,
              typeLabel: "Submission",
              to: `${basePath}/journals`,
            })),
        },
        {
          key: "sources",
          label: "Sources",
          results: sources
            .filter((source) =>
              matchesSearch(normalizedSearchTerm, [
                source.title,
                source.authors,
                source.year,
                source.themes,
                source.keyQuote,
                source.notes,
                source.status,
                source.sourceType,
              ])
            )
            .map((source) => ({
              id: source.id,
              title: source.title,
              snippet:
                [source.authors, source.year].filter(Boolean).join(" · ") ||
                `${labelFromValue(source.sourceType)} · ${labelFromValue(
                  source.status
                )}`,
              typeLabel: "Source",
              to: `${basePath}/literature`,
            })),
        },
        {
          key: "notes",
          label: "Source Notes",
          results: [
            ...notes
            .filter((note) =>
              matchesSearch(normalizedSearchTerm, [
                note.title,
                note.body,
                note.noteKind,
                note.sourceTitle,
                note.themes,
                note.keyQuote,
                note.argumentSlot,
              ])
            )
            .map((note) => ({
              id: note.id,
              title: note.title,
              snippet: `${labelFromValue(note.noteKind)}${
                note.sourceTitle ? ` · ${note.sourceTitle}` : ""
              }`,
              typeLabel: "Source Note",
              to: `${basePath}/literature`,
            })),
            ...readingNotes
              .filter((note) =>
                matchesSearch(normalizedSearchTerm, [
                  note.sourceTitle,
                  Object.values(note.sections).join(" "),
                  note.extractedThemes,
                  note.manualThemes,
                ])
              )
              .map((note) => ({
                id: note.id,
                title: note.sourceTitle,
                snippet: `Reading lab notes${
                  [...note.extractedThemes, ...note.manualThemes].length > 0
                    ? ` · ${[...note.extractedThemes, ...note.manualThemes].join(
                        ", "
                      )}`
                    : ""
                }`,
                typeLabel: "Reading Notes",
                to: `${basePath}/literature`,
              })),
          ],
        },
        {
          key: "prisma",
          label: "PRISMA / Screening",
          results: prismaRecords
            .filter((record) =>
              matchesSearch(normalizedSearchTerm, [
                record.sourceTitle,
                record.status,
                record.exclusionReason,
                record.inclusionNotes,
                record.screeningNotes,
                record.database,
                record.sourceOrigin,
                record.searchString,
              ])
            )
            .map((record) => ({
              id: record.id,
              title: record.sourceTitle ?? "Untitled screening record",
              snippet: `${labelFromValue(record.status)}${
                record.exclusionReason
                  ? ` · ${record.exclusionReason}`
                  : ""
              }`,
              typeLabel: "PRISMA",
              to: `${basePath}/literature`,
            })),
        },
        {
          key: "synthesis",
          label: "Synthesis",
          results: synthesisSections
            .filter((section) =>
              matchesSearch(normalizedSearchTerm, [
                section.title,
                section.claim,
                section.themes,
                section.draftNote,
                section.status,
              ])
            )
            .map((section) => ({
              id: section.id,
              title: section.title,
              snippet: `${labelFromValue(section.status)}${
                section.themes.length > 0
                  ? ` · ${section.themes.join(", ")}`
                  : ""
              }`,
              typeLabel: "Synthesis",
              to: `${basePath}/literature`,
            })),
        },
        {
          key: "mindmap",
          label: "Mind Map",
          results: mindMapNodes
            .filter((node) =>
              matchesSearch(normalizedSearchTerm, [
                node.title,
                node.body,
                node.nodeType,
                node.sourceTitle,
                node.noteTitle,
                node.synthesisSectionTitle,
                node.relatedThemes,
              ])
            )
            .map((node) => ({
              id: node.id,
              title: node.title,
              snippet: `${labelFromValue(node.nodeType)}${
                node.sourceTitle ||
                node.noteTitle ||
                node.synthesisSectionTitle ||
                node.relatedThemes?.length
                  ? ` · ${[
                      node.sourceTitle,
                      node.noteTitle,
                      node.synthesisSectionTitle,
                      node.relatedThemes?.join(", "),
                    ]
                      .filter(Boolean)
                      .join(" · ")}`
                  : ""
              }`,
              typeLabel: "Mind Map",
              to: `${basePath}/literature`,
            })),
        },
      ] satisfies ProjectSearchGroup[]).filter(
        (group) => searchFilter === "all" || group.key === searchFilter
      )
    : [];
  const totalSearchResults = searchGroups.reduce(
    (total, group) => total + group.results.length,
    0
  );
  const filenameBase = slugifyProjectFilename(
    currentProject.shortName || currentProject.title
  );

  function buildProjectPacket(): ProjectPacket {
    const exportedAt = new Date().toISOString();
    const lowestSpoonRestartTasks = [...openTasks]
      .sort((a, b) => {
        if (a.spoonCost !== b.spoonCost) {
          return a.spoonCost - b.spoonCost;
        }

        return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
      })
      .slice(0, 5);

    return {
      title: currentProject.title,
      description: currentProject.description,
      exportedAt,
      summary: [
        {
          label: "Current stage",
          value: researchStages[currentProject.currentStage],
        },
        {
          label: "Next open task",
          value: nextOpenTask?.title ?? "No open tasks",
        },
        {
          label: "Lowest-spoon task",
          value: lowestSpoonOpenTask
            ? `${lowestSpoonOpenTask.title} (${lowestSpoonOpenTask.spoonCost} spoon${
                lowestSpoonOpenTask.spoonCost === 1 ? "" : "s"
              })`
            : "No open tasks",
        },
        {
          label: "Latest log entry",
          value: latestLogEntry?.title ?? "No log entries",
        },
        {
          label: "Latest draft",
          value: latestDraft?.title ?? "No drafts",
        },
        {
          label: "Submission status",
          value: activeSubmission
            ? `${activeSubmission.journalName}: ${
                submissionStatusLabels[activeSubmission.status]
              }`
            : currentProject.targetJournal ?? "No journal selected",
        },
        {
          label: "Literature",
          value: `${sources.length} sources, ${
            notes.length + readingNotes.length
          } source notes, ${synthesisSections.length} synthesis sections, ${
            mindMapNodes.length
          } mind map nodes`,
        },
      ],
      sections: [
        {
          title: "Open Tasks",
          items: openTasks.map((task) => ({
            title: task.title,
            meta: `${researchStages[task.stageKey]} · ${labelFromValue(
              task.status
            )} · ${task.priority} priority · ${task.spoonCost} spoon${
              task.spoonCost === 1 ? "" : "s"
            }${task.dueDate ? ` · Due ${task.dueDate}` : ""}`,
            body: task.notes,
          })),
        },
        {
          title: "Lowest-Spoon Restart Tasks",
          items: lowestSpoonRestartTasks.map((task) => ({
            title: task.title,
            meta: `${task.spoonCost} spoon${
              task.spoonCost === 1 ? "" : "s"
            } · ${researchStages[task.stageKey]} · ${task.priority} priority`,
            body: task.notes,
          })),
        },
        {
          title: "Research Log Entries",
          items: logEntries.map((entry) => ({
            title: entry.title,
            meta: `${resultEntryMeta(entry) || labelFromValue(entry.entryType)} · ${
              formatShortDate(entry.updatedAt) ?? "No date"
            }${entry.pinned ? " · pinned" : ""}`,
            body:
              entry.entryType === "results"
                ? [
                    entry.commandNotes
                      ? `Command notes: ${entry.commandNotes}`
                      : undefined,
                    entry.body ? `Interpretation: ${entry.body}` : undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : entry.body,
            resultBlocks: entry.resultBlocks,
          })),
        },
        {
          title: "Drafts",
          items: drafts.map((draft) => ({
            title: draft.title,
            meta: `${draft.section} · ${draftStatusLabels[draft.status]}${
              draft.versionLabel ? ` · ${draft.versionLabel}` : ""
            }${
              draft.lastWorkedAt ? ` · Last worked ${draft.lastWorkedAt}` : ""
            }${draft.link ? ` · ${draft.link}` : ""}`,
            body: [
              draft.whereLeftOff ? `Where left off: ${draft.whereLeftOff}` : "",
              draft.nextWritingMove
                ? `Next writing move: ${draft.nextWritingMove}`
                : "",
              draft.versionNotes ? `Version notes: ${draft.versionNotes}` : "",
              draft.notes,
            ]
              .filter(Boolean)
              .join(" · "),
          })),
        },
        {
          title: "Submissions and Journal Records",
          items: submissions.map((submission) => ({
            title: submission.journalName,
            meta: `${submissionStatusLabels[submission.status]}${
              submission.manuscriptVersion
                ? ` · ${submission.manuscriptVersion}`
                : ""
            }${submission.submittedAt ? ` · Submitted ${submission.submittedAt}` : ""}${
              submission.decisionAt ? ` · Decision ${submission.decisionAt}` : ""
            }`,
            body: [submission.nextAction, submission.notes]
              .filter(Boolean)
              .join(" · "),
          })),
        },
        {
          title: "Literature Source Summary",
          items: sources.map((source) => ({
            title: source.title,
            meta:
              [
                source.authors,
                source.year,
                labelFromValue(source.sourceType),
                labelFromValue(source.status),
                source.themes.length > 0
                  ? `Themes: ${source.themes.join(", ")}`
                  : undefined,
              ]
                .filter(Boolean)
                .join(" · ") || undefined,
            body: [source.keyQuote, source.notes].filter(Boolean).join(" · "),
          })),
        },
        {
          title: "PRISMA / Screening",
          items: [
            {
              title: "Screening Summary",
              meta: [
                `Identified: ${
                  prismaRecords.filter((record) => record.status === "identified")
                    .length
                }`,
                `Screened: ${
                  prismaRecords.filter((record) => record.status === "screened")
                    .length
                }`,
                `Eligible: ${
                  prismaRecords.filter((record) => record.status === "eligible")
                    .length
                }`,
                `Included: ${
                  prismaRecords.filter((record) => record.status === "included")
                    .length
                }`,
                `Excluded: ${
                  prismaRecords.filter((record) => record.status === "excluded")
                    .length
                }`,
              ].join(" · "),
              body: [
                prismaCriteria.inclusionCriteria.length
                  ? `Inclusion criteria: ${prismaCriteria.inclusionCriteria.join(
                      "; "
                    )}`
                  : "",
                prismaCriteria.exclusionCriteria.length
                  ? `Exclusion criteria: ${prismaCriteria.exclusionCriteria.join(
                      "; "
                    )}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · "),
            },
            ...prismaRecords.map((record) => ({
              title: record.sourceTitle ?? "Untitled screening record",
              meta: `${record.status}${
                record.database ? ` · ${record.database}` : ""
              }${record.screenedAt ? ` · Screened ${record.screenedAt}` : ""}`,
              body: [
                record.exclusionReason
                  ? `Exclusion: ${record.exclusionReason}`
                  : "",
                record.inclusionNotes ? `Inclusion: ${record.inclusionNotes}` : "",
                record.screeningNotes ? `Notes: ${record.screeningNotes}` : "",
              ]
                .filter(Boolean)
                .join(" · "),
            })),
          ],
        },
        {
          title: "Source Notes",
          items: notes.map((note) => ({
            title: note.title,
            meta: `${labelFromValue(note.noteKind)}${
              note.sourceTitle ? ` · ${note.sourceTitle}` : ""
            }${
              note.themes.length > 0 ? ` · Themes: ${note.themes.join(", ")}` : ""
            }`,
            body: [note.keyQuote, note.body, note.argumentSlot]
              .filter(Boolean)
              .join(" · "),
          })),
        },
        {
          title: "Reading Notes Lab Documents",
          items: readingNotes.map((note) => ({
            title: note.sourceTitle,
            meta: [
              note.extractedThemes.length > 0
                ? `Inline themes: ${note.extractedThemes.join(", ")}`
                : undefined,
              note.manualThemes.length > 0
                ? `Manual themes: ${note.manualThemes.join(", ")}`
                : undefined,
            ]
              .filter(Boolean)
              .join(" · "),
            body: Object.entries(note.sections)
              .filter(([, value]) => value.trim())
              .map(([key, value]) => `${labelFromValue(key)}: ${value}`)
              .join(" · "),
          })),
        },
        {
          title: "Synthesis Outline Sections",
          items: synthesisSections.map((section) => ({
            title: section.title,
            meta: `${labelFromValue(section.status)}${
              section.themes.length > 0
                ? ` · Themes: ${section.themes.join(", ")}`
                : ""
            }`,
            body: [section.claim, section.draftNote].filter(Boolean).join(" · "),
          })),
        },
        {
          title: "Mind Map Node Summary",
          items: mindMapNodes.map((node) => ({
            title: node.title,
            meta: `${labelFromValue(node.nodeType)}${
              node.sourceTitle ||
              node.noteTitle ||
              node.synthesisSectionTitle ||
              node.relatedThemes?.length
                ? ` · ${[
                    node.sourceTitle,
                    node.noteTitle,
                    node.synthesisSectionTitle,
                    node.relatedThemes?.join(", "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}`
                : ""
            }`,
            body: node.body,
          })),
        },
      ],
    };
  }

  function handleExportBackupJson() {
    const exportedAt = new Date().toISOString();

    downloadProjectTextFile(
      `${filenameBase}-backup.json`,
      JSON.stringify(
        {
          exportedAt,
          project: currentProject,
          tasks: projectTasks,
          logEntries,
          drafts,
          submissions,
          literatureSources: sources,
          literatureNotes: notes,
          literatureReadingNotes: readingNotes,
          prismaRecords,
          prismaCriteria,
          synthesisSections,
          mindMapNodes,
        },
        null,
        2
      ),
      "application/json"
    );
  }

  function handleExportMarkdownPacket() {
    downloadProjectTextFile(
      `${filenameBase}-project-packet.md`,
      buildProjectMarkdownPacket(buildProjectPacket()),
      "text/markdown"
    );
  }

  function handleExportWordPacket() {
    // Word opens HTML-backed .doc files reliably, so this avoids adding a docx
    // generation dependency while keeping the packet readable and portable.
    downloadProjectTextFile(
      `${filenameBase}-project-packet.doc`,
      buildProjectHtmlPacket(buildProjectPacket()),
      "application/msword"
    );
  }

  function handlePrintPacket() {
    const blob = new Blob([buildProjectHtmlPacket(buildProjectPacket())], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!printWindow) {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <section className="research-page page-stack">
      <div
        className={`research-project-hero research-project-hero--${project.color}`}
      >
        <div>
          <Link className="research-secondary-link" to="/research">
            ← Back to Research
          </Link>

          <div className="research-project-hero__title-row">
            <span className="research-project-hero__short-name">
              {project.shortName}
            </span>
            <ResearchFocusBadge focusLevel={project.focusLevel} />
          </div>

          <h1>{project.title}</h1>
          <p>{project.description}</p>
        </div>

        <div className="research-project-hero__status">
          <span>Current stage</span>
          <strong>{researchStages[project.currentStage]}</strong>
        </div>
      </div>

      <ResearchProjectSubnav projectId={project.id} />

      <section className="research-export-panel" aria-labelledby="project-export-heading">
        <div>
          <p className="eyebrow">Human-readable exports</p>
          <h2 id="project-export-heading">Project packet</h2>
          <p>
            Export a readable snapshot for review, sharing, archiving, or print
            to PDF. Backup JSON is for migration and restore.
          </p>
        </div>

        <div className="research-export-panel__actions">
          <button
            className="research-secondary-button"
            type="button"
            onClick={handleExportBackupJson}
          >
            Export Backup JSON
          </button>
          <button
            className="research-primary-button"
            type="button"
            onClick={handleExportMarkdownPacket}
          >
            Export Markdown Packet
          </button>
          <button
            className="research-secondary-button"
            type="button"
            onClick={handleExportWordPacket}
          >
            Export Word Packet
          </button>
          <button
            className="research-secondary-button"
            type="button"
            onClick={handlePrintPacket}
          >
            Print / Save as PDF
          </button>
        </div>
      </section>

      <section className="research-command-center" aria-labelledby="command-center-heading">
        <div className="research-command-center__header">
          <div>
            <p className="eyebrow">Restart this project</p>
            <h2 id="command-center-heading">Project command center</h2>
            <p>
              A quick re-entry point for the next task, low-energy options,
              recent context, submissions, and literature coverage.
            </p>
          </div>

          <div className="research-command-center__actions">
            <Link className="research-primary-button" to={`${basePath}/tasks`}>
              Open Tasks
            </Link>
            <Link className="research-secondary-button" to={`${basePath}/literature`}>
              Open Literature
            </Link>
            <Link className="research-secondary-button" to={`${basePath}/drafts`}>
              Open Drafts
            </Link>
            <Link className="research-secondary-button" to={`${basePath}/notes`}>
              Open Log
            </Link>
          </div>
        </div>

        <div className="research-command-center__grid">
          <article className="research-command-card research-command-card--primary">
            <span>Next open task</span>
            <h3>{nextOpenTask?.title ?? "No open tasks"}</h3>
            <p>
              {nextOpenTask
                ? `${researchStages[nextOpenTask.stageKey]} · ${nextOpenTask.spoonCost} spoon${
                    nextOpenTask.spoonCost === 1 ? "" : "s"
                  }`
                : "All tracked tasks are complete."}
            </p>
          </article>

          <article className="research-command-card">
            <span>Lowest-spoon open task</span>
            <h3>{lowestSpoonOpenTask?.title ?? "No low-energy task queued"}</h3>
            <p>
              {lowestSpoonOpenTask
                ? `${lowestSpoonOpenTask.spoonCost} spoon${
                    lowestSpoonOpenTask.spoonCost === 1 ? "" : "s"
                  } · ${researchStages[lowestSpoonOpenTask.stageKey]}`
                : "Add a small task when you want a gentle restart path."}
            </p>
          </article>

          <article className="research-command-card">
            <span>Latest research log</span>
            <h3>{latestLogEntry?.title ?? "No log entries yet"}</h3>
            <p>
              {latestLogEntry
                ? `${latestLogEntry.entryType.replace("-", " ")} · ${
                    formatShortDate(latestLogEntry.updatedAt) ?? "No date"
                  }`
                : "Capture a decision, blocker, idea, or next action."}
            </p>
          </article>

          <article className="research-command-card">
            <span>Latest draft worked on</span>
            <h3>{latestDraft?.title ?? "No drafts tracked yet"}</h3>
            <p>
              {latestDraft
                ? `${draftStatusLabels[latestDraft.status]} · ${
                    formatShortDate(latestDraft.lastWorkedAt ?? latestDraft.updatedAt) ??
                    "No date"
                  }`
                : "Create a draft record when a section starts moving."}
            </p>
          </article>

          <article className="research-command-card">
            <span>Submission status</span>
            <h3>{activeSubmission?.journalName ?? project.targetJournal ?? "No journal selected"}</h3>
            <p>
              {activeSubmission
                ? `${submissionStatusLabels[activeSubmission.status]}${
                    activeSubmission.nextAction
                      ? ` · ${activeSubmission.nextAction}`
                      : ""
                  }`
                : project.targetJournal
                  ? "Target journal listed on the project."
                  : "No active submission or target journal yet."}
            </p>
          </article>

          <article className="research-command-card research-command-card--literature">
            <span>Literature summary</span>
            <div className="research-command-card__stats">
              <strong>{sources.length}<small>sources</small></strong>
              <strong>{notes.length + readingNotes.length}<small>notes</small></strong>
              <strong>{synthesisSections.length}<small>synthesis</small></strong>
              <strong>{mindMapNodes.length}<small>map nodes</small></strong>
              <strong>{prismaRecords.length}<small>screening</small></strong>
            </div>
          </article>
        </div>
      </section>

      <section className="research-project-search" aria-labelledby="project-search-heading">
        <div className="research-project-search__header">
          <div>
            <p className="eyebrow">Where did I put that?</p>
            <h2 id="project-search-heading">Search this project</h2>
          </div>

          {normalizedSearchTerm ? (
            <span>{totalSearchResults} results</span>
          ) : null}
        </div>

        <div className="research-project-search__controls">
          <label>
            <span>Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tasks, log, drafts, sources, notes, screening, and submissions."
            />
          </label>

          <label>
            <span>Type</span>
            <select
              value={searchFilter}
              onChange={(event) =>
                setSearchFilter(event.target.value as ProjectSearchFilter)
              }
            >
              {Object.entries(projectSearchFilterLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!normalizedSearchTerm ? (
          <div className="research-empty-state">
            Search tasks, drafts, sources, notes, and submissions.
          </div>
        ) : null}

        {normalizedSearchTerm && totalSearchResults === 0 ? (
          <div className="research-empty-state">No project results found.</div>
        ) : null}

        {totalSearchResults > 0 ? (
          <div className="research-project-search__results">
            {searchGroups
              .filter((group) => group.results.length > 0)
              .map((group) => (
                <section key={group.key} className="research-search-group">
                  <div className="research-search-group__header">
                    <h3>{group.label}</h3>
                    <span>{group.results.length}</span>
                  </div>

                  <div className="research-search-group__list">
                    {group.results.map((result) => (
                      <Link
                        key={result.id}
                        className="research-search-result"
                        to={result.to}
                      >
                        <span>{result.typeLabel}</span>
                        <strong>{result.title}</strong>
                        <p>{result.snippet}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        ) : null}
      </section>

      <div className="research-workspace-grid">
        <ResearchWorkspaceTile
          title="Tasks"
          description={taskDescription}
          meta={taskMeta}
          to={`${basePath}/tasks`}
        />

        <ResearchWorkspaceTile
          title="Stages"
          description="Move the manuscript through lit, analysis, drafting, revision, and submission."
          meta={researchStages[project.currentStage]}
          to={`${basePath}/stages`}
        />

        <ResearchWorkspaceTile
          title="Literature"
          description="Track sources, themes, quotes, gaps, and source-to-argument links."
          meta={literatureMeta}
          to={`${basePath}/literature`}
        />

        <ResearchWorkspaceTile
          title="Research Log"
          description="Decisions, blockers, ideas, progress notes, and restart breadcrumbs."
          meta={`${logEntries.length} entries`}
          to={`${basePath}/notes`}
        />

        <ResearchWorkspaceTile
          title="Drafts"
          description="Track manuscript sections, current versions, links, and draft status."
          meta={draftMeta}
          to={`${basePath}/drafts`}
        />

        <ResearchWorkspaceTile
          title="Submissions"
          description="Target journals, submission status, reviews, revise-and-resubmit notes, and decisions."
          meta={submissionMeta}
          to={`${basePath}/journals`}
        />
      </div>
    </section>
  );
}
