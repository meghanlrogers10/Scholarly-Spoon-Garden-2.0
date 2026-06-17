import type { TeachingReminderHistoryType, TeachingTaItem } from "../types";

export type TaStatus = "open" | "waiting" | "completed";

type TaItemRowProps = {
  item: TeachingTaItem;
  onEdit: (item: TeachingTaItem) => void;
  onDelete: (item: TeachingTaItem) => void;
  onToggleCompleted: (item: TeachingTaItem) => void;
  onStatusChange: (item: TeachingTaItem, status: TaStatus) => void;
  onWeeklyCommentChange: (item: TeachingTaItem, weeklyComment: string) => void;
  onDraftEmail: (
    item: TeachingTaItem,
    historyType: TeachingReminderHistoryType
  ) => void;
  onMarkGradingComplete: (item: TeachingTaItem, complete: boolean) => void;
  onMarkGradeNormingComplete: (item: TeachingTaItem, complete: boolean) => void;
  onAddToToday?: (item: TeachingTaItem) => void;
  isOnToday?: boolean;
};

const statuses: TaStatus[] = ["open", "waiting", "completed"];

function itemStatus(item: TeachingTaItem): TaStatus {
  if (item.completed) {
    return "completed";
  }

  return item.status ?? "open";
}

function delegationProgress(item: TeachingTaItem) {
  const checks = [
    item.rubricShared,
    item.gradeNormingCompleted,
    item.samplePapersReviewed,
    item.deadlineClarified,
    item.followUpSent,
    item.studentConcernEscalated,
  ];
  const complete = checks.filter(Boolean).length;

  return `${complete}/${checks.length} delegation checks`;
}

export function TaItemRow({
  item,
  onEdit,
  onDelete,
  onToggleCompleted,
  onStatusChange,
  onWeeklyCommentChange,
  onDraftEmail,
  onMarkGradingComplete,
  onMarkGradeNormingComplete,
  onAddToToday,
  isOnToday,
}: TaItemRowProps) {
  return (
    <tr>
      <td>
        <strong>{item.taName || "Unassigned TA"}</strong>
        {item.category ? <small>{item.category}</small> : null}
        {item.reminderCount ? <small>{item.reminderCount} reminders sent</small> : null}
      </td>
      <td>
        <strong>{item.assignmentName || item.task}</strong>
        <small>{item.task}</small>
        <small>{delegationProgress(item)}</small>
      </td>
      <td>
        {item.dueDate || "No date"}
        {item.reminderDueDate ? <small>Reminder {item.reminderDueDate}</small> : null}
        {item.followUpDueDate ? <small>Follow-up {item.followUpDueDate}</small> : null}
      </td>
      <td>
        <select
          className="teaching-table-select"
          value={itemStatus(item)}
          onChange={(event) => onStatusChange(item, event.target.value as TaStatus)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </td>
      <td>{item.notes || "None"}</td>
      <td>
        <textarea
          className="teaching-inline-textarea"
          value={item.weeklyComment}
          onChange={(event) => onWeeklyCommentChange(item, event.target.value)}
          aria-label={`Weekly comment for ${item.task}`}
        />
      </td>
      <td>{item.nextAction || "None"}</td>
      <td>
        <div className="teaching-table-actions">
          {onAddToToday ? (
            <button
              className="teaching-chip-button"
              type="button"
              onClick={() => onAddToToday(item)}
              disabled={isOnToday}
            >
              {isOnToday ? "Added to Today" : "Add to Today"}
            </button>
          ) : null}
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onToggleCompleted(item)}
          >
            {item.completed ? "Reopen" : "Complete"}
          </button>
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onDraftEmail(item, "initial-grading-reminder")}
          >
            Draft initial
          </button>
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onDraftEmail(item, "grading-follow-up")}
          >
            Draft follow-up
          </button>
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onMarkGradingComplete(item, !item.gradingReportedComplete)}
          >
            {item.gradingReportedComplete ? "Undo grading done" : "Mark grading done"}
          </button>
          {item.gradeNormingEnabled ? (
            <button
              className="teaching-chip-button"
              type="button"
              onClick={() =>
                onMarkGradeNormingComplete(item, !item.gradeNormingCompleted)
              }
            >
              {item.gradeNormingCompleted ? "Undo norming" : "Mark norming done"}
            </button>
          ) : null}
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onEdit(item)}
          >
            Edit
          </button>
          <button
            className="teaching-chip-button teaching-chip-button--danger"
            type="button"
            onClick={() => onDelete(item)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
