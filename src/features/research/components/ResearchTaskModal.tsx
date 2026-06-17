import { useState, type FormEvent } from "react";
import { researchStages } from "../data/researchStages";
import type {
  ResearchStageKey,
  ResearchTask,
  ResearchTaskInput,
  ResearchTaskPriority,
  ResearchTaskStatus,
} from "../types";

type ResearchTaskModalProps = {
  projectId: string;
  task?: ResearchTask;
  onClose: () => void;
  onSaveTask: (task: ResearchTaskInput) => void;
};

const stageOptions = Object.entries(researchStages) as Array<
  [ResearchStageKey, string]
>;

export function ResearchTaskModal({
  projectId,
  task,
  onClose,
  onSaveTask,
}: ResearchTaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [stageKey, setStageKey] = useState<ResearchStageKey>(
    task?.stageKey ?? "lit-framing"
  );
  const [status, setStatus] = useState<ResearchTaskStatus>(
    task?.status ?? "todo"
  );
  const [priority, setPriority] = useState<ResearchTaskPriority>(
    task?.priority ?? "medium"
  );
  const [spoonCost, setSpoonCost] = useState<1 | 2 | 3 | 4 | 5>(
    task?.spoonCost ?? 2
  );
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      return;
    }

    onSaveTask({
      projectId,
      title: cleanedTitle,
      stageKey,
      status,
      priority,
      spoonCost,
      dueDate,
      notes,
    });

    onClose();
  }

  return (
    <div className="research-modal-backdrop" role="presentation">
      <div
        className="research-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="research-task-modal-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">{task ? "Edit task" : "New task"}</p>
            <h2 id="research-task-modal-title">
              {task ? "Adjust the next move." : "Add a real-world task."}
            </h2>
            <p>
              Make it concrete enough that future you knows exactly what to do.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close task modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <label>
            <span>Task title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Rerun SCD model without outliers"
              autoFocus
            />
          </label>

          <div className="research-modal__row">
            <label>
              <span>Stage</span>
              <select
                value={stageKey}
                onChange={(event) =>
                  setStageKey(event.target.value as ResearchStageKey)
                }
              >
                {stageOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ResearchTaskStatus)
                }
              >
                <option value="todo">To do</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>

          <div className="research-modal__row">
            <label>
              <span>Priority</span>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as ResearchTaskPriority)
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
          </div>

          <label>
            <span>Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>

          <label>
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Context, decision, blocker, or reminder."
              rows={4}
            />
          </label>

          <div className="research-modal__actions">
            <button
              className="research-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="research-primary-button" type="submit">
              {task ? "Save task" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}