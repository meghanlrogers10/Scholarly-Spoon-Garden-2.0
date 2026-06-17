import type { MindspaceGoal } from "../types";

const horizonLabels: Record<MindspaceGoal["horizon"], string> = {
  "long-term": "Long-term",
  semester: "Semester",
  month: "Month",
  week: "Week",
};

const statusLabels: Record<MindspaceGoal["status"], string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

type GoalLadderCardProps = {
  goal: MindspaceGoal;
};

export function GoalLadderCard({ goal }: GoalLadderCardProps) {
  return (
    <article className="goal-ladder-card mindspace-area-mindspace">
      <div className="mindspace-item-header">
        <div>
          <p className="mindspace-kicker">{horizonLabels[goal.horizon]} goal</p>
          <h3>{goal.title}</h3>
        </div>
        <span className="mindspace-status-pill">{statusLabels[goal.status]}</span>
      </div>

      <div className="goal-ladder-grid">
        <div>
          <span>Why it matters</span>
          <p>{goal.description ?? "Still forming."}</p>
        </div>
        <div>
          <span>Tiny step</span>
          <p>{goal.tinyStep ?? "Not set yet"}</p>
        </div>
      </div>

      <div className="goal-progress-strip">
        <div>
          <strong>{goal.linkedTaskIds?.length ?? 0}</strong>
          <span> linked tasks</span>
        </div>
        <p>{goal.nextAction ?? "No next action yet."}</p>
      </div>
    </article>
  );
}
