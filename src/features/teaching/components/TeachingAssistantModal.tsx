import { useState, type FormEvent } from "react";
import type {
  NewTeachingAssistantInput,
  TeachingAssistant,
  TeachingAssistantRole,
} from "../types";

type TeachingAssistantModalProps = {
  courseId: string;
  assistant?: TeachingAssistant;
  onClose: () => void;
  onSave: (input: NewTeachingAssistantInput) => void;
};

const roles: TeachingAssistantRole[] = [
  "grader",
  "discussion",
  "lead-ta",
  "support",
  "other",
];

export function TeachingAssistantModal({
  courseId,
  assistant,
  onClose,
  onSave,
}: TeachingAssistantModalProps) {
  const [role, setRole] = useState<TeachingAssistantRole | "">(
    assistant?.role ?? ""
  );
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setError("Add a TA name.");
      return;
    }

    onSave({
      courseId,
      name,
      email: String(formData.get("email") ?? "").trim(),
      officeHours: String(formData.get("officeHours") ?? "").trim(),
      role: role || undefined,
      notes: String(formData.get("notes") ?? "").trim(),
      active: formData.get("active") === "on",
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">{assistant ? "Edit TA" : "Add TA"}</p>
            <h2>{assistant ? "Update TA profile" : "Create TA profile"}</h2>
            <p>Profiles make reminders and emails easier later.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>Name</span>
              <input name="name" defaultValue={assistant?.name ?? ""} />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" defaultValue={assistant?.email ?? ""} />
            </label>
          </div>
          <div className="teaching-modal__row">
            <label>
              <span>Office hours</span>
              <input name="officeHours" defaultValue={assistant?.officeHours ?? ""} />
            </label>
            <label>
              <span>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value as TeachingAssistantRole | "")}>
                <option value="">No role</option>
                {roles.map((roleValue) => (
                  <option key={roleValue} value={roleValue}>
                    {roleValue}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span>Notes</span>
            <textarea name="notes" rows={3} defaultValue={assistant?.notes ?? ""} />
          </label>
          <label className="teaching-checkbox-row">
            <input name="active" type="checkbox" defaultChecked={assistant?.active ?? true} />
            <span>Active TA</span>
          </label>
          {error ? <p className="teaching-form-error">{error}</p> : null}
          <div className="teaching-modal__actions">
            <button className="teaching-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="teaching-primary-button" type="submit">
              Save TA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
