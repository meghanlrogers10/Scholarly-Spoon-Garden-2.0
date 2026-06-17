import { useState } from "react";
import type { TaskArea, TaskPriority } from "../../../shared/types/task";
import { Button } from "../../../shared/ui/Button";

export type DailyPlanTaskInput = {
  title: string;
  area: TaskArea;
  priority: TaskPriority;
  spoonCost: 1 | 2 | 3 | 4 | 5;
};

type DailyPlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tasks: DailyPlanTaskInput[]) => void;
};

export function DailyPlanModal({
  isOpen,
  onClose,
  onSave,
}: DailyPlanModalProps) {
  const [planText, setPlanText] = useState("");
  const [area, setArea] = useState<TaskArea>("Other");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [spoonCost, setSpoonCost] = useState<1 | 2 | 3 | 4 | 5>(1);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const taskTitles = planText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (taskTitles.length === 0) {
      return;
    }

    const tasks = taskTitles.map((title) => ({
      title,
      area,
      priority,
      spoonCost,
    }));

    onSave(tasks);
    setPlanText("");
    setArea("Other");
    setPriority("Medium");
    setSpoonCost(1);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card daily-plan-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-plan-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Daily Plan</p>
            <h2 id="daily-plan-title">What are your plans for today?</h2>
          </div>

          <button className="text-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="daily-plan-form" onSubmit={handleSubmit}>
          <label>
            <span>One task per line</span>
            <textarea
              value={planText}
              onChange={(event) => setPlanText(event.target.value)}
              placeholder={"Revise SCD intro\nEmail Mark\nPrep SOC 6170 module"}
              rows={8}
              autoFocus
            />
          </label>

          <div className="form-grid">
            <label>
              <span>Default area</span>
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
              <span>Default priority</span>
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
              <span>Default spoons</span>
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

          <p className="muted-text">
            Each non-empty line becomes a task in Today’s Plan. You can edit
            area, priority, and spoon cost afterward.
          </p>

          <div className="modal-actions">
            <Button type="button" variant="soft" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add to today</Button>
          </div>
        </form>
      </div>
    </div>
  );
}