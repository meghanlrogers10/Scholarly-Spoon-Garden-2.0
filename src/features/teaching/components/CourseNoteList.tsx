import { CourseNoteCard } from "./CourseNoteCard";
import type { TeachingCourseNote } from "../types";

type CourseNoteListProps = {
  notes: TeachingCourseNote[];
  onAddNote: () => void;
  onEditNote: (note: TeachingCourseNote) => void;
  onDeleteNote: (note: TeachingCourseNote) => void;
  onExportNote: (note: TeachingCourseNote) => void;
  onAddToToday?: (note: TeachingCourseNote) => void;
  isOnToday?: (note: TeachingCourseNote) => boolean;
};

export function CourseNoteList({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onExportNote,
  onAddToToday,
  isOnToday,
}: CourseNoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="teaching-empty-state">
        <p>
          No course notes yet. Capture lecture changes, student confusion, policy
          reminders, or anything future-you should not have to remember alone.
        </p>
        <button className="teaching-primary-button" type="button" onClick={onAddNote}>
          Add Note
        </button>
      </div>
    );
  }

  return (
    <div className="teaching-note-list">
      {notes.map((note) => (
        <CourseNoteCard
          key={note.id}
          note={note}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
          onExport={onExportNote}
          onAddToToday={onAddToToday}
          isOnToday={isOnToday?.(note) ?? false}
        />
      ))}
    </div>
  );
}
