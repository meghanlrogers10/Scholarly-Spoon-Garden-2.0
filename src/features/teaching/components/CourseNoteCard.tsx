import { noteTypeLabel } from "./courseNoteUtils";
import type { TeachingCourseNote } from "../types";

type CourseNoteCardProps = {
  note: TeachingCourseNote;
  onEdit: (note: TeachingCourseNote) => void;
  onDelete: (note: TeachingCourseNote) => void;
  onExport: (note: TeachingCourseNote) => void;
  onAddToToday?: (note: TeachingCourseNote) => void;
  isOnToday?: boolean;
};

function preview(body: string) {
  if (body.length <= 180) {
    return body;
  }

  return `${body.slice(0, 180)}...`;
}

export function CourseNoteCard({
  note,
  onEdit,
  onDelete,
  onExport,
  onAddToToday,
  isOnToday,
}: CourseNoteCardProps) {
  return (
    <article className="teaching-note-card">
      <div className="teaching-note-card__header">
        <div>
          <span className="teaching-priority-badge">{noteTypeLabel(note.noteType)}</span>
          <h3>{note.title || "Untitled note"}</h3>
          <p>Updated {new Date(note.updatedAt).toLocaleDateString()}</p>
        </div>
        <div className="teaching-table-actions">
          <button className="teaching-chip-button" type="button" onClick={() => onExport(note)}>
            Export
          </button>
          {onAddToToday ? (
            <button
              className="teaching-chip-button"
              type="button"
              onClick={() => onAddToToday(note)}
              disabled={isOnToday}
            >
              {isOnToday ? "Added to Today" : "Add to Today"}
            </button>
          ) : null}
          <button className="teaching-chip-button" type="button" onClick={() => onEdit(note)}>
            Edit
          </button>
          <button
            className="teaching-chip-button teaching-chip-button--danger"
            type="button"
            onClick={() => onDelete(note)}
          >
            Delete
          </button>
        </div>
      </div>

      {note.tags.length > 0 ? (
        <div className="teaching-note-tags">
          {note.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}

      <p className="teaching-note-preview">
        {preview(note.body) || "No body yet."}
      </p>
    </article>
  );
}
