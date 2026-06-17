import type { Task } from "../../../shared/types/task";
import { Card } from "../../../shared/ui/Card";

type LowEnergyTasksCardProps = {
  tasks: Task[];
  onAddToToday: (id: string) => void;
};

function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDateFromInput(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDayDifference(dateString?: string) {
  if (!dateString) return 999;

  const today = getTodayDate();
  const target = getDateFromInput(dateString);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((target.getTime() - today.getTime()) / millisecondsPerDay);
}

function formatDueDate(dateString?: string) {
  if (!dateString) {
    return "No due date";
  }

  const difference = getDayDifference(dateString);

  if (difference === 0) return "Today";
  if (difference === 1) return "Tomorrow";
  if (difference < 0) return `${Math.abs(difference)} day overdue`;

  return getDateFromInput(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function isTodayTask(task: Task) {
  return task.today !== false && task.status === "todo";
}

function getLowEnergySuggestions(tasks: Task[]) {
  const lowEnergyTasks = tasks
    .filter((task) => task.status === "todo")
    .filter((task) => task.spoonCost === 1 || task.lowEnergyFriendly);

  const todayLowEnergy = lowEnergyTasks
    .filter(isTodayTask)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );

  if (todayLowEnergy.length > 0) {
    return {
      label: "From today",
      tasks: todayLowEnergy.slice(0, 2),
    };
  }

  const nearFutureLowEnergy = lowEnergyTasks
    .filter((task) => !isTodayTask(task))
    .filter((task) => getDayDifference(task.dueDate) >= 0)
    .filter((task) => getDayDifference(task.dueDate) <= 14)
    .sort((a, b) => getDayDifference(a.dueDate) - getDayDifference(b.dueDate));

  if (nearFutureLowEnergy.length > 0) {
    return {
      label: "Near future",
      tasks: nearFutureLowEnergy.slice(0, 2),
    };
  }

  return {
    label: "Anytime",
    tasks: lowEnergyTasks.slice(0, 2),
  };
}

export function LowEnergyTasksCard({
  tasks,
  onAddToToday,
}: LowEnergyTasksCardProps) {
  const suggestions = getLowEnergySuggestions(tasks);

  return (
    <Card className="hint-card" id="lowEnergyCard">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Tiny wins</p>
          <h2>Low Energy</h2>
        </div>

        <span className="pill">{suggestions.label}</span>
      </div>

      {suggestions.tasks.length === 0 ? (
        <p className="muted-text">
          No 1-spoon tasks yet. Add one tiny task for future tired-you.
        </p>
      ) : (
        <div className="low-energy-list low-energy-list-compact">
          {suggestions.tasks.map((task) => (
            <div key={task.id} className="low-energy-row">
              <div>
                <strong>{task.title}</strong>
                <p>
                  {task.area} · {formatDueDate(task.dueDate)}
                  {task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : ""}
                </p>
                {task.nextAction ? <p>Next: {task.nextAction}</p> : null}
              </div>

              {isTodayTask(task) ? (
                <span className="pill">Today</span>
              ) : (
                <button
                  className="text-button"
                  onClick={() => onAddToToday(task.id)}
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="muted-text low-energy-note">
        Only one or two tiny tasks. This is a rescue lane, not another to-do
        list.
      </p>
    </Card>
  );
}
