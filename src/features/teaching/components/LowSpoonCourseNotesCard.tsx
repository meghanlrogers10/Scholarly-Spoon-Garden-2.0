import { noteTypeLabel } from "./courseNoteUtils";
import type { TeachingCourseNote } from "../types";

type LowSpoonCourseNotesCardProps = {
  notes: TeachingCourseNote[];
};

export function LowSpoonCourseNotesCard({ notes }: LowSpoonCourseNotesCardProps) {
  return (
    <aside className="teaching-notebook-panel">
      <div className="teaching-panel-heading">
        <p className="eyebrow">Low-spoon memory move</p>
        <h3>Only one useful memory</h3>
      </div>

      {notes.length > 0 ? (
        <div className="teaching-change-list">
          {notes.slice(0, 3).map((note) => (
            <article key={note.id}>
              <span>{noteTypeLabel(note.noteType)}</span>
              <strong>{note.title || "Untitled note"}</strong>
              <p>
                Smallest useful move:{" "}
                {note.noteType === "change-next-time"
                  ? "Review this before teaching the class again."
                  : "Capture one thing future-you should remember."}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="teaching-muted-copy">
          Smallest useful move: capture one thing future-you should remember.
        </p>
      )}
    </aside>
  );
}
