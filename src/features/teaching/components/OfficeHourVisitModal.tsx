import { useState, type FormEvent } from "react";
import type {
  NewTeachingOfficeHourVisitInput,
  TeachingOfficeHourVisit,
} from "../types";
import type { OfficeHourStatus } from "./OfficeHourVisitRow";

type OfficeHourVisitModalProps = {
  courseId: string;
  visit?: TeachingOfficeHourVisit;
  onClose: () => void;
  onSave: (input: NewTeachingOfficeHourVisitInput) => void;
};

const statuses: OfficeHourStatus[] = ["open", "waiting", "resolved"];

const visitTypes = ["office-hours", "email", "zoom", "after-class", "other"];

function statusForVisit(visit?: TeachingOfficeHourVisit): OfficeHourStatus {
  if (visit?.followUpCompleted) {
    return "resolved";
  }

  return visit?.status ?? "open";
}

export function OfficeHourVisitModal({
  courseId,
  visit,
  onClose,
  onSave,
}: OfficeHourVisitModalProps) {
  const [status, setStatus] = useState<OfficeHourStatus>(() =>
    statusForVisit(visit)
  );
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const student = String(formData.get("student") ?? "").trim();
    const concern = String(formData.get("concern") ?? "").trim();

    if (!student && !concern) {
      setError("Add a student or concern so this visit has an anchor.");
      return;
    }

    const visitType = String(formData.get("visitType") ?? "");
    const followUpCompleted =
      formData.get("followUpCompleted") === "on" || status === "resolved";

    onSave({
      courseId,
      student,
      visitType: visitType
        ? (visitType as NewTeachingOfficeHourVisitInput["visitType"])
        : undefined,
      visitDate: String(formData.get("visitDate") ?? ""),
      concern,
      followUp: String(formData.get("followUp") ?? "").trim(),
      nextAction: String(formData.get("nextAction") ?? "").trim(),
      status: followUpCompleted ? "resolved" : status,
      followUpCompleted,
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">{visit ? "Edit visit" : "Add visit"}</p>
            <h2>{visit ? "Update office-hours note" : "Log student visit"}</h2>
            <p>Student or concern is enough. Save the rough record first.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>Student</span>
              <input name="student" defaultValue={visit?.student ?? ""} />
            </label>
            <label>
              <span>Visit date</span>
              <input
                name="visitDate"
                type="date"
                defaultValue={visit?.visitDate ?? ""}
              />
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Visit type</span>
              <select name="visitType" defaultValue={visit?.visitType ?? ""}>
                <option value="">No type</option>
                {visitTypes.map((visitType) => (
                  <option key={visitType} value={visitType}>
                    {visitType}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                name="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as OfficeHourStatus)
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

          <label>
            <span>Concern / reason</span>
            <textarea name="concern" rows={3} defaultValue={visit?.concern ?? ""} />
          </label>

          <label>
            <span>Follow-up notes</span>
            <textarea
              name="followUp"
              rows={3}
              defaultValue={visit?.followUp ?? ""}
            />
          </label>

          <label>
            <span>Next action</span>
            <textarea
              name="nextAction"
              rows={2}
              defaultValue={visit?.nextAction ?? ""}
            />
          </label>

          <label className="teaching-checkbox-row">
            <input
              name="followUpCompleted"
              type="checkbox"
              defaultChecked={visit?.followUpCompleted ?? false}
            />
            <span>Follow-up completed</span>
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
              Save visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
