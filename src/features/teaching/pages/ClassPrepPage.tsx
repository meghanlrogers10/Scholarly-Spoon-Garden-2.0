import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { ClassPrepSnapshot } from "../components/ClassPrepSnapshot";
import { PrepSessionCard } from "../components/PrepSessionCard";
import { PrepSessionModal } from "../components/PrepSessionModal";
import {
  getChecklistCompletion,
  prepChecklistItems,
} from "../components/prepChecklistUtils";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { useTeaching } from "../hooks/useTeaching";
import type {
  NewTeachingPrepSessionInput,
  TeachingMeeting,
  TeachingPrepSession,
} from "../types";
import { prepSessionTaskInput } from "../utils/teachingTaskBridge";
import "./teaching.css";

type PrepFilter = "all" | "needs-prep" | "completed" | "upcoming-linked";

const filterOptions: Array<{ label: string; value: PrepFilter }> = [
  { label: "All", value: "all" },
  { label: "Needs prep", value: "needs-prep" },
  { label: "Completed", value: "completed" },
  { label: "Linked to upcoming class", value: "upcoming-linked" },
];

function todayTimestamp() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function meetingTimestamp(meeting?: TeachingMeeting) {
  if (!meeting?.date) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(`${meeting.date}T00:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function weekNumber(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function sortPrepSessions(
  sessions: TeachingPrepSession[],
  meetingById: Map<string, TeachingMeeting>
) {
  return [...sessions].sort((a, b) => {
    const meetingCompare =
      meetingTimestamp(meetingById.get(a.meetingId ?? "")) -
      meetingTimestamp(meetingById.get(b.meetingId ?? ""));

    if (meetingCompare !== 0) {
      return meetingCompare;
    }

    const weekCompare = weekNumber(a.week) - weekNumber(b.week);

    if (weekCompare !== 0) {
      return weekCompare;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

function isUpcoming(meeting?: TeachingMeeting) {
  const timestamp = meetingTimestamp(meeting);
  return Number.isFinite(timestamp) && timestamp >= todayTimestamp();
}

function markdownEscape(value: string) {
  return value.replaceAll("\r\n", "\n").trim();
}

function createPrepMarkdown(
  courseCode: string,
  courseTitle: string,
  sessions: TeachingPrepSession[],
  meetingById: Map<string, TeachingMeeting>
) {
  const lines = [
    `# ${courseCode}: ${courseTitle} Prep Notes`,
    "",
    `Exported: ${new Date().toLocaleDateString()}`,
    "",
  ];

  sessions.forEach((session) => {
    const meeting = meetingById.get(session.meetingId ?? "");
    const checklist = getChecklistCompletion(session.prepChecklist);

    lines.push(`## ${session.topic || meeting?.topic || "Untitled prep"}`);
    lines.push("");
    lines.push(`- Week: ${session.week || "Not set"}`);
    lines.push(
      `- Linked class: ${
        meeting
          ? `${meeting.date || "No date"} - ${meeting.topic || "Untitled meeting"}`
          : "None"
      }`
    );
    lines.push(`- Completed: ${session.completed ? "Yes" : "No"}`);
    lines.push(`- Checklist: ${checklist.completed}/${checklist.total}`);
    lines.push(`- Slides/link: ${session.slides || "None"}`);
    lines.push(`- Next action: ${session.nextAction || "None"}`);
    lines.push("");
    lines.push("### Plan");
    lines.push(markdownEscape(session.plan) || "No plan captured.");
    lines.push("");
    lines.push("### Checklist");
    prepChecklistItems.forEach((item) => {
      lines.push(`- [${session.prepChecklist?.[item.key] ? "x" : " "}] ${item.label}`);
    });
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

function lowSpoonItems(
  sessions: TeachingPrepSession[],
  upcomingMeetings: TeachingMeeting[],
  meetingById: Map<string, TeachingMeeting>
) {
  const incomplete = sessions.filter((session) => !session.completed);
  const nextMeeting = upcomingMeetings[0];
  const nextLinked = nextMeeting
    ? incomplete.filter((session) => session.meetingId === nextMeeting.id)
    : [];
  const withNextAction = incomplete.filter((session) => session.nextAction.trim());
  const missingSlides = incomplete.filter((session) => !session.slides.trim());
  const missingPlan = incomplete.filter((session) => !session.plan.trim());
  const candidates =
    nextLinked.length > 0
      ? nextLinked
      : withNextAction.length > 0
        ? withNextAction
        : missingSlides.length > 0
          ? missingSlides
          : missingPlan.length > 0
            ? missingPlan
            : incomplete;

  return candidates.slice(0, 3).map((session) => {
    const meeting = meetingById.get(session.meetingId ?? "");
    const fallback = !session.slides.trim()
      ? "Add or find the slides/link."
      : !session.plan.trim()
        ? "Draft the rough teaching plan."
        : "Open this prep session and make one small improvement.";

    return {
      id: session.id,
      topic: session.topic || meeting?.topic || "Untitled prep",
      action: session.nextAction || fallback,
      meeting,
    };
  });
}

export function ClassPrepPage() {
  const { courseId } = useParams();
  const {
    getCourseById,
    getSemesterById,
    getMeetingsForCourse,
    getPrepSessionsForCourse,
    createPrepSession,
    updatePrepSession,
    deletePrepSession,
  } = useTeaching();
  const [filter, setFilter] = useState<PrepFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSession, setEditingSession] = useState<TeachingPrepSession>();
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
  const meetings = getMeetingsForCourse(currentCourse.id);
  const meetingById = new Map(meetings.map((meeting) => [meeting.id, meeting]));
  const upcomingMeetings = meetings
    .filter((meeting) => !meeting.canceled && isUpcoming(meeting))
    .sort((a, b) => meetingTimestamp(a) - meetingTimestamp(b));
  const sessions = sortPrepSessions(
    getPrepSessionsForCourse(currentCourse.id),
    meetingById
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSessions = sessions.filter((session) => {
    const linkedMeeting = meetingById.get(session.meetingId ?? "");
    const matchesFilter =
      filter === "all" ||
      (filter === "needs-prep" && !session.completed) ||
      (filter === "completed" && session.completed) ||
      (filter === "upcoming-linked" && isUpcoming(linkedMeeting));
    const haystack = [
      session.topic,
      session.plan,
      session.nextAction,
      session.slides,
      linkedMeeting?.topic ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return matchesFilter && (!normalizedSearch || haystack.includes(normalizedSearch));
  });
  const completedCount = sessions.filter((session) => session.completed).length;
  const incompleteSessions = sessions.filter((session) => !session.completed);
  const preppedMeetingIds = new Set(
    sessions
      .filter((session) => session.completed && session.meetingId)
      .map((session) => session.meetingId)
  );
  const upcomingNeedingPrep = upcomingMeetings.filter(
    (meeting) => !preppedMeetingIds.has(meeting.id)
  );
  const nextIncomplete = incompleteSessions[0];
  const lowSpoonMoves = lowSpoonItems(sessions, upcomingMeetings, meetingById);

  function handleSavePrep(input: NewTeachingPrepSessionInput) {
    if (editingSession) {
      updatePrepSession(editingSession.id, input);
    } else {
      createPrepSession(input);
    }

    setEditingSession(undefined);
    setIsModalOpen(false);
  }

  function handleDeletePrep(session: TeachingPrepSession) {
    const label = session.topic || "this prep session";

    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deletePrepSession(session.id);
    }
  }

  function handleExport() {
    downloadMarkdown(
      `${currentCourse.code || "course"}-prep-notes.md`,
      createPrepMarkdown(currentCourse.code, currentCourse.title, sessions, meetingById)
    );
  }

  function handleAddPrepToToday(session: TeachingPrepSession) {
    const linkedMeeting = meetingById.get(session.meetingId ?? "");
    addLinkedTaskToToday(
      prepSessionTaskInput(currentCourse, session, linkedMeeting?.date),
    );
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${currentCourse.id}`}>
            Back to {currentCourse.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} · Class
            Prep
          </p>

          <h1>{currentCourse.code}: Class Prep</h1>

          <p>
            Session plans, slides, checklists, next actions, and the smallest
            useful move before class.
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Course</span>
          <strong>{currentCourse.title}</strong>

          <span>Needs prep</span>
          <strong>{incompleteSessions.length}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={currentCourse.id} />
      <TeachingCourseSummaryStrip courseId={currentCourse.id} />

      <div className="teaching-notebook-toolbar">
        <div>
          <p className="eyebrow">Class Prep</p>
          <h2>Prep sessions</h2>
        </div>
        <div className="teaching-hero-panel__actions">
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={handleExport}
            disabled={sessions.length === 0}
          >
            Export Prep Notes
          </button>
          <button
            className="teaching-primary-button"
            type="button"
            onClick={() => {
              setEditingSession(undefined);
              setIsModalOpen(true);
            }}
          >
            Add Prep Session
          </button>
        </div>
      </div>

      <div className="teaching-notebook-grid">
        <ClassPrepSnapshot
          total={sessions.length}
          completed={completedCount}
          incomplete={incompleteSessions.length}
          upcomingNeedingPrep={upcomingNeedingPrep.length}
          nextClassDate={upcomingMeetings[0]?.date ?? "None scheduled"}
          nextPrepAction={
            nextIncomplete?.nextAction ||
            (nextIncomplete ? `Prep ${nextIncomplete.topic || "the next class"}` : "All clear")
          }
        />

        <aside className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Low-spoon prep move</p>
            <h3>Only the next small step</h3>
          </div>
          {lowSpoonMoves.length > 0 ? (
            <div className="teaching-change-list">
              {lowSpoonMoves.map((move) => (
                <article key={move.id}>
                  <span>
                    {move.meeting?.date
                      ? `Before ${move.meeting.date}`
                      : "Prep session"}
                  </span>
                  <strong>{move.topic}</strong>
                  <p>Smallest useful move: {move.action}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="teaching-muted-copy">No incomplete prep sessions right now.</p>
          )}
        </aside>
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
          <span className="eyebrow">Search prep</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Topic, plan, or next action"
          />
        </label>
      </div>

      {filteredSessions.length > 0 ? (
        <div className="teaching-prep-list">
          {filteredSessions.map((session) => {
            const linkedMeeting = meetingById.get(session.meetingId ?? "");

            return (
              <PrepSessionCard
                key={session.id}
                session={session}
                linkedMeeting={linkedMeeting}
                changeNextTime={linkedMeeting?.changeNextTime}
                onEdit={(selectedSession) => {
                  setEditingSession(selectedSession);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeletePrep}
                onToggleCompleted={(selectedSession) =>
                  updatePrepSession(selectedSession.id, {
                    completed: !selectedSession.completed,
                  })
                }
                onAddToToday={handleAddPrepToToday}
                isOnToday={isSourceOnToday("teaching-prep", session.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="teaching-empty-state">
          <p>No prep sessions yet. Add the next class you need to get ready for.</p>
          <button
            className="teaching-primary-button"
            type="button"
            onClick={() => {
              setEditingSession(undefined);
              setIsModalOpen(true);
            }}
          >
            Add Prep Session
          </button>
        </div>
      )}

      {isModalOpen ? (
        <PrepSessionModal
          courseId={currentCourse.id}
          meetings={meetings}
          session={editingSession}
          onClose={() => {
            setEditingSession(undefined);
            setIsModalOpen(false);
          }}
          onSave={handleSavePrep}
        />
      ) : null}
    </section>
  );
}
