import "../tasks.css";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import type {
  Task,
  TaskArea,
  TaskPriority,
  TaskStatus,
} from "../../../shared/types/task";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";

type AreaFilter = "All" | TaskArea;
type PriorityFilter = "All" | TaskPriority;
type StatusFilter = "All" | TaskStatus | "today";
type SavedTaskView =
  | "all"
  | "due-soon"
  | "low-spoon"
  | "tiny-next-moves"
  | "waiting-on-others"
  | "research-today"
  | "teaching-today"
  | "service-containment"
  | "no-next-action"
  | "overdue-invisible-labor";

const areaOptions: AreaFilter[] = [
  "All",
  "Research",
  "Teaching",
  "Service",
  "Personal",
  "Other",
];

const priorityOptions: PriorityFilter[] = ["All", "High", "Medium", "Low"];

const statusOptions: StatusFilter[] = [
  "All",
  "today",
  "todo",
  "done",
  "archived",
];

function isTodayTask(task: Task) {
  return task.today !== false && task.status !== "archived";
}

function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDayDifference(dateString?: string) {
  if (!dateString) {
    return undefined;
  }

  const targetDate = new Date(`${dateString}T00:00:00`);
  targetDate.setHours(0, 0, 0, 0);

  const timestamp = targetDate.getTime();

  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return Math.round((timestamp - getTodayDate().getTime()) / 86_400_000);
}

const savedViews: Array<{ key: SavedTaskView; label: string }> = [
  { key: "all", label: "All" },
  { key: "due-soon", label: "Due soon" },
  { key: "low-spoon", label: "Low spoon" },
  { key: "tiny-next-moves", label: "Tiny next moves" },
  { key: "waiting-on-others", label: "Waiting on others" },
  { key: "research-today", label: "Research today" },
  { key: "teaching-today", label: "Teaching today" },
  { key: "service-containment", label: "Service containment" },
  { key: "no-next-action", label: "No next action" },
  { key: "overdue-invisible-labor", label: "Overdue invisible labor" },
];

function matchesSavedView(task: Task, view: SavedTaskView) {
  const dayDifference = getDayDifference(task.dueDate);

  if (view === "all") return true;
  if (view === "due-soon") {
    return task.status === "todo" && dayDifference !== undefined && dayDifference >= 0 && dayDifference <= 7;
  }
  if (view === "low-spoon") return task.status === "todo" && task.spoonCost <= 2;
  if (view === "tiny-next-moves") {
    return (
      task.status === "todo" &&
      Boolean(task.nextAction) &&
      (task.spoonCost <= 2 || (task.estimatedMinutes ?? 999) <= 20)
    );
  }
  if (view === "waiting-on-others") {
    const notes = task.notes?.toLowerCase() ?? "";
    return (
      task.status === "todo" &&
      (notes.includes("waiting on") ||
        notes.includes("status: waiting") ||
        task.source === "ta-follow-up" ||
        task.source === "office-hours")
    );
  }
  if (view === "research-today") return task.area === "Research" && isTodayTask(task);
  if (view === "teaching-today") return task.area === "Teaching" && isTodayTask(task);
  if (view === "service-containment") {
    return task.area === "Service" && task.status === "todo" && (task.spoonCost <= 2 || (task.estimatedMinutes ?? 999) <= 30);
  }
  if (view === "no-next-action") return task.status === "todo" && !task.nextAction;
  if (view === "overdue-invisible-labor") {
    return (
      task.status === "todo" &&
      dayDifference !== undefined &&
      dayDifference < 0 &&
      (task.area === "Service" ||
        task.taskType === "email-admin" ||
        task.taskType === "meeting-prep" ||
        task.taskType === "advising")
    );
  }

  return true;
}

function formatDate(dateString?: string) {
  if (!dateString) {
    return "No due date";
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TasksPage() {
  const { tasks, updateTasks, markTaskToday } = useTaskBridge();

  const [areaFilter, setAreaFilter] = useState<AreaFilter>("All");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [savedView, setSavedView] = useState<SavedTaskView>("all");

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesArea = areaFilter === "All" || task.area === areaFilter;
        const matchesPriority =
          priorityFilter === "All" || task.priority === priorityFilter;

        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "today" && isTodayTask(task)) ||
          task.status === statusFilter;

        return (
          matchesArea &&
          matchesPriority &&
          matchesStatus &&
          matchesSavedView(task, savedView)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      );
  }, [tasks, areaFilter, priorityFilter, statusFilter, savedView]);

  const todayCount = tasks.filter(isTodayTask).length;
  const activeCount = tasks.filter((task) => task.status === "todo").length;
  const completedCount = tasks.filter((task) => task.status === "done").length;
  const archivedCount = tasks.filter(
    (task) => task.status === "archived",
  ).length;

  function updateTask(id: string, updater: (task: Task) => Task) {
    updateTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
              ...updater(task),
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    );
  }

  function handleAddToToday(id: string) {
  markTaskToday(id, true);
}

    function handleRemoveFromToday(id: string) {
    markTaskToday(id, false);
  }

  function handleMarkDone(id: string) {
    updateTask(id, (task) => ({
      ...task,
      status: "done",
    }));
  }

  function handleRestore(id: string) {
    updateTask(id, (task) => ({
      ...task,
      status: "todo",
    }));
  }

  function handleArchive(id: string) {
    updateTask(id, (task) => ({
      ...task,
      status: "archived",
      today: false,
    }));
  }

  function handleDelete(id: string) {
    updateTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
  }

  return (
    <section className="page-stack tasks-page">
      <PageHeader
        eyebrow="Tasks"
        title="Task Library"
        description="The full task garden. Keep the dashboard focused by moving non-today tasks here."
      />

      <div className="tasks-back-row">
        <Link className="text-button" to="/dashboard">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="tasks-summary-grid">
        <Card>
          <p className="eyebrow">Today</p>
          <h2>{todayCount}</h2>
          <p className="muted-text">shown on dashboard</p>
        </Card>

        <Card>
          <p className="eyebrow">Active</p>
          <h2>{activeCount}</h2>
          <p className="muted-text">still open</p>
        </Card>

        <Card>
          <p className="eyebrow">Done</p>
          <h2>{completedCount}</h2>
          <p className="muted-text">completed</p>
        </Card>

        <Card>
          <p className="eyebrow">Archived</p>
          <h2>{archivedCount}</h2>
          <p className="muted-text">out of sight</p>
        </Card>
      </div>

      <Card>
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>Find tasks</h2>
          </div>
          <span className="pill">{visibleTasks.length} visible</span>
        </div>

        <div className="tasks-filter-bar">
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
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "today" ? "Today" : status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tasks-saved-views" aria-label="Saved task views">
          {savedViews.map((view) => (
            <button
              key={view.key}
              className={savedView === view.key ? "is-active" : ""}
              type="button"
              onClick={() => setSavedView(view.key)}
            >
              {view.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Library</p>
            <h2>All Tasks</h2>
          </div>
        </div>

        {visibleTasks.length === 0 ? (
          <p className="muted-text">No tasks match those filters.</p>
        ) : (
          <div className="tasks-library-list">
            {visibleTasks.map((task) => (
              <div key={task.id} className="tasks-library-row">
                <div>
                  <strong>{task.title}</strong>
                  <p>
                    {task.area} · {task.priority} priority · {task.spoonCost} 🥄 ·{" "}
                    {task.status}
                    {task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : ""}
                  </p>
                  <p>
                    {isTodayTask(task) ? "On Today’s Plan" : "Not on Today’s Plan"} ·{" "}
                    {formatDate(task.dueDate)}
                  </p>
                  {task.nextAction ? <p>Next: {task.nextAction}</p> : null}
                </div>

                <div className="tasks-library-actions">
                  {isTodayTask(task) ? (
                    <button
                      className="text-button"
                      onClick={() => handleRemoveFromToday(task.id)}
                    >
                      Remove from today
                    </button>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => handleAddToToday(task.id)}
                    >
                      Add to today
                    </button>
                  )}

                  {task.status === "done" ? (
                    <button
                      className="text-button"
                      onClick={() => handleRestore(task.id)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => handleMarkDone(task.id)}
                    >
                      Mark done
                    </button>
                  )}

                  {task.status !== "archived" && (
                    <button
                      className="text-button"
                      onClick={() => handleArchive(task.id)}
                    >
                      Archive
                    </button>
                  )}

                  <button
                    className="text-button danger-text-button"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
