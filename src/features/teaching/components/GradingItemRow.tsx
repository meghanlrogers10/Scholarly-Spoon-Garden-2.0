import type { TeachingGradingItem, TeachingGradingStatus } from "../types";

type GradingItemRowProps = {
  item: TeachingGradingItem;
  onEdit: (item: TeachingGradingItem) => void;
  onDelete: (item: TeachingGradingItem) => void;
  onStatusChange: (item: TeachingGradingItem, status: TeachingGradingStatus) => void;
  onAddToToday?: (item: TeachingGradingItem) => void;
  isOnToday?: boolean;
};

const statuses: TeachingGradingStatus[] = [
  "pending",
  "in-progress",
  "completed",
  "returned",
];

export function GradingItemRow({
  item,
  onEdit,
  onDelete,
  onStatusChange,
  onAddToToday,
  isOnToday,
}: GradingItemRowProps) {
  return (
    <tr>
      <td>
        <strong>{item.assignment}</strong>
        {item.assignmentType ? <small>{item.assignmentType}</small> : null}
      </td>
      <td>{item.dueDate || "No date"}</td>
      <td>
        <select
          className="teaching-table-select"
          value={item.status}
          onChange={(event) =>
            onStatusChange(item, event.target.value as TeachingGradingStatus)
          }
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </td>
      <td>{item.scoresText || "None"}</td>
      <td>{item.missing || "None"}</td>
      <td>
        {item.notes || "None"}
        <small>
          {(item.estimatedMinutes ?? 45)} min · {item.spoonCost ?? 3} spoons
        </small>
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
