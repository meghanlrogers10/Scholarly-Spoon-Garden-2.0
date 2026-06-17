import { useState, type FormEvent } from "react";
import type {
  NewTeachingTaItemInput,
  TeachingAssistant,
  TeachingTaItem,
} from "../types";
import type { TaStatus } from "./TaItemRow";

type TaItemModalProps = {
  courseId: string;
  assistants: TeachingAssistant[];
  item?: TeachingTaItem;
  onClose: () => void;
  onSave: (input: NewTeachingTaItemInput) => void;
};

const statuses: TaStatus[] = ["open", "waiting", "completed"];

const categories = [
  "grading",
  "discussion",
  "student-support",
  "prep",
  "admin",
  "other",
];

function statusForItem(item?: TeachingTaItem): TaStatus {
  if (item?.completed) {
    return "completed";
  }

  return item?.status ?? "open";
}

export function TaItemModal({
  courseId,
  assistants,
  item,
  onClose,
  onSave,
}: TaItemModalProps) {
  const [status, setStatus] = useState<TaStatus>(() => statusForItem(item));
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const task = String(formData.get("task") ?? "").trim();
    const assignmentName = String(formData.get("assignmentName") ?? "").trim();

    if (!task && !assignmentName) {
      setError("Add a task or assignment name so this TA follow-up has an anchor.");
      return;
    }

    const category = String(formData.get("category") ?? "");
    const completed = formData.get("completed") === "on" || status === "completed";
    const taId = String(formData.get("taId") ?? "") || undefined;
    const selectedAssistant = assistants.find((assistant) => assistant.id === taId);

    onSave({
      courseId,
      taId,
      taName: selectedAssistant?.name || String(formData.get("taName") ?? "").trim(),
      task: task || assignmentName,
      assignmentName,
      assignmentDueDate: String(formData.get("assignmentDueDate") ?? ""),
      reminderDueDate: String(formData.get("reminderDueDate") ?? ""),
      followUpDueDate: String(formData.get("followUpDueDate") ?? ""),
      category: category
        ? (category as NewTeachingTaItemInput["category"])
        : undefined,
      dueDate: String(formData.get("dueDate") ?? ""),
      status: completed ? "completed" : status,
      notes: String(formData.get("notes") ?? "").trim(),
      weeklyComment: String(formData.get("weeklyComment") ?? "").trim(),
      nextAction: String(formData.get("nextAction") ?? "").trim(),
      rubricIncluded: formData.get("rubricIncluded") === "on",
      rubricLink: String(formData.get("rubricLink") ?? "").trim(),
      rubricReminderEnabled: formData.get("rubricReminderEnabled") === "on",
      taInstructions: String(formData.get("taInstructions") ?? "").trim(),
      taInstructionsIncluded: formData.get("taInstructionsIncluded") === "on",
      gradeNormingEnabled: formData.get("gradeNormingEnabled") === "on",
      gradeNormingReminderDate: String(formData.get("gradeNormingReminderDate") ?? ""),
      gradeNormingCompleted: formData.get("gradeNormingCompleted") === "on",
      gradeNormingNotes: String(formData.get("gradeNormingNotes") ?? "").trim(),
      rubricShared: formData.get("rubricShared") === "on",
      samplePapersReviewed: formData.get("samplePapersReviewed") === "on",
      deadlineClarified: formData.get("deadlineClarified") === "on",
      followUpSent: formData.get("followUpSent") === "on",
      studentConcernEscalated: formData.get("studentConcernEscalated") === "on",
      initialReminderSentAt: item?.initialReminderSentAt,
      followUpReminderSentAt: item?.followUpReminderSentAt,
      reminderCount: item?.reminderCount ?? 0,
      reminderHistory: item?.reminderHistory ?? [],
      gradingReportedComplete: formData.get("gradingReportedComplete") === "on",
      gradingCompletedAt: item?.gradingCompletedAt,
      emailTemplateType: item?.emailTemplateType,
      lastEmailSubject: item?.lastEmailSubject,
      lastEmailBody: item?.lastEmailBody,
      completed,
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">{item ? "Edit TA item" : "Add TA item"}</p>
            <h2>{item ? "Update TA follow-up" : "Track TA follow-up"}</h2>
            <p>Only the task is required. TA name and details can come later.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>TA profile</span>
              <select name="taId" defaultValue={item?.taId ?? ""}>
                <option value="">No linked TA profile</option>
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>TA name</span>
              <input name="taName" defaultValue={item?.taName ?? ""} />
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Task</span>
              <input name="task" defaultValue={item?.task ?? ""} />
            </label>
            <label>
              <span>Assignment name</span>
              <input name="assignmentName" defaultValue={item?.assignmentName ?? ""} />
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Category</span>
              <select name="category" defaultValue={item?.category ?? ""}>
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Due date</span>
              <input name="dueDate" type="date" defaultValue={item?.dueDate ?? ""} />
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Assignment due date</span>
              <input
                name="assignmentDueDate"
                type="date"
                defaultValue={item?.assignmentDueDate ?? ""}
              />
            </label>
            <label>
              <span>Reminder due date</span>
              <input
                name="reminderDueDate"
                type="date"
                defaultValue={item?.reminderDueDate ?? ""}
              />
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Follow-up due date</span>
              <input
                name="followUpDueDate"
                type="date"
                defaultValue={item?.followUpDueDate ?? ""}
              />
            </label>
            <label>
              <span>Status</span>
              <select
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as TaStatus)}
              >
                {statuses.map((statusValue) => (
                  <option key={statusValue} value={statusValue}>
                    {statusValue}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="teaching-tool-placeholder-panel">
            <p className="eyebrow">Rubric and TA instructions</p>
            <label className="teaching-checkbox-row">
              <input
                name="rubricIncluded"
                type="checkbox"
                defaultChecked={item?.rubricIncluded ?? false}
              />
              <span>Rubric included</span>
            </label>
            <label>
              <span>Rubric link</span>
              <input name="rubricLink" defaultValue={item?.rubricLink ?? ""} />
            </label>
            <label className="teaching-checkbox-row">
              <input
                name="rubricReminderEnabled"
                type="checkbox"
                defaultChecked={item?.rubricReminderEnabled ?? Boolean(item?.rubricIncluded)}
              />
              <span>Remind TA to use rubric</span>
            </label>
            <label>
              <span>TA-specific grading instructions</span>
              <textarea
                name="taInstructions"
                rows={3}
                defaultValue={item?.taInstructions ?? ""}
              />
            </label>
            <label className="teaching-checkbox-row">
              <input
                name="taInstructionsIncluded"
                type="checkbox"
                defaultChecked={item?.taInstructionsIncluded ?? Boolean(item?.taInstructions)}
              />
              <span>Include TA instructions in reminder</span>
            </label>
          </div>

          <div className="teaching-tool-placeholder-panel">
            <p className="eyebrow">Grade norming</p>
            <p>
              Grade norming helps you and your TA check whether you are applying
              the rubric consistently before too many submissions are graded.
            </p>
            <label className="teaching-checkbox-row">
              <input
                name="gradeNormingEnabled"
                type="checkbox"
                defaultChecked={item?.gradeNormingEnabled ?? false}
              />
              <span>Enable grade norming reminder</span>
            </label>
            <label>
              <span>Grade norming reminder date</span>
              <input
                name="gradeNormingReminderDate"
                type="date"
                defaultValue={item?.gradeNormingReminderDate ?? ""}
              />
            </label>
            <label className="teaching-checkbox-row">
              <input
                name="gradeNormingCompleted"
                type="checkbox"
                defaultChecked={item?.gradeNormingCompleted ?? false}
              />
              <span>Grade norming complete</span>
            </label>
            <label>
              <span>Grade norming notes</span>
              <textarea
                name="gradeNormingNotes"
                rows={2}
                defaultValue={item?.gradeNormingNotes ?? ""}
              />
            </label>
          </div>

          <div className="teaching-tool-placeholder-panel">
            <p className="eyebrow">Delegation checklist</p>
            <label className="teaching-checkbox-row">
              <input
                name="rubricShared"
                type="checkbox"
                defaultChecked={item?.rubricShared ?? item?.rubricIncluded ?? false}
              />
              <span>Rubric shared</span>
            </label>
            <label className="teaching-checkbox-row">
              <input
                name="samplePapersReviewed"
                type="checkbox"
                defaultChecked={item?.samplePapersReviewed ?? false}
              />
              <span>Sample papers reviewed</span>
            </label>
            <label className="teaching-checkbox-row">
              <input
                name="deadlineClarified"
                type="checkbox"
                defaultChecked={item?.deadlineClarified ?? false}
              />
              <span>Deadline clarified</span>
            </label>
            <label className="teaching-checkbox-row">
              <input
                name="followUpSent"
                type="checkbox"
                defaultChecked={item?.followUpSent ?? false}
              />
              <span>Follow-up sent</span>
            </label>
            <label className="teaching-checkbox-row">
              <input
                name="studentConcernEscalated"
                type="checkbox"
                defaultChecked={item?.studentConcernEscalated ?? false}
              />
              <span>Student concern escalated if needed</span>
            </label>
          </div>

          <label>
            <span>Notes</span>
            <textarea name="notes" rows={3} defaultValue={item?.notes ?? ""} />
          </label>

          <label>
            <span>Weekly comment</span>
            <textarea
              name="weeklyComment"
              rows={3}
              defaultValue={item?.weeklyComment ?? ""}
            />
          </label>

          <label>
            <span>Next action</span>
            <textarea
              name="nextAction"
              rows={2}
              defaultValue={item?.nextAction ?? ""}
            />
          </label>

          <label className="teaching-checkbox-row">
            <input
              name="completed"
              type="checkbox"
              defaultChecked={item?.completed ?? false}
            />
            <span>Completed TA follow-up</span>
          </label>

          <label className="teaching-checkbox-row">
            <input
              name="gradingReportedComplete"
              type="checkbox"
              defaultChecked={item?.gradingReportedComplete ?? false}
            />
            <span>Grading reported complete</span>
          </label>

          {item ? (
            <div className="teaching-tool-placeholder-panel">
              <p className="eyebrow">Reminder history</p>
              <p>
                {item.reminderCount ?? 0} reminders marked sent.{" "}
                {item.reminderHistory?.length
                  ? item.reminderHistory
                      .slice(-3)
                      .map((entry) => `${entry.type} on ${entry.sentAt.slice(0, 10)}`)
                      .join("; ")
                  : "No reminder history yet."}
              </p>
            </div>
          ) : null}

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
              Save TA item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
