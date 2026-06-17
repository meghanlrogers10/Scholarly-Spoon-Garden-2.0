import { Card } from "../../../shared/ui/Card";
import type { Task } from "../../../shared/types/task";

type CompletedTasksCardProps = {
  tasks: Task[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
};

export function CompletedTasksCard({
  tasks,
  onRestore,
  onDelete,
}: CompletedTasksCardProps) {
  return (
    <Card>
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Done</p>
          <h2>Completed Tasks</h2>
        </div>
        <span className="pill">{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="muted-text">
          Nothing completed yet. Future you is watching.
        </p>
      ) : (
        <div className="completed-task-list">
          {tasks.map((task) => (
            <div key={task.id} className="completed-task-item">
              <div>
                <p>{task.title}</p>
                <span>
                  {task.area} · {task.priority} priority · {task.spoonCost} 🥄
                </span>
              </div>

              <div className="completed-task-actions">
                <button className="text-button" onClick={() => onRestore(task.id)}>
                  Restore
                </button>

                <button className="text-button" onClick={() => onDelete(task.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}