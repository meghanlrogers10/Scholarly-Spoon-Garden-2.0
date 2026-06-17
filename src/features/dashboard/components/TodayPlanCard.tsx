import { useState } from "react";
import type { Task, TaskArea, TaskPriority } from "../../../shared/types/task";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Link } from "react-router-dom";

type AreaFilter = "All" | TaskArea;
type PriorityFilter = "All" | TaskPriority;
type SortMode = "newest" | "priority" | "spoons-low" | "spoons-high";

type TodayPlanCardProps = {
  tasks: Task[];
  onToggleDone: (id: string) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onOpenDailyPlan: () => void;
};

const areaOptions: AreaFilter[] = [
  "All",
  "Research",
  "Teaching",
  "Service",
  "Personal",
  "Other",
];

const priorityOptions: PriorityFilter[] = ["All", "High", "Medium", "Low"];

const priorityRank: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function sortTasks(tasks: Task[], sortMode: SortMode) {
  const taskCopy = [...tasks];

  if (sortMode === "priority") {
    return taskCopy.sort(
      (a, b) => priorityRank[b.priority] - priorityRank[a.priority],
    );
  }

  if (sortMode === "spoons-low") {
    return taskCopy.sort((a, b) => a.spoonCost - b.spoonCost);
  }

  if (sortMode === "spoons-high") {
    return taskCopy.sort((a, b) => b.spoonCost - a.spoonCost);
  }

  return taskCopy.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function TodayPlanCard({
  tasks,
  onToggleDone,
  onAddTask,
  onEditTask,
  onOpenDailyPlan,
}: TodayPlanCardProps) {

  const [areaFilter, setAreaFilter] = useState<AreaFilter>("All");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const activeTasks = tasks.filter((task) => task.status !== "done");

  const filteredTasks = activeTasks.filter((task) => {
    const matchesArea = areaFilter === "All" || task.area === areaFilter;
    const matchesPriority =
      priorityFilter === "All" || task.priority === priorityFilter;

    return matchesArea && matchesPriority;
  });

  const visibleTasks = sortTasks(filteredTasks, sortMode);

  return (
    <Card className="hint-card task-summary today-plan-card" id="todayTasksCard">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Must wins</p>
          <h2>Today’s Plan</h2>
        </div>

<div className="today-plan-actions">
  <span className="pill">
    {visibleTasks.length}/{activeTasks.length} tasks
  </span>

  <Link className="text-button" to="/tasks">
    View all
  </Link>

  <Button variant="soft" onClick={onOpenDailyPlan}>
    Plan day
  </Button>

  <Button variant="soft" onClick={onAddTask}>
    + Add task
  </Button>
</div>
      </div>

      <div className="task-filter-bar">
        <label>
          <span>Area</span>
          <select
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value as AreaFilter)}
          >
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Priority</span>
          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as PriorityFilter)
            }
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="newest">Newest first</option>
            <option value="priority">Highest priority</option>
            <option value="spoons-low">Lowest spoon cost</option>
            <option value="spoons-high">Highest spoon cost</option>
          </select>
        </label>
      </div>

      {activeTasks.length === 0 ? (
        <p className="muted-text">
          No tasks yet. Capture something, then turn it into a task.
        </p>
      ) : visibleTasks.length === 0 ? (
        <p className="muted-text">
          No tasks match those filters. Your task list is being dramatic.
        </p>
      ) : (
        <div className="task-list">
          {visibleTasks.map((task) => (
            <div key={task.id} className="task-row">
              <label className="task-check-row">
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  onChange={() => onToggleDone(task.id)}
                />

                <div>
                  <strong>{task.title}</strong>
			<p>
 					 {task.area} · {task.priority} priority
 					 {task.dueDate ? ` · due ${task.dueDate}` : ""}
             {task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : ""}
             {task.lowEnergyFriendly ? " · low-energy friendly" : ""}
				</p>
                {task.nextAction ? <p>Next: {task.nextAction}</p> : null}
				</div>
              </label>

              <div className="task-row-actions">
                <span className="spoon-cost">{task.spoonCost} 🥄</span>
                <button className="text-button" onClick={() => onEditTask(task)}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
