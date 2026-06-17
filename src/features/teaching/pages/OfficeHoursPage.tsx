import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { LowSpoonOfficeHoursCard } from "../components/LowSpoonOfficeHoursCard";
import { OfficeHourVisitModal } from "../components/OfficeHourVisitModal";
import { OfficeHourVisitTable } from "../components/OfficeHourVisitTable";
import type { OfficeHourStatus } from "../components/OfficeHourVisitRow";
import { OfficeHoursSummaryCards } from "../components/OfficeHoursSummaryCards";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { useTeaching } from "../hooks/useTeaching";
import type {
  NewTeachingOfficeHourVisitInput,
  TeachingOfficeHourVisit,
} from "../types";
import { officeHoursTaskInput } from "../utils/teachingTaskBridge";
import "./teaching.css";

type OfficeHoursFilter =
  | "all"
  | "needs-follow-up"
  | "resolved"
  | "waiting"
  | "this-week";

const filterOptions: Array<{ label: string; value: OfficeHoursFilter }> = [
  { label: "All", value: "all" },
  { label: "Needs follow-up", value: "needs-follow-up" },
  { label: "Resolved", value: "resolved" },
  { label: "Waiting", value: "waiting" },
  { label: "This week", value: "this-week" },
];

function today() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateTimestamp(value?: string) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function visitStatus(visit: TeachingOfficeHourVisit): OfficeHourStatus {
  if (visit.followUpCompleted) {
    return "resolved";
  }

  return visit.status ?? "open";
}

function isThisWeek(value?: string) {
  if (!value) {
    return false;
  }

  const start = today();
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(timestamp) && timestamp >= start.getTime() && timestamp <= end.getTime();
}

function sortVisits(visits: TeachingOfficeHourVisit[]) {
  return [...visits].sort((a, b) => {
    const dateCompare = dateTimestamp(b.visitDate) - dateTimestamp(a.visitDate);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function lowSpoonVisits(visits: TeachingOfficeHourVisit[]) {
  const unresolved = visits.filter((visit) => !visit.followUpCompleted);
  const withNextAction = unresolved.filter((visit) => visit.nextAction.trim());
  const waiting = unresolved.filter((visit) => visitStatus(visit) === "waiting");
  const withFollowUp = unresolved.filter((visit) => visit.followUp.trim());
  const oldestUnresolved = [...unresolved].sort(
    (a, b) => dateTimestamp(a.visitDate) - dateTimestamp(b.visitDate)
  );
  const candidates =
    withNextAction.length > 0
      ? withNextAction
      : oldestUnresolved.length > 0
        ? oldestUnresolved
        : waiting.length > 0
          ? waiting
          : withFollowUp.length > 0
            ? withFollowUp
            : unresolved;

  return candidates.slice(0, 3);
}

function csvEscape(value: string | boolean | undefined) {
  const stringValue = String(value ?? "");

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function createCsv(visits: TeachingOfficeHourVisit[]) {
  const columns = [
    "student",
    "visitDate",
    "visitType",
    "concern",
    "followUp",
    "nextAction",
    "status",
    "followUpCompleted",
    "createdAt",
    "updatedAt",
  ];
  const valueFor = (visit: TeachingOfficeHourVisit, column: string) => {
    switch (column) {
      case "student":
        return visit.student;
      case "visitDate":
        return visit.visitDate;
      case "visitType":
        return visit.visitType;
      case "concern":
        return visit.concern;
      case "followUp":
        return visit.followUp;
      case "nextAction":
        return visit.nextAction;
      case "status":
        return visitStatus(visit);
      case "followUpCompleted":
        return visit.followUpCompleted;
      case "createdAt":
        return visit.createdAt;
      case "updatedAt":
        return visit.updatedAt;
      default:
        return "";
    }
  };

  return [
    columns.join(","),
    ...visits.map((visit) =>
      columns.map((column) => csvEscape(valueFor(visit, column))).join(",")
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

export function OfficeHoursPage() {
  const { courseId } = useParams();
  const {
    getCourseById,
    getSemesterById,
    getOfficeHourVisitsForCourse,
    createOfficeHourVisit,
    updateOfficeHourVisit,
    deleteOfficeHourVisit,
  } = useTeaching();
  const [filter, setFilter] = useState<OfficeHoursFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingVisit, setEditingVisit] = useState<TeachingOfficeHourVisit>();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const visits = sortVisits(getOfficeHourVisitsForCourse(currentCourse.id));
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredVisits = visits.filter((visit) => {
    const status = visitStatus(visit);
    const matchesFilter =
      filter === "all" ||
      (filter === "needs-follow-up" && !visit.followUpCompleted) ||
      (filter === "resolved" && status === "resolved") ||
      (filter === "waiting" && status === "waiting") ||
      (filter === "this-week" && isThisWeek(visit.visitDate));
    const haystack = [
      visit.student,
      visit.concern,
      visit.followUp,
      visit.nextAction,
      visit.visitType ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return matchesFilter && (!normalizedSearch || haystack.includes(normalizedSearch));
  });
  const summary = {
    total: visits.length,
    thisWeek: visits.filter((visit) => isThisWeek(visit.visitDate)).length,
    openFollowUps: visits.filter((visit) => !visit.followUpCompleted).length,
    waiting: visits.filter((visit) => visitStatus(visit) === "waiting").length,
    resolved: visits.filter((visit) => visitStatus(visit) === "resolved").length,
    uniqueStudents: new Set(
      visits.map((visit) => visit.student.trim()).filter(Boolean)
    ).size,
  };
  const lowSpoonMoves = lowSpoonVisits(visits);

  function openAddModal() {
    setEditingVisit(undefined);
    setIsModalOpen(true);
  }

  function handleSave(input: NewTeachingOfficeHourVisitInput) {
    if (editingVisit) {
      updateOfficeHourVisit(editingVisit.id, input);
    } else {
      createOfficeHourVisit(input);
    }

    setEditingVisit(undefined);
    setIsModalOpen(false);
  }

  function handleDelete(visit: TeachingOfficeHourVisit) {
    const label = visit.student || visit.concern || "this visit";

    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteOfficeHourVisit(visit.id);
    }
  }

  function handleStatusChange(
    visit: TeachingOfficeHourVisit,
    status: OfficeHourStatus
  ) {
    updateOfficeHourVisit(visit.id, {
      status,
      followUpCompleted: status === "resolved",
    });
  }

  function handleToggleFollowUp(visit: TeachingOfficeHourVisit) {
    updateOfficeHourVisit(visit.id, {
      followUpCompleted: !visit.followUpCompleted,
      status: visit.followUpCompleted ? "open" : "resolved",
    });
  }

  function handleExport() {
    downloadCsv(
      `${currentCourse.code || "course"}-office-hours.csv`,
      createCsv(visits)
    );
  }

  function handleAddVisitToToday(visit: TeachingOfficeHourVisit) {
    addLinkedTaskToToday(officeHoursTaskInput(currentCourse, visit));
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${currentCourse.id}`}>
            Back to {currentCourse.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} · Office
            Hours
          </p>

          <h1>{currentCourse.code}: Office Hours</h1>

          <p>
            Student questions, visit notes, follow-ups, and the small next steps
            that help future-you remember what happened.
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Course</span>
          <strong>{currentCourse.title}</strong>

          <span>Open follow-ups</span>
          <strong>{summary.openFollowUps}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={currentCourse.id} />
      <TeachingCourseSummaryStrip courseId={currentCourse.id} />

      <div className="teaching-notebook-toolbar">
        <div>
          <p className="eyebrow">Office Hours</p>
          <h2>Student visit log</h2>
        </div>
        <div className="teaching-hero-panel__actions">
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={handleExport}
            disabled={visits.length === 0}
          >
            Export Office Hours CSV
          </button>
          <button className="teaching-primary-button" type="button" onClick={openAddModal}>
            Add Visit
          </button>
        </div>
      </div>

      <div className="teaching-notebook-grid">
        <div className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Office Hours Summary</p>
            <h3>Follow-up shape</h3>
          </div>
          <OfficeHoursSummaryCards {...summary} />
        </div>
        <LowSpoonOfficeHoursCard visits={lowSpoonMoves} />
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
          <span className="eyebrow">Search visits</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Student, concern, follow-up, or next action"
          />
        </label>
      </div>

      <OfficeHourVisitTable
        visits={filteredVisits}
        onAddVisit={openAddModal}
        onEditVisit={(visit) => {
          setEditingVisit(visit);
          setIsModalOpen(true);
        }}
        onDeleteVisit={handleDelete}
        onToggleFollowUp={handleToggleFollowUp}
        onStatusChange={handleStatusChange}
        onAddToToday={handleAddVisitToToday}
        isOnToday={(visit) => isSourceOnToday("office-hours", visit.id)}
      />

      {isModalOpen ? (
        <OfficeHourVisitModal
          courseId={currentCourse.id}
          visit={editingVisit}
          onClose={() => {
            setEditingVisit(undefined);
            setIsModalOpen(false);
          }}
          onSave={handleSave}
        />
      ) : null}
    </section>
  );
}
