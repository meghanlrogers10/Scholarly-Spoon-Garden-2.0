import { useEffect, useState } from "react";
import type {
  Task,
  TaskArea,
  TaskPriority,
  TaskType,
} from "../../../shared/types/task";
import { Button } from "../../../shared/ui/Button";

export type TaskFormInput = {
  title: string;
  area: TaskArea;
  priority: TaskPriority;
  spoonCost: 1 | 2 | 3 | 4 | 5;
  dueDate?: string;
  estimatedMinutes?: number;
  taskType?: TaskType;
  nextAction?: string;
  lowEnergyFriendly?: boolean;
};

type TaskEditorModalProps = {
  isOpen: boolean;
  taskToEdit: Task | null;
  onClose: () => void;
  onSaveTask: (task: TaskFormInput, taskId?: string) => void;
};

export function TaskEditorModal({
  isOpen,
  taskToEdit,
  onClose,
  onSaveTask,
}: TaskEditorModalProps) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<TaskArea>("Other");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [spoonCost, setSpoonCost] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("other");
  const [nextAction, setNextAction] = useState("");
  const [lowEnergyFriendly, setLowEnergyFriendly] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    /* eslint-disable react-hooks/set-state-in-effect */
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setArea(taskToEdit.area);
      setPriority(taskToEdit.priority);
      setSpoonCost(taskToEdit.spoonCost);
      setDueDate(taskToEdit.dueDate || "");
      setEstimatedMinutes(
        taskToEdit.estimatedMinutes ? String(taskToEdit.estimatedMinutes) : "",
      );
      setTaskType(taskToEdit.taskType ?? "other");
      setNextAction(taskToEdit.nextAction ?? "");
      setLowEnergyFriendly(Boolean(taskToEdit.lowEnergyFriendly));
      return;
    }

    setTitle("");
    setArea("Other");
    setPriority("Medium");
    setSpoonCost(1);
    setDueDate("");
    setEstimatedMinutes("");
    setTaskType("other");
    setNextAction("");
    setLowEnergyFriendly(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, taskToEdit]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      return;
    }

    onSaveTask(
      {
        title: cleanedTitle,
        area,
        priority,
        spoonCost,
        dueDate: dueDate || undefined,
        estimatedMinutes: estimatedMinutes
          ? Math.max(1, Math.round(Number(estimatedMinutes)))
          : undefined,
        taskType,
        nextAction: nextAction.trim() || undefined,
        lowEnergyFriendly,
      },
      taskToEdit?.id,
    );

    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Task</p>
            <h2 id="task-modal-title">
              {taskToEdit ? "Edit task" : "Add a task"}
            </h2>
          </div>

          <button className="text-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <label>
            <span>Task title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs doing?"
              autoFocus
            />
          </label>

          <div className="form-grid">
            <label>
              <span>Area</span>
              <select
                value={area}
                onChange={(event) => setArea(event.target.value as TaskArea)}
              >
                <option value="Research">Research</option>
                <option value="Teaching">Teaching</option>
                <option value="Service">Service</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              <span>Priority</span>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label>
              <span>Spoon cost</span>
              <select
                value={spoonCost}
                onChange={(event) =>
                  setSpoonCost(Number(event.target.value) as 1 | 2 | 3 | 4 | 5)
                }
              >
                <option value={1}>1 spoon</option>
                <option value={2}>2 spoons</option>
                <option value={3}>3 spoons</option>
                <option value={4}>4 spoons</option>
                <option value={5}>5 spoons</option>
              </select>
            </label>
            
            <label>
			  <span>Due date</span>
			  <input
			    type="date"
			    value={dueDate}
			  onChange={(event) => setDueDate(event.target.value)}
			  />
		</label>

            <label>
              <span>Estimated minutes</span>
              <input
                type="number"
                min="1"
                step="5"
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
                placeholder="25"
              />
            </label>

            <label>
              <span>Task type</span>
              <select
                value={taskType}
                onChange={(event) => setTaskType(event.target.value as TaskType)}
              >
                <option value="writing">Writing</option>
                <option value="reading">Reading</option>
                <option value="grading">Grading</option>
                <option value="class-prep">Class prep</option>
                <option value="email-admin">Email/admin</option>
                <option value="meeting-prep">Meeting prep</option>
                <option value="analysis">Analysis</option>
                <option value="coding">Coding</option>
                <option value="service">Service</option>
                <option value="advising">Advising</option>
                <option value="teaching">Teaching</option>
                <option value="research">Research</option>
                <option value="mindspace">Mindspace</option>
                <option value="other">Other</option>
              </select>
            </label>
		
          </div>

          <label>
            <span>Next action</span>
            <input
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              placeholder="Smallest visible next move"
            />
          </label>

          <label className="settings-toggle-row">
            <span>
              <strong>Low-energy friendly</strong>
              <small>Good candidate for tired or foggy days.</small>
            </span>
            <input
              type="checkbox"
              checked={lowEnergyFriendly}
              onChange={(event) => setLowEnergyFriendly(event.target.checked)}
            />
          </label>

          <div className="modal-actions">
            <Button type="button" variant="soft" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{taskToEdit ? "Save changes" : "Add task"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
