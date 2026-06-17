import type { TeachingTaItem } from "../types";

type LowSpoonTaCardProps = {
  items: TeachingTaItem[];
};

function smallestMove(item: TeachingTaItem) {
  if (item.nextAction.trim()) {
    return item.nextAction;
  }

  if ((item.status ?? "open") === "waiting") {
    return "Send one check-in or mark what you are waiting on.";
  }

  return "Send one check-in, clarify one grading task, or mark one item waiting.";
}

export function LowSpoonTaCard({ items }: LowSpoonTaCardProps) {
  return (
    <aside className="teaching-notebook-panel">
      <div className="teaching-panel-heading">
        <p className="eyebrow">Low-spoon TA move</p>
        <h3>Only the next small step</h3>
      </div>

      {items.length > 0 ? (
        <div className="teaching-change-list">
          {items.map((item) => (
            <article key={item.id}>
              <span>{item.dueDate ? `Due ${item.dueDate}` : item.status ?? "open"}</span>
              <strong>{item.task}</strong>
              <p>Smallest useful move: {smallestMove(item)}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="teaching-muted-copy">No TA follow-ups need attention.</p>
      )}
    </aside>
  );
}
