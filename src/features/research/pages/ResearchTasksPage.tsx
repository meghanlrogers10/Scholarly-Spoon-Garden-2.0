import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ResearchProjectSubnav } from "../components/ResearchProjectSubnav";
import { ResearchTaskModal } from "../components/ResearchTaskModal";
import { researchStages } from "../data/researchStages";
import { useResearchProjects } from "../hooks/useResearchProjects";
import { useResearchTasks } from "../hooks/useResearchTasks";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import type {
  ResearchStageKey,
  ResearchTask,
  ResearchTaskInput,
  ResearchTaskPriority,
  ResearchTaskStatus,
} from "../types";

type StatusFilter = "all" | ResearchTaskStatus;
type PriorityFilter = "all" | ResearchTaskPriority;
type StageFilter = "all" | ResearchStageKey;
type EnergyFilter = "all" | "low-spoon" | "restart";

const statusLabels: Record<ResearchTaskStatus, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

const priorityLabels: Record<ResearchTaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const stageOptions = Object.entries(researchStages) as Array<
  [ResearchStageKey, string]
>;

function getDashboardPriority(priority: ResearchTaskPriority) {
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

export function ResearchTasksPage() {
  const { projectId } = useParams();
  const location = useLocation();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ResearchTask | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>("all");

  const { projects } = useResearchProjects();

  const {
    getTasksForProject,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    refreshTasks,
  } = useResearchTasks();

  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();

  useEffect(() => {
    refreshTasks();
  // Refresh localStorage-backed research tasks only when navigating between research routes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const project = projects.find((item) => item.id === projectId);

  if (!project || !projectId) {
    return (
      <section className="research-page page-stack">
        <div className="research-hero-panel">
          <div>
            <p className="eyebrow">Research</p>
            <h1>Project not found.</h1>
            <p>Go back to the Research page and choose a project.</p>
          </div>

          <Link className="research-secondary-link" to="/research">
            ← Back to Research
          </Link>
        </div>
      </section>
    );
  }

  const projectTitle = project.title;
  const projectShortName = project.shortName;

  const projectTasks = getTasksForProject(projectId);

  const openTasks = projectTasks.filter((task) => task.status !== "done");
  const doneTasks = projectTasks.filter((task) => task.status === "done");
  const lowSpoonTasks = projectTasks.filter(
    (task) => task.status !== "done" && task.spoonCost <= 2
  );

  const visibleTasks = projectTasks.filter((task) => {
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    const matchesStage =
      stageFilter === "all" || task.stageKey === stageFilter;

    const matchesEnergy =
      energyFilter === "all" ||
      (energyFilter === "low-spoon" && task.spoonCost <= 2) ||
      (energyFilter === "restart" &&
        task.status !== "done" &&
        task.spoonCost <= 2);

    return matchesStatus && matchesPriority && matchesStage && matchesEnergy;
  });

  function openNewTaskModal() {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  }

  function openEditTaskModal(task: ResearchTask) {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }

  function closeTaskModal() {
    setEditingTask(null);
    setIsTaskModalOpen(false);
  }

  function handleSaveTask(input: ResearchTaskInput) {
    if (editingTask) {
      updateTask(editingTask.id, input);
      return;
    }

    createTask(input);
  }

  function handleAddTaskToToday(task: ResearchTask) {
    addLinkedTaskToToday({
      source: "research-task",
      sourceId: task.id,
      title: task.title,
      area: "Research",
      spoonCost: task.spoonCost,
      priority: getDashboardPriority(task.priority),
      dueDate: task.dueDate,
      notes: `From research project: ${projectTitle}`,
      projectId,
      taskType: "research",
      nextAction: task.title,
      lowEnergyFriendly: task.spoonCost <= 2,
    });
  }

  function resetFilters() {
    setStatusFilter("all");
    setPriorityFilter("all");
    setStageFilter("all");
    setEnergyFilter("all");
  }

  function showRestartTasks() {
    setStatusFilter("all");
    setPriorityFilter("all");
    setStageFilter("all");
    setEnergyFilter("restart");
  }

  return (
    <section className="research-page page-stack">
      <div className="research-hero-panel">
        <div>
          <Link className="research-secondary-link" to={`/research/${projectId}`}>
            ← Back to {projectShortName}
          </Link>

          <p className="eyebrow">{projectShortName}</p>
          <h1>Project Tasks</h1>
          <p>
            This is the manuscript pipeline for this project. Treat it as a
            scaffold, not a prison. The next right task beats the perfect plan.
          </p>
        </div>

        <div className="research-hero-panel__actions">
          <button
            className="research-primary-button"
            type="button"
            onClick={openNewTaskModal}
          >
            + Add Task
          </button>
        </div>
      </div>

      <ResearchProjectSubnav projectId={projectId} />

      <div className="research-task-summary">
        <span>{openTasks.length} open</span>
        <span>{doneTasks.length} done</span>
        <span>{lowSpoonTasks.length} low-spoon</span>
        <span>{visibleTasks.length}/{projectTasks.length} showing</span>
      </div>

      <section className="research-task-filter-panel">
        <div>
          <p className="research-task-filter-panel__eyebrow">Task view</p>
          <h2>Filter the noise.</h2>
          <p>
            Use this when the list is too loud. Low-spoon and restart mode are
            for getting moving without needing a full-brain day.
          </p>
        </div>

        <div className="research-task-filter-grid">
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">All statuses</option>
              <option value="todo">To do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
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
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label>
            <span>Stage</span>
            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(event.target.value as StageFilter)
              }
            >
              <option value="all">All stages</option>
              {stageOptions.map(([stageKey, stageLabel]) => (
                <option key={stageKey} value={stageKey}>
                  {stageLabel}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Energy</span>
            <select
              value={energyFilter}
              onChange={(event) =>
                setEnergyFilter(event.target.value as EnergyFilter)
              }
            >
              <option value="all">All tasks</option>
              <option value="low-spoon">Low-spoon only</option>
              <option value="restart">Restart mode</option>
            </select>
          </label>
        </div>

        <div className="research-task-filter-actions">
          <button
            className="research-chip-button"
            type="button"
            onClick={showRestartTasks}
          >
            Show restart tasks
          </button>

          <button
            className="research-chip-button"
            type="button"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      </section>

      <section className="research-task-list">
        {visibleTasks.map((task) => (
          <article
            key={task.id}
            className={`research-task-card research-task-card--${task.status}`}
          >
            <div>
              <p className="research-task-card__stage">
                {researchStages[task.stageKey]}
              </p>

              <h2>{task.title}</h2>

              {task.notes ? (
                <p className="research-task-card__notes">{task.notes}</p>
              ) : null}

              <div className="research-task-card__meta">
                <span>{statusLabels[task.status]}</span>
                <span>{priorityLabels[task.priority]} priority</span>
                <span>{task.spoonCost} spoons</span>
                {task.dueDate ? <span>Due {task.dueDate}</span> : null}
              </div>
            </div>

            <div className="research-task-card__actions">
              <button
                className="research-chip-button"
                type="button"
                onClick={() => openEditTaskModal(task)}
              >
                Edit
              </button>

              <button
                className="research-chip-button"
                type="button"
                disabled={
                  isSourceOnToday("research-task", task.id) ||
                  task.status === "done"
                }
                onClick={() => handleAddTaskToToday(task)}
              >
                {isSourceOnToday("research-task", task.id)
                  ? "On Today"
                  : "Add to Today"}
              </button>

              {task.status !== "todo" ? (
                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => updateTaskStatus(task.id, "todo")}
                >
                  To do
                </button>
              ) : null}

              {task.status !== "doing" ? (
                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => updateTaskStatus(task.id, "doing")}
                >
                  Doing
                </button>
              ) : null}

              {task.status !== "done" ? (
                <button
                  className="research-chip-button"
                  type="button"
                  onClick={() => updateTaskStatus(task.id, "done")}
                >
                  Done
                </button>
              ) : null}

              <button
                className="research-chip-button research-chip-button--danger"
                type="button"
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {projectTasks.length === 0 ? (
          <div className="research-empty-state">
            No tasks for this project yet. Add one tiny next action.
          </div>
        ) : null}

        {projectTasks.length > 0 && visibleTasks.length === 0 ? (
          <div className="research-empty-state">
            No tasks match these filters. Reset the filters or switch to restart
            mode.
          </div>
        ) : null}
      </section>

      {isTaskModalOpen ? (
        <ResearchTaskModal
          projectId={projectId}
          task={editingTask ?? undefined}
          onClose={closeTaskModal}
          onSaveTask={handleSaveTask}
        />
      ) : null}
    </section>
  );
}
