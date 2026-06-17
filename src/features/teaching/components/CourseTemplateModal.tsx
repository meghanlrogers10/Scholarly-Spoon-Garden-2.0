import { useState, type FormEvent } from "react";
import type {
  NewTeachingCourseTemplateInput,
  TeachingCourseTemplate,
} from "../types";

type CourseTemplateModalProps = {
  template?: TeachingCourseTemplate;
  onClose: () => void;
  onSave: (input: NewTeachingCourseTemplateInput) => void;
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinLines(values: string[]) {
  return values.join("\n");
}

export function CourseTemplateModal({
  template,
  onClose,
  onSave,
}: CourseTemplateModalProps) {
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setError("Give the template a name so future-you can find it.");
      return;
    }

    onSave({
      name,
      codePattern: String(formData.get("codePattern") ?? "").trim(),
      titlePattern: String(formData.get("titlePattern") ?? "").trim(),
      meetingPattern: String(formData.get("meetingPattern") ?? "").trim(),
      prepChecklist: splitLines(String(formData.get("prepChecklist") ?? "")),
      gradingCategories: splitLines(
        String(formData.get("gradingCategories") ?? ""),
      ),
      resourceCategories: splitLines(
        String(formData.get("resourceCategories") ?? ""),
      ),
      taSupported: formData.get("taSupported") === "on",
      notes: String(formData.get("notes") ?? "").trim(),
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">Course Template</p>
            <h2>{template ? "Edit template" : "Save a reusable course shell"}</h2>
            <p>Reusable structure only. No giant course-management cathedral.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <label>
            <span>Template name</span>
            <input name="name" defaultValue={template?.name ?? ""} autoFocus />
          </label>

          <div className="teaching-modal__row">
            <label>
              <span>Course code pattern</span>
              <input name="codePattern" defaultValue={template?.codePattern ?? ""} />
            </label>
            <label>
              <span>Course title pattern</span>
              <input
                name="titlePattern"
                defaultValue={template?.titlePattern ?? ""}
              />
            </label>
          </div>

          <label>
            <span>Meeting pattern</span>
            <input
              name="meetingPattern"
              defaultValue={template?.meetingPattern ?? ""}
            />
          </label>

          <div className="teaching-modal__row">
            <label>
              <span>Common prep checklist</span>
              <textarea
                name="prepChecklist"
                rows={5}
                defaultValue={joinLines(template?.prepChecklist ?? [])}
              />
            </label>
            <label>
              <span>Common grading categories</span>
              <textarea
                name="gradingCategories"
                rows={5}
                defaultValue={joinLines(template?.gradingCategories ?? [])}
              />
            </label>
          </div>

          <label>
            <span>Common resource categories</span>
            <textarea
              name="resourceCategories"
              rows={3}
              defaultValue={joinLines(template?.resourceCategories ?? [])}
            />
          </label>

          <label>
            <span>Notes</span>
            <textarea name="notes" rows={3} defaultValue={template?.notes ?? ""} />
          </label>

          <label className="teaching-checkbox-row">
            <input
              name="taSupported"
              type="checkbox"
              defaultChecked={template?.taSupported ?? false}
            />
            <span>Often TA-supported</span>
          </label>

          {error ? <p className="teaching-form-error">{error}</p> : null}

          <div className="teaching-modal__actions">
            <button className="teaching-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="teaching-primary-button" type="submit">
              Save template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
