import { useState, type FormEvent } from "react";
import { resourceTypeOptions } from "./resourceUtils";
import type {
  NewTeachingResourceInput,
  TeachingResource,
  TeachingResourceType,
} from "../types";

type TeachingResourceModalProps = {
  courseId: string;
  resource?: TeachingResource;
  onClose: () => void;
  onSave: (input: NewTeachingResourceInput) => void;
};

export function TeachingResourceModal({
  courseId,
  resource,
  onClose,
  onSave,
}: TeachingResourceModalProps) {
  const [resourceType, setResourceType] = useState<TeachingResourceType>(
    resource?.resourceType ?? "other"
  );
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();
    const fileName = String(formData.get("fileName") ?? "").trim();

    if (!title && !url && !fileName) {
      setError("Add a title, URL, or filename so this resource has an anchor.");
      return;
    }

    onSave({
      courseId,
      title,
      resourceType,
      description: String(formData.get("description") ?? "").trim(),
      url,
      fileName,
      faqCategory: String(formData.get("faqCategory") ?? "").trim(),
      shortAnswer: String(formData.get("shortAnswer") ?? "").trim(),
      reusable: formData.get("reusable") === "on",
      nextAction: String(formData.get("nextAction") ?? "").trim(),
      dueDate: String(formData.get("dueDate") ?? ""),
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">
              {resource ? "Edit resource" : "Add resource"}
            </p>
            <h2>{resource ? "Update course resource" : "Track course resource"}</h2>
            <p>Links and filenames only for now. No file upload in this version.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>Title</span>
              <input name="title" defaultValue={resource?.title ?? ""} />
            </label>
            <label>
              <span>Resource type</span>
              <select
                name="resourceType"
                value={resourceType}
                onChange={(event) =>
                  setResourceType(event.target.value as TeachingResourceType)
                }
              >
                {resourceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={resource?.description ?? ""}
            />
          </label>

          <div className="teaching-modal__row">
            <label>
              <span>FAQ / packet category</span>
              <input
                name="faqCategory"
                defaultValue={resource?.faqCategory ?? ""}
                placeholder="extensions, exams, citation help"
              />
            </label>
            <label>
              <span>Next action date</span>
              <input name="dueDate" type="date" defaultValue={resource?.dueDate ?? ""} />
            </label>
          </div>

          <label>
            <span>Student-facing short answer / note</span>
            <textarea
              name="shortAnswer"
              rows={3}
              defaultValue={resource?.shortAnswer ?? ""}
            />
          </label>

          <label>
            <span>Actionable next move</span>
            <input
              name="nextAction"
              defaultValue={resource?.nextAction ?? ""}
              placeholder="Add to Week 5 announcement"
            />
          </label>

          <label>
            <span>URL</span>
            <input
              name="url"
              type="url"
              defaultValue={resource?.url ?? ""}
              placeholder="https://..."
            />
          </label>

          <label>
            <span>Filename / location note</span>
            <input
              name="fileName"
              defaultValue={resource?.fileName ?? ""}
              placeholder="Week 3 slides.pptx"
            />
          </label>

          <label className="teaching-checkbox-row">
            <input
              name="reusable"
              type="checkbox"
              defaultChecked={resource?.reusable ?? false}
            />
            <span>Reusable student-facing FAQ/resource</span>
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
              Save resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
