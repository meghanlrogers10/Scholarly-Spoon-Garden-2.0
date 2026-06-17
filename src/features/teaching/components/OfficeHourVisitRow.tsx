import type { TeachingOfficeHourVisit } from "../types";

export type OfficeHourStatus = "open" | "waiting" | "resolved";

type OfficeHourVisitRowProps = {
  visit: TeachingOfficeHourVisit;
  onEdit: (visit: TeachingOfficeHourVisit) => void;
  onDelete: (visit: TeachingOfficeHourVisit) => void;
  onToggleFollowUp: (visit: TeachingOfficeHourVisit) => void;
  onStatusChange: (visit: TeachingOfficeHourVisit, status: OfficeHourStatus) => void;
  onAddToToday?: (visit: TeachingOfficeHourVisit) => void;
  isOnToday?: boolean;
};

const statuses: OfficeHourStatus[] = ["open", "waiting", "resolved"];

function visitStatus(visit: TeachingOfficeHourVisit): OfficeHourStatus {
  if (visit.followUpCompleted) {
    return "resolved";
  }

  return visit.status ?? "open";
}

export function OfficeHourVisitRow({
  visit,
  onEdit,
  onDelete,
  onToggleFollowUp,
  onStatusChange,
  onAddToToday,
  isOnToday,
}: OfficeHourVisitRowProps) {
  return (
    <tr>
      <td>
        <strong>{visit.student || "Unnamed student"}</strong>
        {visit.visitType ? <small>{visit.visitType}</small> : null}
      </td>
      <td>{visit.visitDate || "No date"}</td>
      <td>{visit.concern || "No concern captured"}</td>
      <td>{visit.followUp || "None"}</td>
      <td>{visit.nextAction || "None"}</td>
      <td>
        <select
          className="teaching-table-select"
          value={visitStatus(visit)}
          onChange={(event) =>
            onStatusChange(visit, event.target.value as OfficeHourStatus)
          }
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </td>
      <td>
        <div className="teaching-table-actions">
          {onAddToToday ? (
            <button
              className="teaching-chip-button"
              type="button"
              onClick={() => onAddToToday(visit)}
              disabled={isOnToday}
            >
              {isOnToday ? "Added to Today" : "Add to Today"}
            </button>
          ) : null}
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onToggleFollowUp(visit)}
          >
            {visit.followUpCompleted ? "Reopen" : "Resolve"}
          </button>
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onEdit(visit)}
          >
            Edit
          </button>
          <button
            className="teaching-chip-button teaching-chip-button--danger"
            type="button"
            onClick={() => onDelete(visit)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
