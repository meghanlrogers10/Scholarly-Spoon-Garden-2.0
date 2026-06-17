import { useState, type FormEvent } from "react";
import type { NewTeachingMeetingInput, TeachingMeeting } from "../types";

type MeetingFormState = Omit<NewTeachingMeetingInput, "courseId" | "order"> & {
  order?: number;
};

type TeachingMeetingModalProps = {
  courseId: string;
  meeting?: TeachingMeeting;
  nextOrder: number;
  onClose: () => void;
  onSave: (input: NewTeachingMeetingInput) => void;
};

function createInitialState(
  nextOrder: number,
  meeting?: TeachingMeeting
): MeetingFormState {
  return {
    week: meeting?.week ?? "",
    date: meeting?.date ?? "",
    topic: meeting?.topic ?? "",
    readings: meeting?.readings ?? "",
    due: meeting?.due ?? "",
    notes: meeting?.notes ?? "",
    changeNextTime: meeting?.changeNextTime ?? "",
    canceled: meeting?.canceled ?? false,
    order: meeting?.order ?? nextOrder,
  };
}

export function TeachingMeetingModal({
  courseId,
  meeting,
  nextOrder,
  onClose,
  onSave,
}: TeachingMeetingModalProps) {
  const [formState, setFormState] = useState(() =>
    createInitialState(nextOrder, meeting)
  );
  const [error, setError] = useState("");

  function updateField(
    field: keyof MeetingFormState,
    value: string | boolean
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const date = String(formData.get("date") ?? "");
    const topic = String(formData.get("topic") ?? "").trim();

    if (!date.trim() && !topic) {
      setError("Add a date or topic so this meeting has an anchor.");
      return;
    }

    onSave({
      courseId,
      week: String(formData.get("week") ?? "").trim(),
      date,
      topic,
      readings: String(formData.get("readings") ?? "").trim(),
      due: String(formData.get("due") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      changeNextTime: String(formData.get("changeNextTime") ?? "").trim(),
      canceled: formData.get("canceled") === "on",
      order: formState.order ?? nextOrder,
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">{meeting ? "Edit meeting" : "Add meeting"}</p>
            <h2>{meeting ? "Update class meeting" : "Create class meeting"}</h2>
            <p>Date or topic is enough. Rough rows are welcome here.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>Week</span>
              <input
                name="week"
                value={formState.week}
                onChange={(event) => updateField("week", event.target.value)}
                placeholder="1"
              />
            </label>
            <label>
              <span>Date</span>
              <input
                name="date"
                type="date"
                value={formState.date}
                onChange={(event) => updateField("date", event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Topic</span>
            <input
              name="topic"
              value={formState.topic}
              onChange={(event) => updateField("topic", event.target.value)}
              placeholder="Seminar introduction"
            />
          </label>

          <label>
            <span>Readings</span>
            <textarea
              name="readings"
              rows={3}
              value={formState.readings}
              onChange={(event) => updateField("readings", event.target.value)}
            />
          </label>

          <label>
            <span>Due</span>
            <textarea
              name="due"
              rows={2}
              value={formState.due}
              onChange={(event) => updateField("due", event.target.value)}
            />
          </label>

          <label>
            <span>Notes</span>
            <textarea
              name="notes"
              rows={3}
              value={formState.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </label>

          <label>
            <span>Change next time</span>
            <textarea
              name="changeNextTime"
              rows={3}
              value={formState.changeNextTime}
              onChange={(event) =>
                updateField("changeNextTime", event.target.value)
              }
            />
          </label>

          <label className="teaching-checkbox-row">
            <input
              name="canceled"
              type="checkbox"
              checked={formState.canceled}
              onChange={(event) => updateField("canceled", event.target.checked)}
            />
            <span>Canceled class meeting</span>
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
              Save meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
