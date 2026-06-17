import { useMemo, useState } from "react";
import { generateResearchPipelineTasks } from "../data/researchTaskBlueprints";
import type {
  ResearchProject,
  ResearchTask,
  ResearchTaskInput,
  ResearchTaskStatus,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const STORAGE_KEY = "ssg:researchTasks";

function loadTasks() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchTask[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveTasks(tasks: ResearchTask[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function useResearchTasks() {
  const [tasks, setTasks] = useState<ResearchTask[]>(loadTasks);

  function updateTasks(updater: (currentTasks: ResearchTask[]) => ResearchTask[]) {
    setTasks((currentTasks) => {
      const updatedTasks = updater(currentTasks);
      saveTasks(updatedTasks);
      return updatedTasks;
    });
  }

  function refreshTasks() {
    setTasks(loadTasks());
  }

  useResearchStorageSync(STORAGE_KEY, refreshTasks);

  const tasksByProject = useMemo(() => {
    return tasks.reduce<Record<string, ResearchTask[]>>((groups, task) => {
      if (!groups[task.projectId]) {
        groups[task.projectId] = [];
      }

      groups[task.projectId].push(task);
      return groups;
    }, {});
  }, [tasks]);

  function getTasksForProject(projectId: string) {
    return [...(tasksByProject[projectId] ?? [])].sort((a, b) => {
      const aDone = a.status === "done" ? 1 : 0;
      const bDone = b.status === "done" ? 1 : 0;

      if (aDone !== bDone) {
        return aDone - bDone;
      }

      return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    });
  }

  function createPipelineTasksForProject(project: ResearchProject) {
    const newTasks = generateResearchPipelineTasks(project);

    updateTasks((currentTasks) => {
      const alreadyHasTasks = currentTasks.some(
        (task) => task.projectId === project.id
      );

      if (alreadyHasTasks) {
        return currentTasks;
      }

      return [...newTasks, ...currentTasks];
    });
  }

function createTask(input: ResearchTaskInput) {
  const now = new Date().toISOString();

  const newTask: ResearchTask = {
    id: `${input.projectId}-task-${Date.now()}`,
    projectId: input.projectId,
    title: input.title.trim(),
    stageKey: input.stageKey,
    status: input.status,
    priority: input.priority,
    spoonCost: input.spoonCost,
    dueDate: input.dueDate || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  updateTasks((currentTasks) => [newTask, ...currentTasks]);
}

function updateTask(taskId: string, input: ResearchTaskInput) {
  const now = new Date().toISOString();

  updateTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            title: input.title.trim(),
            stageKey: input.stageKey,
            status: input.status,
            priority: input.priority,
            spoonCost: input.spoonCost,
            dueDate: input.dueDate || undefined,
            notes: input.notes?.trim() || undefined,
            updatedAt: now,
          }
        : task
    )
  );
}

  function updateTaskStatus(taskId: string, status: ResearchTaskStatus) {
    const now = new Date().toISOString();

    updateTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              updatedAt: now,
            }
          : task
      )
    );
  }

  function deleteTask(taskId: string) {
    updateTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId)
    );
  }

return {
  tasks,
  getTasksForProject,
  createPipelineTasksForProject,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  refreshTasks,
};
}
