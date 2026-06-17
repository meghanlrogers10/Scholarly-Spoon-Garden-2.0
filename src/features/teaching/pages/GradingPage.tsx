import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { GradingItemModal } from "../components/GradingItemModal";
import { GradingItemTable } from "../components/GradingItemTable";
import { GradingSummaryCards } from "../components/GradingSummaryCards";
import { LowSpoonGradingCard } from "../components/LowSpoonGradingCard";
import { TeachingSuggestionReview } from "../components/TeachingSuggestionReview";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { useTeaching } from "../hooks/useTeaching";
import type {
  NewTeachingGradingItemInput,
  TeachingGradingItem,
  TeachingGradingStatus,
  TeachingSuggestion,
} from "../types";
import { gradingTaskInput } from "../utils/teachingTaskBridge";
import {
  generateGradingItemSuggestions,
  teachingSuggestionAnnouncementInput,
  teachingSuggestionExists,
  teachingSuggestionTaItemInput,
  teachingSuggestionTaskInput,
} from "../utils/teachingSuggestions";
import "./teaching.css";

type GradingFilter =
  | "all"
  | "pending"
  | "in-progress"
  | "completed"
  | "returned"
  | "overdue"
  | "due-soon";

const filterOptions: Array<{ label: string; value: GradingFilter }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
  { label: "Returned", value: "returned" },
  { label: "Overdue", value: "overdue" },
  { label: "Due soon", value: "due-soon" },
];

const statusRank: Record<TeachingGradingStatus, number> = {
  pending: 0,
  "in-progress": 1,
  completed: 2,
  returned: 3,
};

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

function isOpenGrading(item: TeachingGradingItem) {
  return item.status === "pending" || item.status === "in-progress";
}

function isOverdue(item: TeachingGradingItem) {
  const timestamp = dateTimestamp(item.dueDate);
  return isOpenGrading(item) && Number.isFinite(timestamp) && timestamp < todayTimestamp();
}

function isDueWithin(item: TeachingGradingItem, days: number) {
  const timestamp = dateTimestamp(item.dueDate);

  if (!isOpenGrading(item) || !Number.isFinite(timestamp)) {
    return false;
  }

  const distance = Math.ceil((timestamp - todayTimestamp()) / 86_400_000);
  return distance >= 0 && distance <= days;
}

function sortGradingItems(items: TeachingGradingItem[]) {
  return [...items].sort((a, b) => {
    const dueCompare = dateTimestamp(a.dueDate) - dateTimestamp(b.dueDate);

    if (dueCompare !== 0) {
      return dueCompare;
    }

    const statusCompare = statusRank[a.status] - statusRank[b.status];

    if (statusCompare !== 0) {
      return statusCompare;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

function parseScores(items: TeachingGradingItem[]) {
  const scores = items.flatMap((item) =>
    item.scoresText
      .split(",")
      .map((score) => Number(score.trim()))
      .filter((score) => Number.isFinite(score))
  );

  if (scores.length === 0) {
    return { scoreCount: 0 };
  }

  return {
    averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    scoreCount: scores.length,
  };
}

function lowSpoonItems(items: TeachingGradingItem[]) {
  const openItems = items.filter(isOpenGrading);
  const overdue = openItems.filter(isOverdue);
  const dueInTwoDays = openItems.filter((item) => isDueWithin(item, 2));
  const inProgress = openItems.filter((item) => item.status === "in-progress");
  const withNextAction = openItems.filter((item) => item.nextAction.trim());
  const candidates =
    overdue.length > 0
      ? overdue
      : dueInTwoDays.length > 0
        ? dueInTwoDays
        : inProgress.length > 0
          ? inProgress
          : withNextAction.length > 0
            ? withNextAction
            : openItems;

  return candidates.slice(0, 3);
}

function csvEscape(value: string | undefined) {
  const stringValue = value ?? "";

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function createCsv(items: TeachingGradingItem[]) {
  const columns = [
    "assignment",
    "assignmentType",
    "dueDate",
    "status",
    "returnedDate",
    "scoresText",
    "missing",
    "spoonCost",
    "estimatedMinutes",
    "notes",
    "nextAction",
    "createdAt",
    "updatedAt",
  ];
  const valueFor = (item: TeachingGradingItem, column: string) => {
    switch (column) {
      case "assignment":
        return item.assignment;
      case "assignmentType":
        return item.assignmentType;
      case "dueDate":
        return item.dueDate;
      case "status":
        return item.status;
      case "returnedDate":
        return item.returnedDate;
      case "scoresText":
        return item.scoresText;
      case "missing":
        return item.missing;
      case "spoonCost":
        return String(item.spoonCost ?? "");
      case "estimatedMinutes":
        return String(item.estimatedMinutes ?? "");
      case "notes":
        return item.notes;
      case "nextAction":
        return item.nextAction;
      case "createdAt":
        return item.createdAt;
      case "updatedAt":
        return item.updatedAt;
      default:
        return "";
    }
  };

  return [
    columns.join(","),
    ...items.map((item) =>
      columns.map((column) => csvEscape(valueFor(item, column))).join(",")
    ),
  ].join("\n");
}

function downloadCsv(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function GradingPage() {
  const { courseId } = useParams();
  const {
    getCourseById,
    getSemesterById,
    getGradingItemsForCourse,
    getAnnouncementRemindersForCourse,
    getTaItemsForCourse,
    createGradingItem,
    updateGradingItem,
    deleteGradingItem,
    createAnnouncementReminder,
    createTaItem,
  } = useTeaching();
  const [filter, setFilter] = useState<GradingFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<TeachingGradingItem>();
  const [suggestionItem, setSuggestionItem] = useState<TeachingGradingItem>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addLinkedTaskToToday, isSourceOnToday, tasks } = useTaskBridge();

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
  const gradingItems = sortGradingItems(getGradingItemsForCourse(currentCourse.id));
  const announcementReminders = getAnnouncementRemindersForCourse(currentCourse.id);
  const taItems = getTaItemsForCourse(currentCourse.id);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = gradingItems.filter((item) => {
    const matchesFilter =
      filter === "all" ||
      item.status === filter ||
      (filter === "overdue" && isOverdue(item)) ||
      (filter === "due-soon" && isDueWithin(item, 7));
    const haystack = [
      item.assignment,
      item.notes,
      item.missing,
      item.nextAction,
      item.assignmentType ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return matchesFilter && (!normalizedSearch || haystack.includes(normalizedSearch));
  });
  const scoreSummary = parseScores(gradingItems);
  const summary = {
    total: gradingItems.length,
    pending: gradingItems.filter((item) => item.status === "pending").length,
    inProgress: gradingItems.filter((item) => item.status === "in-progress").length,
    completed: gradingItems.filter((item) => item.status === "completed").length,
    returned: gradingItems.filter((item) => item.status === "returned").length,
    overdue: gradingItems.filter(isOverdue).length,
    dueSoon: gradingItems.filter((item) => isDueWithin(item, 7)).length,
    missingNotes: gradingItems.filter((item) => item.missing.trim()).length,
    estimatedMinutes: gradingItems
      .filter(isOpenGrading)
      .reduce((total, item) => total + (item.estimatedMinutes ?? 45), 0),
    highSpoon: gradingItems
      .filter(isOpenGrading)
      .filter((item) => (item.spoonCost ?? 3) >= 4).length,
    ...scoreSummary,
  };
  const lowSpoonMoves = lowSpoonItems(gradingItems);

  function openAddModal() {
    setEditingItem(undefined);
    setIsModalOpen(true);
  }

  function handleSave(input: NewTeachingGradingItemInput) {
    if (editingItem) {
      updateGradingItem(editingItem.id, input);
      setSuggestionItem({
        ...editingItem,
        ...input,
        updatedAt: new Date().toISOString(),
      });
    } else {
      setSuggestionItem(createGradingItem(input));
    }

    setEditingItem(undefined);
    setIsModalOpen(false);
  }

  function handleDelete(item: TeachingGradingItem) {
    if (window.confirm(`Delete ${item.assignment}? This cannot be undone.`)) {
      deleteGradingItem(item.id);
    }
  }

  function handleStatusChange(
    item: TeachingGradingItem,
    status: TeachingGradingStatus
  ) {
    updateGradingItem(item.id, {
      status,
      returnedDate:
        status === "returned" ? item.returnedDate ?? new Date().toISOString().slice(0, 10) : undefined,
    });
  }

  function handleExport() {
    downloadCsv(
      `${currentCourse.code || "course"}-grading.csv`,
      createCsv(gradingItems)
    );
  }

  function handleAddGradingToToday(item: TeachingGradingItem) {
    addLinkedTaskToToday(gradingTaskInput(currentCourse, item));
  }

  function suggestionAlreadyCreated(suggestion: TeachingSuggestion) {
    return teachingSuggestionExists({
      suggestion,
      tasks,
      announcementReminders,
      taItems,
    });
  }

  function handleCreateSuggestions(suggestions: TeachingSuggestion[]) {
    if (!suggestionItem) {
      return;
    }

    suggestions.forEach((suggestion) => {
      if (suggestionAlreadyCreated(suggestion)) {
        return;
      }

      if (suggestion.targetType === "announcement") {
        createAnnouncementReminder(
          teachingSuggestionAnnouncementInput(suggestionItem, suggestion),
        );
        return;
      }

      if (suggestion.targetType === "taItem") {
        createTaItem(teachingSuggestionTaItemInput(suggestionItem, suggestion));
        return;
      }

      addLinkedTaskToToday(
        teachingSuggestionTaskInput(currentCourse, suggestionItem, suggestion),
      );
    });

    setSuggestionItem(undefined);
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${currentCourse.id}`}>
            Back to {currentCourse.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} · Grading
          </p>

          <h1>{currentCourse.code}: Grading Tracker</h1>

          <p>
            Assignment queues, due dates, missing work notes, scores, and the
            smallest next grading move.
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Course</span>
          <strong>{currentCourse.title}</strong>

          <span>Open grading</span>
          <strong>{summary.pending + summary.inProgress}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={currentCourse.id} />
      <TeachingCourseSummaryStrip courseId={currentCourse.id} />

      <div className="teaching-notebook-toolbar">
        <div>
          <p className="eyebrow">Grading Tracker</p>
          <h2>Assignments and return flow</h2>
        </div>
        <div className="teaching-hero-panel__actions">
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={handleExport}
            disabled={gradingItems.length === 0}
          >
            Export Grading CSV
          </button>
          <button className="teaching-primary-button" type="button" onClick={openAddModal}>
            Add Grading Item
          </button>
        </div>
      </div>

      <div className="teaching-notebook-grid">
        <div className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Grading Summary</p>
            <h3>Queue shape</h3>
          </div>
          <GradingSummaryCards {...summary} />
        </div>
        <LowSpoonGradingCard items={lowSpoonMoves} />
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
          <span className="eyebrow">Search grading</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Assignment, notes, missing work, or next action"
          />
        </label>
      </div>

      <GradingItemTable
        items={filteredItems}
        onAddItem={openAddModal}
        onEditItem={(item) => {
          setEditingItem(item);
          setIsModalOpen(true);
        }}
        onDeleteItem={handleDelete}
        onStatusChange={handleStatusChange}
        onAddToToday={handleAddGradingToToday}
        isOnToday={(item) => isSourceOnToday("grading", item.id)}
      />

      {isModalOpen ? (
        <GradingItemModal
          courseId={currentCourse.id}
          item={editingItem}
          onClose={() => {
            setEditingItem(undefined);
            setIsModalOpen(false);
          }}
          onSave={handleSave}
        />
      ) : null}

      {suggestionItem ? (
        <TeachingSuggestionReview
          suggestions={generateGradingItemSuggestions(currentCourse, suggestionItem)}
          isAlreadyCreated={suggestionAlreadyCreated}
          onClose={() => setSuggestionItem(undefined)}
          onCreateSelected={handleCreateSuggestions}
        />
      ) : null}
    </section>
  );
}
