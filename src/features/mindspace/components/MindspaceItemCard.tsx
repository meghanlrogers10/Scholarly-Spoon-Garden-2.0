import type { MindspaceItem } from "../types";

const kindLabels: Record<MindspaceItem["kind"], string> = {
  thought: "Thought",
  worry: "Worry",
  idea: "Idea",
  reminder: "Reminder",
  question: "Question",
  "goal-seed": "Goal seed",
  avoidance: "Avoidance",
  other: "Other",
};

const statusLabels: Record<MindspaceItem["status"], string> = {
  inbox: "Needs sorting",
  "clarify-later": "Clarify later",
  converted: "Converted",
  released: "Released",
  archived: "Archived",
};

type MindspaceItemCardProps = {
  item: MindspaceItem;
};

export function MindspaceItemCard({ item }: MindspaceItemCardProps) {
  return (
    <article className={`mindspace-item-card mindspace-area-${item.area}`}>
      <div className="mindspace-item-header">
        <div>
          <p className="mindspace-kicker">{kindLabels[item.kind]}</p>
          <h3>{item.title}</h3>
        </div>
        <span className="mindspace-status-pill">{statusLabels[item.status]}</span>
      </div>

      {item.body ? <p className="muted-text">{item.body}</p> : null}

      {item.nextAction ? (
        <div className="mindspace-next-action">
          <span>Next visible action</span>
          <p>{item.nextAction}</p>
        </div>
      ) : null}

      {item.tinyStep ? (
        <p className="mindspace-parked-note">Tiny step: {item.tinyStep}</p>
      ) : null}

      <div className="mindspace-chip-row">
        <span className="mindspace-load-chip">
          Load {item.emotionalWeight ?? "?"}/5
        </span>
        {item.lowEnergyFriendly ? (
          <span className="mindspace-chip">low energy friendly</span>
        ) : null}
      </div>
    </article>
  );
}
