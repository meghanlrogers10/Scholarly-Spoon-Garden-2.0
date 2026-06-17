import { GradingItemRow } from "./GradingItemRow";
import type { TeachingGradingItem, TeachingGradingStatus } from "../types";

type GradingItemTableProps = {
  items: TeachingGradingItem[];
  onAddItem: () => void;
  onEditItem: (item: TeachingGradingItem) => void;
  onDeleteItem: (item: TeachingGradingItem) => void;
  onStatusChange: (item: TeachingGradingItem, status: TeachingGradingStatus) => void;
  onAddToToday?: (item: TeachingGradingItem) => void;
  isOnToday?: (item: TeachingGradingItem) => boolean;
};

export function GradingItemTable({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onStatusChange,
  onAddToToday,
  isOnToday,
}: GradingItemTableProps) {
  if (items.length === 0) {
    return (
      <div className="teaching-empty-state">
        <p>
          No grading items yet. Add the next assignment, quiz, or discussion set
          you need to track.
        </p>
        <button className="teaching-primary-button" type="button" onClick={onAddItem}>
          Add Grading Item
        </button>
      </div>
    );
  }

  return (
    <div className="teaching-table-shell">
      <table className="teaching-meeting-table teaching-grading-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Due</th>
            <th>Status</th>
            <th>Scores</th>
            <th>Missing</th>
            <th>Notes</th>
            <th>Next action</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <GradingItemRow
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onStatusChange={onStatusChange}
              onAddToToday={onAddToToday}
              isOnToday={isOnToday?.(item) ?? false}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
