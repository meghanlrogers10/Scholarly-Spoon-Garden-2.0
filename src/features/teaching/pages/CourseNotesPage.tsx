import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { CourseNoteEditor } from "../components/CourseNoteEditor";
import { CourseNoteList } from "../components/CourseNoteList";
import { CourseNotesSummaryCards } from "../components/CourseNotesSummaryCards";
import { LowSpoonCourseNotesCard } from "../components/LowSpoonCourseNotesCard";
import { noteTypeLabel, noteTypeOptions } from "../components/courseNoteUtils";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { useTeaching } from "../hooks/useTeaching";
import type {
  NewTeachingCourseNoteInput,
  TeachingCourseNote,
  TeachingCourseNoteType,
} from "../types";
import { noteTaskInput } from "../utils/teachingTaskBridge";
import "./teaching.css";

type NoteSort = "updated" | "created" | "title";

function isRecentlyUpdated(note: TeachingCourseNote) {
  const updated = new Date(note.updatedAt).getTime();
  return Number.isFinite(updated) && Date.now() - updated <= 7 * 86_400_000;
}

function isChangeNextTime(note: TeachingCourseNote) {
  const text = `${note.title} ${note.body} ${note.tags.join(" ")}`.toLowerCase();
  return note.noteType === "change-next-time" || text.includes("change next time");
}

function sortNotes(notes: TeachingCourseNote[], sort: NoteSort) {
  return [...notes].sort((a, b) => {
    if (sort === "title") {
      return (a.title || "Untitled note").localeCompare(b.title || "Untitled note");
    }

    const field = sort === "created" ? "createdAt" : "updatedAt";
    return b[field].localeCompare(a[field]);
  });
}

function markdownEscape(value: string) {
  return value.replaceAll("\r\n", "\n").trim();
}

function noteMarkdown(note: TeachingCourseNote) {
  return [
    `# ${note.title || "Untitled note"}`,
    "",
    `Type: ${noteTypeLabel(note.noteType)}`,
    `Tags: ${note.tags.length > 0 ? note.tags.join(", ") : "None"}`,
    `Created: ${note.createdAt}`,
    `Updated: ${note.updatedAt}`,
    "",
    markdownEscape(note.body) || "No body captured.",
    "",
  ].join("\n");
}

function allNotesMarkdown(
  courseCode: string,
  courseTitle: string,
  notes: TeachingCourseNote[]
) {
  const lines = [
    `# ${courseCode}: ${courseTitle} Course Notes`,
    "",
    `Exported: ${new Date().toLocaleDateString()}`,
    "",
  ];

  noteTypeOptions.forEach((type) => {
    const matchingNotes = notes.filter((note) => note.noteType === type.value);

    if (matchingNotes.length === 0) {
      return;
    }

    lines.push(`## ${type.label}`);
    lines.push("");
    matchingNotes.forEach((note) => {
      lines.push(`### ${note.title || "Untitled note"}`);
      lines.push("");
      lines.push(`Tags: ${note.tags.length > 0 ? note.tags.join(", ") : "None"}`);
      lines.push(`Created: ${note.createdAt}`);
      lines.push(`Updated: ${note.updatedAt}`);
      lines.push("");
      lines.push(markdownEscape(note.body) || "No body captured.");
      lines.push("");
    });
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

function lowSpoonNotes(notes: TeachingCourseNote[], changeNotes: TeachingCourseNote[]) {
  const studentConfusion = notes.filter(
    (note) => note.noteType === "student-confusion"
  );

  if (changeNotes.length > 0) {
    return changeNotes.slice(0, 3);
  }

  if (studentConfusion.length > 0) {
    return studentConfusion.slice(0, 3);
  }

  return notes.slice(0, 3);
}

export function CourseNotesPage() {
  const { courseId } = useParams();
  const {
    getCourseById,
    getSemesterById,
    getCourseNotesForCourse,
    createCourseNote,
    updateCourseNote,
    deleteCourseNote,
  } = useTeaching();
  const [searchTerm, setSearchTerm] = useState("");
  const [noteTypeFilter, setNoteTypeFilter] = useState<TeachingCourseNoteType | "all">(
    "all"
  );
  const [tagFilter, setTagFilter] = useState("all");
  const [sort, setSort] = useState<NoteSort>("updated");
  const [editingNote, setEditingNote] = useState<TeachingCourseNote>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
  const notes = sortNotes(getCourseNotesForCourse(currentCourse.id), sort);
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags))).sort();
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredNotes = notes.filter((note) => {
    const matchesType =
      noteTypeFilter === "all" || note.noteType === noteTypeFilter;
    const matchesTag = tagFilter === "all" || note.tags.includes(tagFilter);
    const haystack = [note.title, note.body, note.tags.join(" ")]
      .join(" ")
      .toLowerCase();

    return (
      matchesType &&
      matchesTag &&
      (!normalizedSearch || haystack.includes(normalizedSearch))
    );
  });
  const changeNotes = notes.filter(isChangeNextTime);
  const summary = {
    total: notes.length,
    lecture: notes.filter((note) => note.noteType === "lecture").length,
    studentConfusion: notes.filter((note) => note.noteType === "student-confusion")
      .length,
    changeNextTime: changeNotes.length,
    policy: notes.filter((note) => note.noteType === "policy").length,
    recentlyUpdated: notes.filter(isRecentlyUpdated).length,
  };
  const memoryMoves = lowSpoonNotes(notes, changeNotes);

  function openAddEditor() {
    setEditingNote(undefined);
    setIsEditorOpen(true);
  }

  function handleSave(input: NewTeachingCourseNoteInput) {
    if (editingNote) {
      updateCourseNote(editingNote.id, input);
    } else {
      createCourseNote(input);
    }

    setEditingNote(undefined);
    setIsEditorOpen(false);
  }

  function handleDelete(note: TeachingCourseNote) {
    const label = note.title || "this note";

    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteCourseNote(note.id);
    }
  }

  function exportNote(note: TeachingCourseNote) {
    downloadMarkdown(
      `${currentCourse.code || "course"}-${note.title || "teaching-note"}.md`,
      noteMarkdown(note)
    );
  }

  function exportAllNotes() {
    downloadMarkdown(
      `${currentCourse.code || "course"}-course-notes.md`,
      allNotesMarkdown(currentCourse.code, currentCourse.title, notes)
    );
  }

  function handleAddNoteToToday(note: TeachingCourseNote) {
    addLinkedTaskToToday(noteTaskInput(currentCourse, note));
  }

  // TODO: Add autosave once the editor can debounce updates without surprising saves.

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${currentCourse.id}`}>
            Back to {currentCourse.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} · Course
            Notes
          </p>

          <h1>{currentCourse.code}: Course Notes</h1>

          <p>
            A low-friction memory layer for teaching moments, student confusion,
            policies, activities, and future-semester reminders.
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Course</span>
          <strong>{currentCourse.title}</strong>

          <span>Notes</span>
          <strong>{notes.length}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={currentCourse.id} />
      <TeachingCourseSummaryStrip courseId={currentCourse.id} />

      <div className="teaching-notebook-toolbar">
        <div>
          <p className="eyebrow">Course Notes</p>
          <h2>Teaching memory</h2>
        </div>
        <div className="teaching-hero-panel__actions">
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={exportAllNotes}
            disabled={notes.length === 0}
          >
            Export All Course Notes
          </button>
          <button className="teaching-primary-button" type="button" onClick={openAddEditor}>
            Add Note
          </button>
        </div>
      </div>

      <div className="teaching-notebook-grid">
        <div className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Notes Summary</p>
            <h3>Memory shape</h3>
          </div>
          <CourseNotesSummaryCards {...summary} />
        </div>
        <LowSpoonCourseNotesCard notes={memoryMoves} />
      </div>

      <aside className="teaching-notebook-panel">
        <div className="teaching-panel-heading">
          <p className="eyebrow">Change next time</p>
          <h3>Future-teaching spotlight</h3>
        </div>
        {changeNotes.length > 0 ? (
          <div className="teaching-change-list">
            {changeNotes.slice(0, 3).map((note) => (
              <article key={note.id}>
                <span>{noteTypeLabel(note.noteType)}</span>
                <strong>{note.title || "Untitled note"}</strong>
                <p>{note.body || "No body captured yet."}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="teaching-muted-copy">
            No change-next-time notes yet.
          </p>
        )}
      </aside>

      <div className="teaching-prep-controls">
        <div className="teaching-filter-group">
          <button
            className="teaching-chip-button"
            type="button"
            aria-pressed={noteTypeFilter === "all"}
            onClick={() => setNoteTypeFilter("all")}
          >
            All types
          </button>
          {noteTypeOptions.map((option) => (
            <button
              key={option.value}
              className="teaching-chip-button"
              type="button"
              aria-pressed={noteTypeFilter === option.value}
              onClick={() => setNoteTypeFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label>
          <span className="eyebrow">Tag</span>
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="eyebrow">Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as NoteSort)}>
            <option value="updated">Updated</option>
            <option value="created">Created</option>
            <option value="title">Title</option>
          </select>
        </label>

        <label>
          <span className="eyebrow">Search notes</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Title, body, or tags"
          />
        </label>
      </div>

      <CourseNoteList
        notes={filteredNotes}
        onAddNote={openAddEditor}
        onEditNote={(note) => {
          setEditingNote(note);
          setIsEditorOpen(true);
        }}
        onDeleteNote={handleDelete}
        onExportNote={exportNote}
        onAddToToday={handleAddNoteToToday}
        isOnToday={(note) => isSourceOnToday("resource", `note:${note.id}`)}
      />

      {isEditorOpen ? (
        <CourseNoteEditor
          courseId={currentCourse.id}
          note={editingNote}
          onClose={() => {
            setEditingNote(undefined);
            setIsEditorOpen(false);
          }}
          onSave={handleSave}
        />
      ) : null}
    </section>
  );
}
