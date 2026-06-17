import type { TeachingGradingItem } from "../types";

type LowSpoonGradingCardProps = {
  items: TeachingGradingItem[];
};

function defaultAction(item: TeachingGradingItem) {
  if (item.nextAction.trim()) {
    return item.nextAction;
  }

  if (item.missing.trim()) {
    return "Update the missing-work list.";
  }

  return "Grade 3 submissions, update missing list, or open the rubric.";
}

export function LowSpoonGradingCard({ items }: LowSpoonGradingCardProps) {
  return (
    <aside className="teaching-notebook-panel">
      <div className="teaching-panel-heading">
        <p className="eyebrow">Low-spoon grading move</p>
        <h3>Only the next small step</h3>
      </div>

      {items.length > 0 ? (
        <div className="teaching-change-list">
          {items.map((item) => (
            <article key={item.id}>
              <span>{item.dueDate ? `Due ${item.dueDate}` : item.status}</span>
              <strong>{item.assignment}</strong>
              <p>Smallest useful move: {defaultAction(item)}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="teaching-muted-copy">No grading items need attention.</p>
      )}
    </aside>
  );
}
