import { useState, type FormEvent } from "react";
import type {
  NewTeachingGradingItemInput,
  TeachingGradingItem,
  TeachingGradingStatus,
} from "../types";

type GradingItemModalProps = {
  courseId: string;
  item?: TeachingGradingItem;
  onClose: () => void;
  onSave: (input: NewTeachingGradingItemInput) => void;
};

const statuses: TeachingGradingStatus[] = [
  "pending",
  "in-progress",
  "completed",
  "returned",
];

const assignmentTypes = [
  "homework",
  "quiz",
  "exam",
  "paper",
  "discussion",
  "project",
  "other",
];

export function GradingItemModal({
  courseId,
  item,
  onClose,
  onSave,
}: GradingItemModalProps) {
  const [status, setStatus] = useState<TeachingGradingStatus>(
    item?.status ?? "pending"
  );
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const assignment = String(formData.get("assignment") ?? "").trim();

    if (!assignment) {
      setError("Add an assignment name so this grading item has an anchor.");
      return;
    }

    const assignmentType = String(formData.get("assignmentType") ?? "");
    const returnedDate = String(formData.get("returnedDate") ?? "");

    onSave({
      courseId,
      assignment,
      assignmentType: assignmentType
        ? (assignmentType as NewTeachingGradingItemInput["assignmentType"])
        : undefined,
      dueDate: String(formData.get("dueDate") ?? ""),
      scoresText: String(formData.get("scoresText") ?? "").trim(),
      missing: String(formData.get("missing") ?? "").trim(),
      status,
      returnedDate: status === "returned" && returnedDate ? returnedDate : undefined,
      notes: String(formData.get("notes") ?? "").trim(),
      nextAction: String(formData.get("nextAction") ?? "").trim(),
      spoonCost: Number(formData.get("spoonCost") || 3) as NewTeachingGradingItemInput["spoonCost"],
      estimatedMinutes: Number(formData.get("estimatedMinutes") || 0) || undefined,
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">
              {item ? "Edit grading item" : "Add grading item"}
            </p>
            <h2>{item ? "Update grading tracker" : "Track grading work"}</h2>
            <p>Only the assignment name is required. Details can arrive later.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>Assignment</span>
              <input name="assignment" defaultValue={item?.assignment ?? ""} />
            </label>
            <label>
              <span>Assignment type</span>
              <select name="assignmentType" defaultValue={item?.assignmentType ?? ""}>
                <option value="">No type</option>
                {assignmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Due date</span>
              <input name="dueDate" type="date" defaultValue={item?.dueDate ?? ""} />
            </label>
            <label>
              <span>Status</span>
              <select
                name="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TeachingGradingStatus)
                }
              >
                {statuses.map((statusValue) => (
                  <option key={statusValue} value={statusValue}>
                    {statusValue}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Spoon cost</span>
              <select name="spoonCost" defaultValue={item?.spoonCost ?? 3}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Estimated minutes</span>
              <input
                name="estimatedMinutes"
                type="number"
                min="0"
                defaultValue={item?.estimatedMinutes ?? ""}
              />
            </label>
          </div>

          {status === "returned" ? (
            <label>
              <span>Returned date</span>
              <input
                name="returnedDate"
                type="date"
                defaultValue={item?.returnedDate ?? ""}
              />
            </label>
          ) : null}

          <label>
            <span>Scores text</span>
            <textarea
              name="scoresText"
              rows={2}
              defaultValue={item?.scoresText ?? ""}
              placeholder="88, 91, 76, 100"
            />
          </label>

          <label>
            <span>Missing work notes</span>
            <textarea name="missing" rows={2} defaultValue={item?.missing ?? ""} />
          </label>

          <label>
            <span>Notes</span>
            <textarea name="notes" rows={3} defaultValue={item?.notes ?? ""} />
          </label>

          <label>
            <span>Next action</span>
            <textarea
              name="nextAction"
              rows={2}
              defaultValue={item?.nextAction ?? ""}
            />
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
              Save grading item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
