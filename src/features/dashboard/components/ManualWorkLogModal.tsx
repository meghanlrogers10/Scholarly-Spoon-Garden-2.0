import { useState } from "react";
import type {
  EstimateAccuracy,
  TimerCategory,
  TimerMood,
} from "../../../shared/types/timer";
import { Button } from "../../../shared/ui/Button";
import type { ManualWorkLogInput } from "../hooks/useManualWorkLogs";
import type { Task } from "../../../shared/types/task";
import type {
  PlannedTaskBlock,
  WorkingBlock,
} from "../../../shared/types/planning";
import { formatWorkingBlockTimeRange } from "../utils/workingBlockCalendar";

type ManualWorkLogModalProps = {
  isOpen: boolean;
  tasks: Task[];
  workingBlocks: WorkingBlock[];
  plannedBlocks: PlannedTaskBlock[];
  onClose: () => void;
  onSave: (entry: ManualWorkLogInput) => void;
};

const categoryOptions: TimerCategory[] = [
  "Research",
  "Teaching",
  "Service",
  "MindSpace",
  "Writing",
  "Admin",
  "Other",
];

const moodOptions: Array<{
  value: TimerMood;
  emoji: string;
  label: string;
}> = [
  { value: "overwhelmed", emoji: "😫", label: "Overwhelmed" },
  { value: "meh", emoji: "😐", label: "Meh" },
  { value: "satisfied", emoji: "🙂", label: "Satisfied" },
  { value: "proud", emoji: "😄", label: "Proud" },
  { value: "energized", emoji: "🚀", label: "Energized" },
];

const estimateAccuracyOptions: Array<{
  value: EstimateAccuracy;
  label: string;
}> = [
  { value: "too-short", label: "Estimate was too short" },
  { value: "about-right", label: "Estimate was about right" },
  { value: "too-long", label: "Estimate was too long" },
];

type BooleanChoice = "yes" | "no";

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTimeInputValue() {
  return new Date().toTimeString().slice(0, 5);
}

export function ManualWorkLogModal({
  isOpen,
  tasks,
  workingBlocks,
  plannedBlocks,
  onClose,
  onSave,
}: ManualWorkLogModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TimerCategory>("Research");
  const [date, setDate] = useState(getTodayDateInputValue());
  const [startTime, setStartTime] = useState(getCurrentTimeInputValue());
  const [endTime, setEndTime] = useState("");
  const [mood, setMood] = useState<TimerMood | "">("");
  const [reflection, setReflection] = useState("");
  const [completed, setCompleted] = useState(true);
  const [estimateAccuracy, setEstimateAccuracy] = useState<
    EstimateAccuracy | ""
  >("");
  const [hiddenSetupChoice, setHiddenSetupChoice] = useState<
    BooleanChoice | ""
  >("");
  const [interruptedChoice, setInterruptedChoice] = useState<
    BooleanChoice | ""
  >("");
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [linkedWorkingBlockId, setLinkedWorkingBlockId] = useState("");
  const [linkedPlannedBlockId, setLinkedPlannedBlockId] = useState("");

  if (!isOpen) {
    return null;
  }

  const dateWorkingBlocks = workingBlocks.filter((block) => block.date === date);
  const plannedBlocksForSelectedWorkingBlock = plannedBlocks.filter(
    (plannedBlock) => plannedBlock.workingBlockId === linkedWorkingBlockId,
  );

  function resetForm() {
    setTitle("");
    setCategory("Research");
    setDate(getTodayDateInputValue());
    setStartTime(getCurrentTimeInputValue());
    setEndTime("");
    setMood("");
    setReflection("");
    setCompleted(true);
    setEstimateAccuracy("");
    setHiddenSetupChoice("");
    setInterruptedChoice("");
    setLinkedTaskId("");
    setLinkedWorkingBlockId("");
    setLinkedPlannedBlockId("");
  }

  function handleLinkedTaskChange(taskId: string) {
    setLinkedTaskId(taskId);
    setLinkedPlannedBlockId("");

    const selectedTask = tasks.find((task) => task.id === taskId);

    if (!selectedTask) {
      return;
    }

    if (!title.trim()) {
      setTitle(selectedTask.title);
    }

    if (
      selectedTask.area === "Research" ||
      selectedTask.area === "Teaching" ||
      selectedTask.area === "Service" ||
      selectedTask.area === "Other"
    ) {
      setCategory(selectedTask.area);
    } else {
      setCategory("Other");
    }
  }

  function handleWorkingBlockChange(workingBlockId: string) {
    setLinkedWorkingBlockId(workingBlockId);
    setLinkedPlannedBlockId("");
  }

  function handlePlannedBlockChange(plannedBlockId: string) {
    setLinkedPlannedBlockId(plannedBlockId);

    const plannedBlock = plannedBlocks.find((block) => block.id === plannedBlockId);

    if (!plannedBlock) {
      return;
    }

    const selectedTask = tasks.find((task) => task.id === plannedBlock.taskId);

    setLinkedTaskId(plannedBlock.taskId);
    setTitle(plannedBlock.titleSnapshot);

    if (selectedTask?.area) {
      setCategory(selectedTask.area === "Personal" ? "Other" : selectedTask.area);
    } else if (plannedBlock.area) {
      setCategory(plannedBlock.area === "Personal" ? "Other" : plannedBlock.area);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      return;
    }
    
    const selectedTask = tasks.find((task) => task.id === linkedTaskId);
    const selectedPlannedBlock = plannedBlocks.find(
      (block) => block.id === linkedPlannedBlockId,
    );
    const hadHiddenSetup =
      hiddenSetupChoice === "yes"
        ? true
        : hiddenSetupChoice === "no"
          ? false
          : undefined;
    const wasInterrupted =
      interruptedChoice === "yes"
        ? true
        : interruptedChoice === "no"
          ? false
          : undefined;

    onSave({
      title: cleanedTitle,
      category,
      date,
      startTime,
      endTime: endTime || undefined,
      mood: mood || undefined,
      reflection: reflection.trim(),
      completed,
      estimateAccuracy: estimateAccuracy || undefined,
      hadHiddenSetup,
      wasInterrupted,
      taskId: selectedTask?.id ?? selectedPlannedBlock?.taskId,
      taskTitle: selectedTask?.title ?? selectedPlannedBlock?.titleSnapshot,
      workingBlockId: linkedWorkingBlockId || undefined,
      plannedTaskBlockId: linkedPlannedBlockId || undefined,
      source: "manual",
      completedTask: completed,
    });

    resetForm();
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card work-log-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-work-log-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Work Log</p>
            <h2 id="manual-work-log-title">Log completed work</h2>
          </div>

          <button className="text-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="work-log-form" onSubmit={handleSubmit}>
          <label>
            <span>Link existing task</span>
            <select
              value={linkedTaskId}
              onChange={(event) => handleLinkedTaskChange(event.target.value)}
            >
              <option value="">None</option>
              {tasks
                .filter((task) => task.status === "todo")
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.area})
                  </option>
                ))}
            </select>
          </label>

          <div className="form-grid">
            <label>
              <span>Working block</span>
              <select
                value={linkedWorkingBlockId}
                onChange={(event) => handleWorkingBlockChange(event.target.value)}
              >
                <option value="">Not linked to a block</option>
                {dateWorkingBlocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {formatWorkingBlockTimeRange(block)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Planned task block</span>
              <select
                value={linkedPlannedBlockId}
                onChange={(event) => handlePlannedBlockChange(event.target.value)}
                disabled={!linkedWorkingBlockId}
              >
                <option value="">No planned-task link</option>
                {plannedBlocksForSelectedWorkingBlock.map((plannedBlock) => (
                  <option key={plannedBlock.id} value={plannedBlock.id}>
                    {plannedBlock.titleSnapshot}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>What did you work on?</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Revised SCD theory section"
              autoFocus
            />
          </label>

          <div className="form-grid">
            <label>
              <span>Category</span>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as TimerCategory)
                }
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <label>
              <span>Start time</span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label>
              <span>End time</span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>
          </div>

          <fieldset className="timer-fieldset">
            <legend>Mood</legend>
            <div className="timer-mood-scale">
              {moodOptions.map((option) => (
                <label
                  key={option.value}
                  className={`timer-mood-option ${
                    mood === option.value ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="manualWorkMood"
                    value={option.value}
                    checked={mood === option.value}
                    onChange={() => setMood(option.value)}
                  />
                  <span aria-hidden="true">{option.emoji}</span>
                  <small>{option.label}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="work-log-checkbox-row">
            <input
              type="checkbox"
              checked={completed}
              onChange={(event) => setCompleted(event.target.checked)}
            />
            <span>Mark this work as completed</span>
          </label>

          <fieldset className="timer-feedback-fieldset">
            <legend>Time reality</legend>
            <div className="timer-feedback-grid">
              <label>
                <span>Estimate feel</span>
                <select
                  value={estimateAccuracy}
                  onChange={(event) =>
                    setEstimateAccuracy(event.target.value as EstimateAccuracy | "")
                  }
                >
                  <option value="">Not sure</option>
                  {estimateAccuracyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Hidden setup?</span>
                <select
                  value={hiddenSetupChoice}
                  onChange={(event) =>
                    setHiddenSetupChoice(event.target.value as BooleanChoice | "")
                  }
                >
                  <option value="">Not sure</option>
                  <option value="yes">Yes, setup was real work</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label>
                <span>Interrupted?</span>
                <select
                  value={interruptedChoice}
                  onChange={(event) =>
                    setInterruptedChoice(event.target.value as BooleanChoice | "")
                  }
                >
                  <option value="">Not sure</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
          </fieldset>

          <label>
            <span>Reflection</span>
            <textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="How did it go? Anything future-you should know?"
              rows={3}
            />
          </label>

          <div className="modal-actions">
            <Button type="button" variant="soft" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save work log</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
