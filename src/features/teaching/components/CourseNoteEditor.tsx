import { useEffect, useMemo, useState, type FormEvent } from "react";
import { TEACHING_COURSE_NOTE_DRAFT_PREFIX } from "../../../shared/constants/teachingStorage";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import { noteTypeOptions, parseTags } from "./courseNoteUtils";
import type {
  NewTeachingCourseNoteInput,
  TeachingCourseNote,
  TeachingCourseNoteType,
} from "../types";

type CourseNoteEditorProps = {
  courseId: string;
  note?: TeachingCourseNote;
  onClose: () => void;
  onSave: (input: NewTeachingCourseNoteInput) => void;
};

type CourseNoteDraft = {
  title: string;
  noteType: TeachingCourseNoteType;
  tags: string;
  body: string;
  savedAt?: string;
};

export function CourseNoteEditor({
  courseId,
  note,
  onClose,
  onSave,
}: CourseNoteEditorProps) {
  const draftKey = `${TEACHING_COURSE_NOTE_DRAFT_PREFIX}${courseId}.${note?.id ?? "new"}`;
  const initialDraft = useMemo<CourseNoteDraft>(
    () => ({
      title: note?.title ?? "",
      noteType: note?.noteType ?? "other",
      tags: note?.tags.join(", ") ?? "",
      body: note?.body ?? "",
    }),
    [note],
  );
  const [draft, setDraft] = useLocalStorage<CourseNoteDraft>(
    draftKey,
    initialDraft,
  );
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDraft((currentDraft) => ({
        ...currentDraft,
        savedAt: new Date().toISOString(),
      }));
      setIsDirty(false);
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [draft.title, draft.noteType, draft.tags, draft.body, isDirty, setDraft]);

  function updateDraft(input: Partial<CourseNoteDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...input }));
    setIsDirty(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    const body = draft.body.trim();

    if (!title && !body) {
      setError("Add a title or body so this note has an anchor.");
      return;
    }

    onSave({
      courseId,
      title,
      body,
      noteType: draft.noteType,
      tags: parseTags(draft.tags),
    });

    setDraft(initialDraft);
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">{note ? "Edit course note" : "Add course note"}</p>
            <h2>{note ? "Update memory" : "Capture teaching memory"}</h2>
            <p>Title or body is enough. Tags can stay messy and useful.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>Title</span>
              <input
                name="title"
                value={draft.title}
                onChange={(event) => updateDraft({ title: event.target.value })}
              />
            </label>
            <label>
              <span>Note type</span>
              <select
                name="noteType"
                value={draft.noteType}
                onChange={(event) =>
                  updateDraft({
                    noteType: event.target.value as TeachingCourseNoteType,
                  })
                }
              >
                {noteTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Tags</span>
            <input
              name="tags"
              value={draft.tags}
              onChange={(event) => updateDraft({ tags: event.target.value })}
              placeholder="change next time, week 4, discussion"
            />
          </label>

          <label>
            <span>Body</span>
            <textarea
              name="body"
              rows={10}
              value={draft.body}
              onChange={(event) => updateDraft({ body: event.target.value })}
            />
          </label>

          {error ? <p className="teaching-form-error">{error}</p> : null}

          <div className="teaching-modal__actions">
            <span className="teaching-save-indicator">
              {isDirty
                ? "Autosaving draft..."
                : draft.savedAt
                  ? `Draft saved ${new Date(draft.savedAt).toLocaleTimeString()}`
                  : "Draft autosave ready"}
            </span>
            <button
              className="teaching-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="teaching-primary-button" type="submit">
              Save note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
