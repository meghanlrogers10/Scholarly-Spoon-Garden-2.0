import { TaItemRow, type TaStatus } from "./TaItemRow";
import type { TeachingReminderHistoryType, TeachingTaItem } from "../types";

type TaItemTableProps = {
  items: TeachingTaItem[];
  onAddItem: () => void;
  onEditItem: (item: TeachingTaItem) => void;
  onDeleteItem: (item: TeachingTaItem) => void;
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
  isOnToday?: (item: TeachingTaItem) => boolean;
};

export function TaItemTable({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleCompleted,
  onStatusChange,
  onWeeklyCommentChange,
  onDraftEmail,
  onMarkGradingComplete,
  onMarkGradeNormingComplete,
  onAddToToday,
  isOnToday,
}: TaItemTableProps) {
  if (items.length === 0) {
    return (
      <div className="teaching-empty-state">
        <p>
          No TA follow-ups yet. Add the next grading, discussion, or
          student-support item you need to coordinate.
        </p>
        <button className="teaching-primary-button" type="button" onClick={onAddItem}>
          Add TA Item
        </button>
      </div>
    );
  }

  return (
    <div className="teaching-table-shell">
      <table className="teaching-meeting-table teaching-grading-table">
        <thead>
          <tr>
            <th>TA</th>
            <th>Task</th>
            <th>Due</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Weekly comment</th>
            <th>Next action</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <TaItemRow
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onToggleCompleted={onToggleCompleted}
              onStatusChange={onStatusChange}
              onWeeklyCommentChange={onWeeklyCommentChange}
              onDraftEmail={onDraftEmail}
              onMarkGradingComplete={onMarkGradingComplete}
              onMarkGradeNormingComplete={onMarkGradeNormingComplete}
              onAddToToday={onAddToToday}
              isOnToday={isOnToday?.(item) ?? false}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
