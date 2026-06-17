import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { LowSpoonTaCard } from "../components/LowSpoonTaCard";
import { TaFollowUpSummaryCards } from "../components/TaFollowUpSummaryCards";
import { TaItemModal } from "../components/TaItemModal";
import { TaItemTable } from "../components/TaItemTable";
import type { TaStatus } from "../components/TaItemRow";
import { TeachingAssistantModal } from "../components/TeachingAssistantModal";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { TeachingEmailDraftModal } from "../components/TeachingEmailDraftModal";
import { useTeaching } from "../hooks/useTeaching";
import type {
  NewTeachingAssistantInput,
  NewTeachingTaItemInput,
  TeachingAssistant,
  TeachingReminderHistoryType,
  TeachingTaItem,
  TeachingTaReminderAlert,
} from "../types";
import type { TeachingEmailDraft } from "../utils/teachingEmailTemplates";
import {
  generateTaGeneralCheckInEmail,
  generateTaGradeNormingReminderEmail,
  generateTaGradingFollowUpEmail,
  generateTaInitialGradingReminderEmail,
  generateTaInstructionsReminderEmail,
  generateTaRubricReminderEmail,
} from "../utils/teachingEmailTemplates";
import { taTaskInput } from "../utils/teachingTaskBridge";
import "./teaching.css";

type TaFilter = "all" | "open" | "waiting" | "completed" | "overdue" | "due-soon";

const filterOptions: Array<{ label: string; value: TaFilter }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Waiting", value: "waiting" },
  { label: "Completed", value: "completed" },
  { label: "Overdue", value: "overdue" },
  { label: "Due soon", value: "due-soon" },
];

function todayTimestamp() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function dateTimestamp(value?: string) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function itemStatus(item: TeachingTaItem): TaStatus {
  if (item.completed) {
    return "completed";
  }

  return item.status ?? "open";
}

function isOpen(item: TeachingTaItem) {
  return itemStatus(item) === "open";
}

function isOverdue(item: TeachingTaItem) {
  const timestamp = dateTimestamp(item.dueDate);
  return !item.completed && Number.isFinite(timestamp) && timestamp < todayTimestamp();
}

function isDueWithin(item: TeachingTaItem, days: number) {
  const timestamp = dateTimestamp(item.dueDate);

  if (item.completed || !Number.isFinite(timestamp)) {
    return false;
  }

  const distance = Math.ceil((timestamp - todayTimestamp()) / 86_400_000);
  return distance >= 0 && distance <= days;
}

function sortTaItems(items: TeachingTaItem[]) {
  return [...items].sort((a, b) => {
    const dueCompare = dateTimestamp(a.dueDate) - dateTimestamp(b.dueDate);

    if (dueCompare !== 0) {
      return dueCompare;
    }

    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

function lowSpoonItems(items: TeachingTaItem[]) {
  const activeItems = items.filter((item) => !item.completed);
  const overdue = activeItems.filter((item) => isOverdue(item) && isOpen(item));
  const dueInTwoDays = activeItems.filter((item) => isDueWithin(item, 2));
  const withNextAction = activeItems.filter((item) => item.nextAction.trim());
  const waiting = activeItems.filter((item) => itemStatus(item) === "waiting");
  const openItems = activeItems.filter(isOpen);
  const candidates =
    overdue.length > 0
      ? overdue
      : dueInTwoDays.length > 0
        ? dueInTwoDays
        : withNextAction.length > 0
          ? withNextAction
          : waiting.length > 0
            ? waiting
            : openItems;

  return candidates.slice(0, 3);
}

function markdownEscape(value: string) {
  return value.replaceAll("\r\n", "\n").trim();
}

function createMarkdown(
  courseCode: string,
  courseTitle: string,
  items: TeachingTaItem[]
) {
  const lines = [
    `# ${courseCode}: ${courseTitle} TA Follow-Up Report`,
    "",
    `Exported: ${new Date().toLocaleDateString()}`,
    "",
  ];

  items.forEach((item) => {
    lines.push(`## ${item.task}`);
    lines.push("");
    lines.push(`- TA: ${item.taName || "Unassigned"}`);
    lines.push(`- Assignment: ${item.assignmentName || item.task}`);
    lines.push(`- Category: ${item.category || "None"}`);
    lines.push(`- Due date: ${item.dueDate || "None"}`);
    lines.push(`- Assignment due: ${item.assignmentDueDate || "None"}`);
    lines.push(`- Initial reminder due: ${item.reminderDueDate || "None"}`);
    lines.push(`- Follow-up due: ${item.followUpDueDate || "None"}`);
    lines.push(`- Status: ${itemStatus(item)}`);
    lines.push(`- Completed: ${item.completed ? "Yes" : "No"}`);
    lines.push(`- Reminder count: ${item.reminderCount ?? 0}`);
    lines.push(`- Grading reported complete: ${item.gradingReportedComplete ? "Yes" : "No"}`);
    lines.push("");
    lines.push("### Notes");
    lines.push(markdownEscape(item.notes) || "No notes captured.");
    lines.push("");
    lines.push("### Weekly comment");
    lines.push(markdownEscape(item.weeklyComment) || "No weekly comment captured.");
    lines.push("");
    lines.push("### Next action");
    lines.push(markdownEscape(item.nextAction) || "No next action captured.");
    lines.push("");
  });

  return lines.join("\n");
}

function downloadMarkdown(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function TaFollowUpPage() {
  const { courseId } = useParams();
  const {
    getCourseById,
    getSemesterById,
    getTaItemsForCourse,
    getTeachingAssistantsForCourse,
    getTaReminderAlerts,
    createTaItem,
    updateTaItem,
    deleteTaItem,
    createTeachingAssistant,
    updateTeachingAssistant,
    deleteTeachingAssistant,
  } = useTeaching();
  const [filter, setFilter] = useState<TaFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<TeachingTaItem>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<TeachingAssistant>();
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [emailDraftState, setEmailDraftState] = useState<{
    draft: TeachingEmailDraft;
    item?: TeachingTaItem;
    historyType?: TeachingReminderHistoryType;
  }>();
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();

  const course = getCourseById(courseId);
  const semester = course ? getSemesterById(course.semesterId) : undefined;

  if (!course) {
    return (
      <section className="teaching-page page-stack">
        <div className="teaching-hero-panel">
          <div>
            <p className="eyebrow">Teaching</p>
            <h1>Course not found.</h1>
            <p>This course may have been archived, deleted, or not created yet.</p>
          </div>

          <Link className="teaching-secondary-button" to="/teaching">
            Back to Teaching
          </Link>
        </div>
      </section>
    );
  }

  const currentCourse = course;
  const taItems = sortTaItems(getTaItemsForCourse(currentCourse.id));
  const assistants = getTeachingAssistantsForCourse(currentCourse.id);
  const activeAssistants = assistants.filter((assistant) => assistant.active);
  const reminderAlerts = getTaReminderAlerts(currentCourse.id);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = taItems.filter((item) => {
    const status = itemStatus(item);
    const matchesFilter =
      filter === "all" ||
      status === filter ||
      (filter === "overdue" && isOverdue(item)) ||
      (filter === "due-soon" && isDueWithin(item, 7));
    const haystack = [
      item.taName,
      item.task,
      item.assignmentName ?? "",
      item.notes,
      item.weeklyComment,
      item.nextAction,
      item.category ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return matchesFilter && (!normalizedSearch || haystack.includes(normalizedSearch));
  });
  const summary = {
    total: taItems.length,
    open: taItems.filter((item) => itemStatus(item) === "open").length,
    waiting: taItems.filter((item) => itemStatus(item) === "waiting").length,
    completed: taItems.filter((item) => itemStatus(item) === "completed").length,
    overdue: taItems.filter(isOverdue).length,
    dueSoon: taItems.filter((item) => isDueWithin(item, 7)).length,
    uniqueTas: new Set([
      ...taItems.map((item) => item.taName.trim()).filter(Boolean),
      ...assistants.map((assistant) => assistant.name.trim()).filter(Boolean),
    ]).size,
  };
  const lowSpoonMoves = lowSpoonItems(taItems);

  function openAddModal() {
    setEditingItem(undefined);
    setIsModalOpen(true);
  }

  function handleSave(input: NewTeachingTaItemInput) {
    if (editingItem) {
      updateTaItem(editingItem.id, input);
    } else {
      createTaItem(input);
    }

    setEditingItem(undefined);
    setIsModalOpen(false);
  }

  function handleDelete(item: TeachingTaItem) {
    if (window.confirm(`Delete ${item.task}? This cannot be undone.`)) {
      deleteTaItem(item.id);
    }
  }

  function handleStatusChange(item: TeachingTaItem, status: TaStatus) {
    updateTaItem(item.id, {
      status,
      completed: status === "completed",
    });
  }

  function handleToggleCompleted(item: TeachingTaItem) {
    updateTaItem(item.id, {
      completed: !item.completed,
      status: item.completed ? "open" : "completed",
      gradingReportedComplete: item.completed ? false : item.gradingReportedComplete,
    });
  }

  function handleAssistantSave(input: NewTeachingAssistantInput) {
    if (editingAssistant) {
      updateTeachingAssistant(editingAssistant.id, input);
    } else {
      createTeachingAssistant(input);
    }

    setEditingAssistant(undefined);
    setIsAssistantModalOpen(false);
  }

  function handleAssistantDelete(assistant: TeachingAssistant) {
    if (window.confirm(`Delete TA profile for ${assistant.name}? TA items will stay.`)) {
      deleteTeachingAssistant(assistant.id);
    }
  }

  function handleToggleAssistantActive(assistant: TeachingAssistant) {
    updateTeachingAssistant(assistant.id, { active: !assistant.active });
  }

  function markGradingComplete(item: TeachingTaItem, complete: boolean) {
    updateTaItem(item.id, {
      completed: complete,
      gradingReportedComplete: complete,
      gradingCompletedAt: complete ? new Date().toISOString() : undefined,
      status: complete ? "completed" : "open",
    });
  }

  function markGradeNormingComplete(item: TeachingTaItem, complete: boolean) {
    updateTaItem(item.id, {
      gradeNormingCompleted: complete,
      gradeNormingCompletedAt: complete ? new Date().toISOString() : undefined,
    });
  }

  function assistantForItem(item: TeachingTaItem) {
    return assistants.find((assistant) => assistant.id === item.taId);
  }

  function createAssistantDraftItem(
    assistant: TeachingAssistant,
    templateKind: "initial" | "follow-up"
  ): TeachingTaItem {
    const now = new Date().toISOString();

    return {
      id: `draft-${assistant.id}-${templateKind}`,
      courseId: currentCourse.id,
      taId: assistant.id,
      taName: assistant.name,
      task: templateKind === "initial" ? "current grading" : "current grading follow-up",
      assignmentName: "current grading",
      status: "open",
      category: "grading",
      dueDate: "",
      notes: assistant.notes,
      weeklyComment: "",
      nextAction: "Customize this draft before sending.",
      reminderCount: 0,
      reminderHistory: [],
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  function draftForItem(
    item: TeachingTaItem,
    historyType: TeachingReminderHistoryType
  ) {
    const input = {
      course: currentCourse,
      ta: assistantForItem(item),
      item,
    };

    if (historyType === "initial-grading-reminder") {
      return generateTaInitialGradingReminderEmail(input);
    }

    if (historyType === "grading-follow-up") {
      return generateTaGradingFollowUpEmail(input);
    }

    if (historyType === "rubric-reminder") {
      return generateTaRubricReminderEmail(input);
    }

    if (historyType === "ta-instructions-reminder") {
      return generateTaInstructionsReminderEmail(input);
    }

    if (historyType === "grade-norming-reminder") {
      return generateTaGradeNormingReminderEmail(input);
    }

    return generateTaGeneralCheckInEmail(input);
  }

  function openDraft(
    item: TeachingTaItem,
    historyType: TeachingReminderHistoryType,
    allowMarkSent = true
  ) {
    const draft = draftForItem(item, historyType);

    if (allowMarkSent && !item.id.startsWith("draft-")) {
      updateTaItem(item.id, {
        emailTemplateType: historyType,
        lastEmailSubject: draft.subject,
        lastEmailBody: draft.body,
      });
    }

    setEmailDraftState({
      draft,
      item: allowMarkSent && !item.id.startsWith("draft-") ? item : undefined,
      historyType: allowMarkSent ? historyType : undefined,
    });
  }

  function markReminderSent(
    item: TeachingTaItem,
    draft: TeachingEmailDraft,
    historyType: TeachingReminderHistoryType
  ) {
    if (
      historyType === "initial-grading-reminder" &&
      item.initialReminderSentAt &&
      !window.confirm("Initial reminder already has a sent timestamp. Mark it sent again?")
    ) {
      return;
    }

    if (
      historyType === "grading-follow-up" &&
      item.followUpReminderSentAt &&
      !window.confirm("Follow-up reminder already has a sent timestamp. Mark it sent again?")
    ) {
      return;
    }

    const sentAt = new Date().toISOString();

    updateTaItem(item.id, {
      initialReminderSentAt:
        historyType === "initial-grading-reminder"
          ? sentAt
          : item.initialReminderSentAt,
      followUpReminderSentAt:
        historyType === "grading-follow-up" ? sentAt : item.followUpReminderSentAt,
      reminderCount: (item.reminderCount ?? 0) + 1,
      reminderHistory: [
        ...(item.reminderHistory ?? []),
        {
          id: crypto.randomUUID(),
          type: historyType,
          sentAt,
          subject: draft.subject,
          body: draft.body,
        },
      ],
      emailTemplateType: historyType,
      lastEmailSubject: draft.subject,
      lastEmailBody: draft.body,
    });

    setEmailDraftState(undefined);
  }

  function historyTypeForAlert(alert: TeachingTaReminderAlert) {
    const alertMap: Record<TeachingTaReminderAlert["type"], TeachingReminderHistoryType> = {
      "ta-initial-reminder": "initial-grading-reminder",
      "ta-follow-up-reminder": "grading-follow-up",
      "ta-rubric-reminder": "rubric-reminder",
      "ta-instructions-reminder": "ta-instructions-reminder",
      "ta-grade-norming-reminder": "grade-norming-reminder",
      "ta-waiting": "general-check-in",
    };

    return alertMap[alert.type];
  }

  function itemForAlert(alert: TeachingTaReminderAlert) {
    return taItems.find((item) => item.id === alert.taItemId);
  }

  function markAlertReminderSent(alert: TeachingTaReminderAlert) {
    const item = itemForAlert(alert);

    if (!item || alert.type === "ta-waiting") {
      return;
    }

    const historyType = historyTypeForAlert(alert);
    markReminderSent(item, draftForItem(item, historyType), historyType);
  }

  function handleExport() {
    downloadMarkdown(
      `${currentCourse.code || "course"}-ta-follow-up.md`,
      createMarkdown(currentCourse.code, currentCourse.title, taItems)
    );
  }

  function handleAddTaItemToToday(item: TeachingTaItem) {
    addLinkedTaskToToday(taTaskInput(currentCourse, item));
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${currentCourse.id}`}>
            Back to {currentCourse.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} · TA
            Follow-Up
          </p>

          <h1>{currentCourse.code}: TA Follow-Up</h1>

          <p>
            Coordinate grading, discussion support, weekly notes, next actions,
            and the follow-ups that keep TA work moving.
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Course</span>
          <strong>{currentCourse.title}</strong>

          <span>Open TA items</span>
          <strong>{summary.open + summary.waiting}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={currentCourse.id} />
      <TeachingCourseSummaryStrip courseId={currentCourse.id} />

      <div className="teaching-notebook-toolbar">
        <div>
          <p className="eyebrow">TA Follow-Up</p>
          <h2>Coordination queue</h2>
        </div>
        <div className="teaching-hero-panel__actions">
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={handleExport}
            disabled={taItems.length === 0}
          >
            Export TA Follow-Up Report
          </button>
          <button className="teaching-primary-button" type="button" onClick={openAddModal}>
            Add TA Item
          </button>
        </div>
      </div>

      <div className="teaching-notebook-grid">
        <div className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">TA Summary</p>
            <h3>Coordination shape</h3>
          </div>
          <TaFollowUpSummaryCards {...summary} />
        </div>
        <LowSpoonTaCard items={lowSpoonMoves} />
      </div>

      <div className="teaching-notebook-panel">
        <div className="teaching-panel-heading">
          <div>
            <p className="eyebrow">TA Roster</p>
            <h3>Names, emails, office hours</h3>
          </div>
          <button
            className="teaching-primary-button"
            type="button"
            onClick={() => {
              setEditingAssistant(undefined);
              setIsAssistantModalOpen(true);
            }}
          >
            Add TA
          </button>
        </div>

        {assistants.length === 0 ? (
          <div className="teaching-empty-state">
            <p>
              No TAs added yet. Add TA names, emails, and office hours so
              reminders are easy later.
            </p>
          </div>
        ) : (
          <div className="teaching-roster-grid">
            {assistants.map((assistant) => {
              const assistantItems = taItems.filter(
                (item) => item.taId === assistant.id || item.taName === assistant.name
              );
              const latestItem = assistantItems.find((item) => !item.completed);

              return (
                <article className="teaching-roster-card" key={assistant.id}>
                  <div>
                    <p className="eyebrow">
                      {assistant.role || "TA"} · {assistant.active ? "active" : "inactive"}
                    </p>
                    <h4>{assistant.name}</h4>
                    <p>
                      {assistant.email ? (
                        <a href={`mailto:${assistant.email}`}>{assistant.email}</a>
                      ) : (
                        "No email"
                      )}
                    </p>
                    <p>{assistant.officeHours || "No office hours saved"}</p>
                    {assistant.notes ? <p>{assistant.notes}</p> : null}
                  </div>

                  <div className="teaching-table-actions">
                    <button
                      className="teaching-chip-button"
                      type="button"
                      onClick={() =>
                        openDraft(
                          latestItem ||
                            createAssistantDraftItem(assistant, "initial"),
                          "initial-grading-reminder",
                          Boolean(latestItem)
                        )
                      }
                    >
                      Draft initial
                    </button>
                    <button
                      className="teaching-chip-button"
                      type="button"
                      onClick={() =>
                        openDraft(
                          latestItem ||
                            createAssistantDraftItem(assistant, "follow-up"),
                          "grading-follow-up",
                          Boolean(latestItem)
                        )
                      }
                    >
                      Draft follow-up
                    </button>
                    <button
                      className="teaching-chip-button"
                      type="button"
                      onClick={() => {
                        setEditingAssistant(assistant);
                        setIsAssistantModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="teaching-chip-button"
                      type="button"
                      onClick={() => handleToggleAssistantActive(assistant)}
                    >
                      {assistant.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="teaching-chip-button teaching-chip-button--danger"
                      type="button"
                      onClick={() => handleAssistantDelete(assistant)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="teaching-notebook-panel">
        <div className="teaching-panel-heading">
          <div>
            <p className="eyebrow">Reminder Alerts</p>
            <h3>TA reminders needing attention</h3>
          </div>
          <span className="teaching-count-pill">{reminderAlerts.length}</span>
        </div>

        {reminderAlerts.length === 0 ? (
          <div className="teaching-empty-state">
            <p>No TA reminders screaming right now.</p>
          </div>
        ) : (
          <div className="teaching-alert-list">
            {reminderAlerts.map((alert) => {
              const item = itemForAlert(alert);

              return (
                <article className="teaching-alert-card" key={alert.id}>
                  <div>
                    <p className="eyebrow">
                      {alert.priority} priority · {alert.dueDate || "no date"}
                    </p>
                    <h4>{alert.title}</h4>
                    <p>{alert.detail}</p>
                    <p>{alert.nextAction}</p>
                  </div>
                  {item ? (
                    <div className="teaching-table-actions">
                      <button
                        className="teaching-chip-button"
                        type="button"
                        onClick={() => openDraft(item, historyTypeForAlert(alert))}
                      >
                        {alert.actionLabel}
                      </button>
                      {alert.type !== "ta-waiting" ? (
                        <button
                          className="teaching-chip-button"
                          type="button"
                          onClick={() => markAlertReminderSent(alert)}
                        >
                          Mark reminder sent
                        </button>
                      ) : null}
                      <button
                        className="teaching-chip-button"
                        type="button"
                        onClick={() => markGradingComplete(item, true)}
                      >
                        Mark grading complete
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="teaching-prep-controls">
        <div className="teaching-filter-group">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              className="teaching-chip-button"
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label>
          <span className="eyebrow">Search TA follow-ups</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="TA, task, notes, weekly comment, or next action"
          />
        </label>
      </div>

      <TaItemTable
        items={filteredItems}
        onAddItem={openAddModal}
        onEditItem={(item) => {
          setEditingItem(item);
          setIsModalOpen(true);
        }}
        onDeleteItem={handleDelete}
        onToggleCompleted={handleToggleCompleted}
        onStatusChange={handleStatusChange}
        onWeeklyCommentChange={(item, weeklyComment) =>
          updateTaItem(item.id, { weeklyComment })
        }
        onDraftEmail={openDraft}
        onMarkGradingComplete={markGradingComplete}
        onMarkGradeNormingComplete={markGradeNormingComplete}
        onAddToToday={handleAddTaItemToToday}
        isOnToday={(item) => isSourceOnToday("ta-follow-up", item.id)}
      />

      {isModalOpen ? (
        <TaItemModal
          courseId={currentCourse.id}
          item={editingItem}
          assistants={activeAssistants}
          onClose={() => {
            setEditingItem(undefined);
            setIsModalOpen(false);
          }}
          onSave={handleSave}
        />
      ) : null}

      {isAssistantModalOpen ? (
        <TeachingAssistantModal
          courseId={currentCourse.id}
          assistant={editingAssistant}
          onClose={() => {
            setEditingAssistant(undefined);
            setIsAssistantModalOpen(false);
          }}
          onSave={handleAssistantSave}
        />
      ) : null}

      {emailDraftState ? (
        <TeachingEmailDraftModal
          draft={emailDraftState.draft}
          onClose={() => setEmailDraftState(undefined)}
          onMarkSent={
            emailDraftState.item && emailDraftState.historyType
              ? () =>
                  markReminderSent(
                    emailDraftState.item as TeachingTaItem,
                    emailDraftState.draft,
                    emailDraftState.historyType as TeachingReminderHistoryType
                  )
              : undefined
          }
        />
      ) : null}
    </section>
  );
}
