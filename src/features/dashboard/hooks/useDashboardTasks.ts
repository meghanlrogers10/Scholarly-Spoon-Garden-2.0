import { useState } from "react";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import type { Task } from "../../../shared/types/task";
import type { TaskFormInput } from "../components/TaskEditorModal";
import type { CapturedItem } from "./useDashboardCaptures";

function isTodayTask(task: Task) {
  return task.today !== false && task.status === "todo";
}

export function useDashboardTasks() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const {
    tasks: allTasks,
    updateTasks,
    adjustActualMinutesForTask,
    addActualMinutesToTask,
  } = useTaskBridge();

  const todayTasks = allTasks.filter(isTodayTask);
  const completedTasks = allTasks.filter(
    (task) => task.status === "done" && task.today !== false,
  );

  function createTaskFromCapture(
    item: CapturedItem,
    afterCreate?: (id: string) => void,
  ) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: item.text,
      area: "Other",
      spoonCost: 1,
      priority: "Medium",
      status: "todo",
      today: true,
      source: "quick-capture",
      sourceId: item.id,
      nextAction: item.text,
      taskType: "other",
      lowEnergyFriendly: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateTasks((currentTasks) => [newTask, ...currentTasks]);
    afterCreate?.(item.id);
  }

  function saveTask(taskInput: TaskFormInput, taskId?: string) {
    if (taskId) {
      updateTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                title: taskInput.title,
                area: taskInput.area,
                priority: taskInput.priority,
                spoonCost: taskInput.spoonCost,
                dueDate: taskInput.dueDate,
                estimatedMinutes: taskInput.estimatedMinutes,
                estimateSource: taskInput.estimatedMinutes ? "manual" : task.estimateSource,
                taskType: taskInput.taskType,
                nextAction: taskInput.nextAction,
                lowEnergyFriendly: taskInput.lowEnergyFriendly,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      );

      setTaskToEdit(null);
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskInput.title,
      area: taskInput.area,
      spoonCost: taskInput.spoonCost,
      priority: taskInput.priority,
      dueDate: taskInput.dueDate,
      estimatedMinutes: taskInput.estimatedMinutes,
      estimateSource: taskInput.estimatedMinutes ? "manual" : undefined,
      taskType: taskInput.taskType,
      nextAction: taskInput.nextAction,
      lowEnergyFriendly: taskInput.lowEnergyFriendly,
      source: "manual",
      status: "todo",
      today: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateTasks((currentTasks) => [newTask, ...currentTasks]);
  }

  function saveDailyPlanTasks(taskInputs: TaskFormInput[]) {
    const now = new Date().toISOString();

    const newTasks: Task[] = taskInputs.map((taskInput) => ({
      id: crypto.randomUUID(),
      title: taskInput.title,
      area: taskInput.area,
      spoonCost: taskInput.spoonCost,
      priority: taskInput.priority,
      estimatedMinutes: taskInput.estimatedMinutes,
      estimateSource: taskInput.estimatedMinutes ? "manual" : undefined,
      taskType: taskInput.taskType,
      nextAction: taskInput.nextAction,
      lowEnergyFriendly: taskInput.lowEnergyFriendly,
      source: "manual",
      status: "todo",
      today: true,
      createdAt: now,
      updatedAt: now,
    }));

    updateTasks((currentTasks) => [...newTasks, ...currentTasks]);
  }

  function toggleTaskDone(id: string) {
    updateTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "done" ? "todo" : "done",
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    );
  }
  
  function markTaskDone(id: string) {
  updateTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === id
        ? {
            ...task,
            status: "done",
            today: true,
            updatedAt: new Date().toISOString(),
          }
        : task,
    ),
  );
}

  function restoreTask(id: string) {
    updateTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: "todo",
              today: true,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    );
  }

function addTaskToToday(id: string) {
  updateTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === id
        ? {
            ...task,
            today: true,
            status: "todo",
            updatedAt: new Date().toISOString(),
          }
        : task,
    ),
  );
}

function removeTaskFromToday(id: string) {
  updateTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === id
        ? {
            ...task,
            today: false,
            workingBlockId: undefined,
            updatedAt: new Date().toISOString(),
          }
        : task,
    ),
  );
}

function postponeTask(id: string, dueDate: string) {
  updateTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === id
        ? {
            ...task,
            today: false,
            dueDate,
            workingBlockId: undefined,
            updatedAt: new Date().toISOString(),
          }
        : task,
    ),
  );
}

function planTaskInWorkingBlock(id: string, workingBlockId: string) {
  updateTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === id
        ? {
            ...task,
            today: true,
            status: "todo",
            workingBlockId,
            updatedAt: new Date().toISOString(),
          }
        : task,
    ),
  );
}

  function deleteTask(id: string) {
    updateTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id),
    );
  }

  function openAddTaskModal() {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  }

  function openEditTaskModal(task: Task) {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  }

  function closeTaskModal() {
    setTaskToEdit(null);
    setIsTaskModalOpen(false);
  }

  return {
    allTasks,
    todayTasks,
    completedTasks,
    isTaskModalOpen,
    taskToEdit,
    createTaskFromCapture,
    saveTask,
    saveDailyPlanTasks,
    toggleTaskDone,
    markTaskDone,
    restoreTask,
    addTaskToToday,
    removeTaskFromToday,
    postponeTask,
    planTaskInWorkingBlock,
    adjustActualMinutesForTask,
    addActualMinutesToTask,
    deleteTask,
    openAddTaskModal,
    openEditTaskModal,
    closeTaskModal,
  };
}
