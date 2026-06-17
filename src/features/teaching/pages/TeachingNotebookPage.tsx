import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  GenerateScheduleModal,
  type GenerateScheduleInput,
} from "../components/GenerateScheduleModal";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { TeachingMeetingModal } from "../components/TeachingMeetingModal";
import { TeachingMeetingTable } from "../components/TeachingMeetingTable";
import { useTeaching } from "../hooks/useTeaching";
import type { NewTeachingMeetingInput, TeachingMeeting } from "../types";
import "./teaching.css";

const csvColumns = [
  "week",
  "date",
  "topic",
  "readings",
  "due",
  "notes",
  "changeNextTime",
  "canceled",
];

function sortMeetings(meetings: TeachingMeeting[]) {
  return [...meetings].sort((a, b) => {
    const orderCompare = a.order - b.order;

    if (orderCompare !== 0) {
      return orderCompare;
    }

    return a.date.localeCompare(b.date);
  });
}

function dateToOrder(date: string, fallback: number) {
  const numericDate = Number(date.replaceAll("-", ""));

  return Number.isFinite(numericDate) && numericDate > 0
    ? numericDate
    : fallback;
}

function csvEscape(value: string | boolean) {
  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      currentCell += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentCell = "";
      currentRow = [];
    } else {
      currentCell += character;
    }
  }

  currentRow.push(currentCell);
  rows.push(currentRow);

  return rows.filter((row) => row.some((cell) => cell.trim()));
}

function createCsv(meetings: TeachingMeeting[]) {
  const valueFor = (meeting: TeachingMeeting, column: string) => {
    switch (column) {
      case "week":
        return meeting.week;
      case "date":
        return meeting.date;
      case "topic":
        return meeting.topic;
      case "readings":
        return meeting.readings;
      case "due":
        return meeting.due;
      case "notes":
        return meeting.notes;
      case "changeNextTime":
        return meeting.changeNextTime;
      case "canceled":
        return meeting.canceled;
      default:
        return "";
    }
  };
  const rows = [
    csvColumns.join(","),
    ...meetings.map((meeting) =>
      csvColumns
        .map((column) => csvEscape(valueFor(meeting, column)))
        .join(",")
    ),
  ];

  return rows.join("\n");
}

function getTodayTimestamp() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.getTime();
}

export function TeachingNotebookPage() {
  const { courseId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    getCourseById,
    getSemesterById,
    getMeetingsForCourse,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  } = useTeaching();
  const [editingMeeting, setEditingMeeting] = useState<TeachingMeeting>();
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const course = getCourseById(courseId);
  const semester = course ? getSemesterById(course.semesterId) : undefined;
  const meetings = useMemo(
    () => (course ? sortMeetings(getMeetingsForCourse(course.id)) : []),
    [course, getMeetingsForCourse]
  );
  const nextOrder =
    meetings.reduce((highestOrder, meeting) => {
      return Math.max(highestOrder, meeting.order);
    }, 0) + 1;

  const snapshot = useMemo(() => {
    const todayTimestamp = getTodayTimestamp();
    const upcomingMeetings = meetings.filter((meeting) => {
      const timestamp = new Date(`${meeting.date}T00:00:00`).getTime();

      return !meeting.canceled && Number.isFinite(timestamp) && timestamp >= todayTimestamp;
    });
    const nextMeeting = upcomingMeetings[0];

    return {
      total: meetings.length,
      upcoming: upcomingMeetings.length,
      canceled: meetings.filter((meeting) => meeting.canceled).length,
      missingTopic: meetings.filter((meeting) => !meeting.topic.trim()).length,
      nextDate: nextMeeting?.date ?? "None scheduled",
      nextTopic: nextMeeting?.topic || "No topic yet",
    };
  }, [meetings]);

  const changeNextTimeMeetings = meetings.filter((meeting) =>
    meeting.changeNextTime.trim()
  );

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

  function openAddMeetingModal() {
    setEditingMeeting(undefined);
    setIsMeetingModalOpen(true);
  }

  function handleSaveMeeting(input: NewTeachingMeetingInput) {
    if (editingMeeting) {
      updateMeeting(editingMeeting.id, input);
    } else {
      createMeeting(input);
    }

    setIsMeetingModalOpen(false);
    setEditingMeeting(undefined);
  }

  function handleDeleteMeeting(meeting: TeachingMeeting) {
    const label = meeting.topic || meeting.date || "this meeting";

    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteMeeting(meeting.id);
    }
  }

  function handleToggleCanceled(meeting: TeachingMeeting) {
    updateMeeting(meeting.id, { canceled: !meeting.canceled });
  }

  function handleGenerateSchedule(input: GenerateScheduleInput) {
    const start = new Date(`${input.startDate}T00:00:00`);
    const end = new Date(`${input.endDate}T00:00:00`);
    const existingDates = new Set(meetings.map((meeting) => meeting.date));
    let generatedCount = 0;

    for (
      const currentDate = new Date(start);
      currentDate <= end;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      if (!input.weekdays.includes(currentDate.getDay())) {
        continue;
      }

      const date = currentDate.toISOString().slice(0, 10);

      if (input.skipExistingDates && existingDates.has(date)) {
        continue;
      }

      const weekOffset = Math.floor(
        (currentDate.getTime() - start.getTime()) / 604_800_000
      );

      createMeeting({
        courseId: currentCourse.id,
        week: String(input.startingWeek + weekOffset),
        date,
        topic: "",
        readings: "",
        due: "",
        notes: "",
        changeNextTime: "",
        canceled: false,
        order: dateToOrder(date, nextOrder + generatedCount),
      });
      generatedCount += 1;
    }

    setIsGenerateModalOpen(false);
  }

  function handleExportCsv() {
    const blob = new Blob([createCsv(meetings)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${currentCourse.code || "course"}-notebook.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const rows = parseCsv(await file.text());
    const [headers = [], ...dataRows] = rows;
    const normalizedHeaders = headers.map((header) => header.trim());
    const existingDates = new Set(meetings.map((meeting) => meeting.date));
    const rowsToImport = dataRows
      .map((row, rowIndex) => {
        const valueFor = (column: string) => {
          const columnIndex = normalizedHeaders.indexOf(column);
          return columnIndex >= 0 ? row[columnIndex]?.trim() ?? "" : "";
        };
        const date = valueFor("date");

        if (date && existingDates.has(date)) {
          return undefined;
        }

        return {
          courseId: currentCourse.id,
          week: valueFor("week"),
          date,
          topic: valueFor("topic"),
          readings: valueFor("readings"),
          due: valueFor("due"),
          notes: valueFor("notes"),
          changeNextTime: valueFor("changeNextTime"),
          canceled: valueFor("canceled").toLowerCase() === "true",
          order: dateToOrder(date, nextOrder + rowIndex),
        };
      })
      .filter((row): row is NewTeachingMeetingInput => Boolean(row))
      .filter((row) => row.date || row.topic);

    if (
      rowsToImport.length > 0 &&
      window.confirm(`Import ${rowsToImport.length} meeting rows?`)
    ) {
      rowsToImport.forEach((row) => createMeeting(row));
    }

    event.target.value = "";
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${course.id}`}>
            Back to {course.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} · Class
            Notebook
          </p>

          <h1>{course.code}: Class Notebook</h1>

          <p>
            Course schedule, readings, due items, cancellations, and the small
            notes future-you will be glad you kept.
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Course</span>
          <strong>{course.title}</strong>

          <span>Meetings</span>
          <strong>{meetings.length}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={course.id} />
      <TeachingCourseSummaryStrip courseId={course.id} />

      <div className="teaching-notebook-toolbar">
        <div>
          <p className="eyebrow">Course schedule</p>
          <h2>Class meetings</h2>
        </div>
        <div className="teaching-hero-panel__actions">
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
          >
            Generate Schedule
          </button>
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={handleExportCsv}
            disabled={meetings.length === 0}
          >
            Export CSV
          </button>
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Import CSV
          </button>
          <input
            ref={fileInputRef}
            className="teaching-hidden-input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCsv}
          />
          <button
            className="teaching-primary-button"
            type="button"
            onClick={openAddMeetingModal}
          >
            Add Meeting
          </button>
        </div>
      </div>

      <div className="teaching-notebook-grid">
        <aside className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Notebook Snapshot</p>
            <h3>At a glance</h3>
          </div>
          <div className="teaching-notebook-stats">
            <span>Total meetings</span>
            <strong>{snapshot.total}</strong>
            <span>Upcoming</span>
            <strong>{snapshot.upcoming}</strong>
            <span>Canceled</span>
            <strong>{snapshot.canceled}</strong>
            <span>Missing topic</span>
            <strong>{snapshot.missingTopic}</strong>
            <span>Next class date</span>
            <strong>{snapshot.nextDate}</strong>
            <span>Next topic</span>
            <strong>{snapshot.nextTopic}</strong>
          </div>
        </aside>

        <aside className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Change Next Time</p>
            <h3>Carry these forward</h3>
          </div>
          {changeNextTimeMeetings.length > 0 ? (
            <div className="teaching-change-list">
              {changeNextTimeMeetings.map((meeting) => (
                <article key={meeting.id}>
                  <span>{meeting.date || `Week ${meeting.week}`}</span>
                  <strong>{meeting.topic || "Untitled meeting"}</strong>
                  <p>{meeting.changeNextTime}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="teaching-muted-copy">
              No change-next-time notes yet.
            </p>
          )}
        </aside>
      </div>

      <TeachingMeetingTable
        meetings={meetings}
        onAddMeeting={openAddMeetingModal}
        onEditMeeting={(meeting) => {
          setEditingMeeting(meeting);
          setIsMeetingModalOpen(true);
        }}
        onDeleteMeeting={handleDeleteMeeting}
        onToggleCanceled={handleToggleCanceled}
      />

      {isMeetingModalOpen ? (
        <TeachingMeetingModal
          courseId={course.id}
          meeting={editingMeeting}
          nextOrder={nextOrder}
          onClose={() => {
            setIsMeetingModalOpen(false);
            setEditingMeeting(undefined);
          }}
          onSave={handleSaveMeeting}
        />
      ) : null}

      {isGenerateModalOpen ? (
        <GenerateScheduleModal
          onClose={() => setIsGenerateModalOpen(false)}
          onGenerate={handleGenerateSchedule}
        />
      ) : null}
    </section>
  );
}
