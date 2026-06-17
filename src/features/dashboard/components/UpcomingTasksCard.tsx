import type { Task } from "../../../shared/types/task";
import { Card } from "../../../shared/ui/Card";

type UpcomingTasksCardProps = {
  tasks: Task[];
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

function getDayDifference(dateString: string) {
  const today = getTodayDate();
  const target = getDateFromInput(dateString);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((target.getTime() - today.getTime()) / millisecondsPerDay);
}

function formatDueDate(dateString: string) {
  const difference = getDayDifference(dateString);

  if (difference === 1) return "Tomorrow";
  if (difference < 0) return `${Math.abs(difference)} day overdue`;

  return getDateFromInput(dateString).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isTodayTask(task: Task) {
  return task.today !== false && task.status === "todo";
}

function sortByDueDate(tasks: Task[]) {
  return [...tasks].sort(
    (a, b) =>
      getDateFromInput(a.dueDate!).getTime() -
      getDateFromInput(b.dueDate!).getTime(),
  );
}

export function UpcomingTasksCard({ tasks }: UpcomingTasksCardProps) {
  const datedTasks = tasks
    .filter((task) => task.status === "todo")
    .filter((task) => task.dueDate)
    .filter((task) => !isTodayTask(task));

  const thisWeekTasks = sortByDueDate(
    datedTasks.filter((task) => {
      const difference = getDayDifference(task.dueDate!);
      return difference >= 1 && difference <= 7;
    }),
  ).slice(0, 4);

  const nextWeekTasks = sortByDueDate(
    datedTasks.filter((task) => {
      const difference = getDayDifference(task.dueDate!);
      return difference >= 8 && difference <= 14;
    }),
  ).slice(0, 4);

  const overdueTasks = sortByDueDate(
    datedTasks.filter((task) => getDayDifference(task.dueDate!) < 0),
  ).slice(0, 2);

  const totalVisible =
    overdueTasks.length + thisWeekTasks.length + nextWeekTasks.length;

  return (
    <Card className="hint-card task-summary" id="weekTasksCard">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Next up</p>
          <h2>This Week & Next</h2>
        </div>

        <span className="pill">{totalVisible} dated</span>
      </div>

      {totalVisible === 0 ? (
        <p className="muted-text">
          No dated tasks outside today. Good. Do not invent stress.
        </p>
      ) : (
        <div className="upcoming-split-list">
          {overdueTasks.length > 0 && (
            <section className="upcoming-section overdue-section">
              <h3>Overdue</h3>
              <div className="upcoming-list">
                {overdueTasks.map((task) => (
                  <UpcomingTaskRow key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          <section className="upcoming-section">
            <h3>This week</h3>
            {thisWeekTasks.length === 0 ? (
              <p className="muted-text">Nothing dated this week.</p>
            ) : (
              <div className="upcoming-list">
                {thisWeekTasks.map((task) => (
                  <UpcomingTaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </section>

          <section className="upcoming-section">
            <h3>Next week</h3>
            {nextWeekTasks.length === 0 ? (
              <p className="muted-text">Nothing dated next week.</p>
            ) : (
              <div className="upcoming-list">
                {nextWeekTasks.map((task) => (
                  <UpcomingTaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Card>
  );
}

function UpcomingTaskRow({ task }: { task: Task }) {
  return (
    <div className="upcoming-row">
      <div>
        <strong>{task.title}</strong>
        <p>
          {task.area} · {task.priority} · {task.spoonCost} 🥄
          {task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : ""}
        </p>
        {task.nextAction ? <p>Next: {task.nextAction}</p> : null}
      </div>

      <span>{formatDueDate(task.dueDate!)}</span>
    </div>
  );
}
