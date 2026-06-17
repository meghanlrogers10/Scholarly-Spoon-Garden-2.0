import { useState, type FormEvent } from "react";
import { PrepChecklist } from "./PrepChecklist";
import type { PrepChecklistValue } from "./prepChecklistUtils";
import type {
  NewTeachingPrepSessionInput,
  TeachingMeeting,
  TeachingPrepSession,
} from "../types";

type PrepSessionModalProps = {
  courseId: string;
  meetings: TeachingMeeting[];
  session?: TeachingPrepSession;
  onClose: () => void;
  onSave: (input: NewTeachingPrepSessionInput) => void;
};

function initialChecklist(session?: TeachingPrepSession): PrepChecklistValue {
  return {
    iconPageReady: session?.prepChecklist?.iconPageReady ?? false,
    lectureNotesDrafted: session?.prepChecklist?.lectureNotesDrafted ?? false,
    slidesPrepped: session?.prepChecklist?.slidesPrepped ?? false,
    quizPrepared: session?.prepChecklist?.quizPrepared ?? false,
    homeworkPrepared: session?.prepChecklist?.homeworkPrepared ?? false,
    inClassActivityPrepped:
      session?.prepChecklist?.inClassActivityPrepped ?? false,
  };
}

export function PrepSessionModal({
  courseId,
  meetings,
  session,
  onClose,
  onSave,
}: PrepSessionModalProps) {
  const [checklist, setChecklist] = useState(() => initialChecklist(session));
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const meetingId = String(formData.get("meetingId") ?? "") || undefined;
    const topic = String(formData.get("topic") ?? "").trim();

    if (!topic && !meetingId) {
      setError("Add a topic or link this prep to a class meeting.");
      return;
    }

    const linkedMeeting = meetings.find((meeting) => meeting.id === meetingId);

    onSave({
      courseId,
      meetingId,
      week: String(formData.get("week") ?? "").trim() || linkedMeeting?.week || "",
      topic: topic || linkedMeeting?.topic || "",
      slides: String(formData.get("slides") ?? "").trim(),
      plan: String(formData.get("plan") ?? "").trim(),
      nextAction: String(formData.get("nextAction") ?? "").trim(),
      prepChecklist: checklist,
      completed: formData.get("completed") === "on",
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">
              {session ? "Edit prep session" : "Add prep session"}
            </p>
            <h2>{session ? "Update class prep" : "Plan class prep"}</h2>
            <p>A topic or linked class is enough to save a rough prep shell.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <label>
            <span>Linked class meeting</span>
            <select name="meetingId" defaultValue={session?.meetingId ?? ""}>
              <option value="">No linked meeting</option>
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.date || "No date"} · Week {meeting.week || "?"} ·{" "}
                  {meeting.topic || "Untitled meeting"}
                </option>
              ))}
            </select>
          </label>

          <div className="teaching-modal__row">
            <label>
              <span>Week</span>
              <input name="week" defaultValue={session?.week ?? ""} />
            </label>
            <label>
              <span>Topic</span>
              <input name="topic" defaultValue={session?.topic ?? ""} />
            </label>
          </div>

          <label>
            <span>Slides / link</span>
            <input name="slides" defaultValue={session?.slides ?? ""} />
          </label>

          <label>
            <span>Teaching plan / notes</span>
            <textarea name="plan" rows={5} defaultValue={session?.plan ?? ""} />
          </label>

          <label>
            <span>Next action</span>
            <textarea
              name="nextAction"
              rows={2}
              defaultValue={session?.nextAction ?? ""}
            />
          </label>

          <PrepChecklist value={checklist} onChange={setChecklist} />

          <label className="teaching-checkbox-row">
            <input
              name="completed"
              type="checkbox"
              defaultChecked={session?.completed ?? false}
            />
            <span>Completed prep session</span>
          </label>

          {error ? <p className="teaching-form-error">{error}</p> : null}

          <div className="teaching-modal__actions">
            <button
              className="teaching-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="teaching-primary-button" type="submit">
              Save prep
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
