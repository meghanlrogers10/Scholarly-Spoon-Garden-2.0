import { useState, type FormEvent } from "react";
import { Button } from "../../../shared/ui/Button";
import type {
  DailyCheckIn,
  PlanningMode,
  WorkingBlock,
  WorkingBlockStatus,
} from "../../../shared/types/planning";

type DailyCheckInModalProps = {
  checkIn?: DailyCheckIn;
  todayDate: string;
  defaultPlanningMode: PlanningMode;
  defaultStartHour: number;
  defaultWorkingBlockMinutes: number;
  defaultPreferLowEnergyTasks: boolean;
  onClose: () => void;
  onSave: (input: {
    availableSpoons: DailyCheckIn["availableSpoons"];
    planningMode: PlanningMode;
    workingBlocks: WorkingBlock[];
    avoidNotes?: string;
    protectNotes?: string;
    preferLowEnergyTasks?: boolean;
    avoidHighEmotionTasks?: boolean;
    hardStopTime?: string;
  }) => void;
};

const planningModeLabels: Record<PlanningMode, string> = {
  balanced: "Balanced",
  "research-push": "Research push",
  "teaching-survival": "Teaching survival",
  "service-triage": "Service triage",
  "low-energy": "Low-energy mode",
  "deadline-emergency": "Deadline emergency",
  "small-task-cleanup": "Small-task cleanup",
};

const workingBlockStatusLabels: Record<WorkingBlockStatus, string> = {
  planned: "Planned",
  "partially-used": "Partially used",
  used: "Used",
  missed: "Missed",
  cancelled: "Cancelled",
};

function formatHourInput(hour: number) {
  return `${String(Math.min(Math.max(hour, 0), 23)).padStart(2, "0")}:00`;
}

function addMinutesToTime(time: string, minutes: number) {
  const [hour = "9", minute = "0"] = time.split(":");
  const totalMinutes = Number(hour) * 60 + Number(minute) + minutes;
  const safeTotal = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 59);
  const nextHour = Math.floor(safeTotal / 60);
  const nextMinute = safeTotal % 60;

  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
}

function createBlankBlock(
  date: string,
  startTime: string,
  minutes: number,
): WorkingBlock {
  return {
    id: crypto.randomUUID(),
    date,
    startTime,
    endTime: addMinutesToTime(startTime, minutes),
    status: "planned",
  };
}

export function DailyCheckInModal({
  checkIn,
  todayDate,
  defaultPlanningMode,
  defaultStartHour,
  defaultWorkingBlockMinutes,
  defaultPreferLowEnergyTasks,
  onClose,
  onSave,
}: DailyCheckInModalProps) {
  const defaultStartTime = formatHourInput(defaultStartHour);
  const [availableSpoons, setAvailableSpoons] = useState<
    DailyCheckIn["availableSpoons"]
  >(checkIn?.availableSpoons ?? 3);
  const [planningMode, setPlanningMode] = useState<PlanningMode>(
    checkIn?.planningMode ?? defaultPlanningMode,
  );
  const [workingBlocks, setWorkingBlocks] = useState<WorkingBlock[]>(
    checkIn?.workingBlocks.length
      ? checkIn.workingBlocks
      : [createBlankBlock(todayDate, defaultStartTime, defaultWorkingBlockMinutes)],
  );
  const [preferLowEnergyTasks, setPreferLowEnergyTasks] = useState(
    checkIn?.preferLowEnergyTasks ?? defaultPreferLowEnergyTasks,
  );
  const [avoidHighEmotionTasks, setAvoidHighEmotionTasks] = useState(
    Boolean(checkIn?.avoidHighEmotionTasks),
  );
  const [protectNotes, setProtectNotes] = useState(checkIn?.protectNotes ?? "");
  const [avoidNotes, setAvoidNotes] = useState(checkIn?.avoidNotes ?? "");
  const [hardStopTime, setHardStopTime] = useState(checkIn?.hardStopTime ?? "");

  function updateWorkingBlock(
    blockId: string,
    updates: Partial<
      Pick<WorkingBlock, "startTime" | "endTime" | "status" | "notes">
    >,
  ) {
    setWorkingBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block,
      ),
    );
  }

  function addWorkingBlock() {
    const lastBlock = workingBlocks.at(-1);
    const nextStartTime = lastBlock?.endTime || defaultStartTime;

    setWorkingBlocks((currentBlocks) => [
      ...currentBlocks,
      createBlankBlock(todayDate, nextStartTime, defaultWorkingBlockMinutes),
    ]);
  }

  function removeWorkingBlock(blockId: string) {
    setWorkingBlocks((currentBlocks) =>
      currentBlocks.flatMap((block) => {
        if (block.id !== blockId) {
          return [block];
        }

        if (block.plannedTaskIds?.length || block.actualSessionIds?.length) {
          return [{ ...block, status: "cancelled" }];
        }

        return [];
      }),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validBlocks = workingBlocks.filter(
      (block) => block.startTime && block.endTime,
    );

    onSave({
      availableSpoons,
      planningMode,
      workingBlocks: validBlocks,
      avoidNotes: avoidNotes.trim() || undefined,
      protectNotes: protectNotes.trim() || undefined,
      preferLowEnergyTasks,
      avoidHighEmotionTasks,
      hardStopTime: hardStopTime || undefined,
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card daily-check-in-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-check-in-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Daily Check-In</p>
            <h2 id="daily-check-in-title">What can today realistically hold?</h2>
          </div>

          <button className="text-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="daily-check-in-form" onSubmit={handleSubmit}>
          <p className="muted-text">
            This is not a promise. It is a starting map.
          </p>

          <div className="daily-check-in-grid">
            <label>
              <span>Available spoons</span>
              <select
                value={availableSpoons}
                onChange={(event) =>
                  setAvailableSpoons(
                    Number(event.target.value) as DailyCheckIn["availableSpoons"],
                  )
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
              <span>Planning mode</span>
              <select
                value={planningMode}
                onChange={(event) =>
                  setPlanningMode(event.target.value as PlanningMode)
                }
              >
                {Object.entries(planningModeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Hard stop</span>
              <input
                type="time"
                value={hardStopTime}
                onChange={(event) => setHardStopTime(event.target.value)}
              />
            </label>
          </div>

          <section className="daily-check-in-blocks">
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">Working blocks</p>
                <h3>Realistic windows</h3>
              </div>
              <button className="text-button" type="button" onClick={addWorkingBlock}>
                + Add block
              </button>
            </div>

            <div className="daily-check-in-block-list">
              {workingBlocks.map((block) => (
                <div key={block.id} className="daily-check-in-block-row">
                  <label>
                    <span>Start</span>
                    <input
                      type="time"
                      value={block.startTime}
                      onChange={(event) =>
                        updateWorkingBlock(block.id, {
                          startTime: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span>End</span>
                    <input
                      type="time"
                      value={block.endTime}
                      onChange={(event) =>
                        updateWorkingBlock(block.id, {
                          endTime: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span>Status</span>
                    <select
                      value={block.status}
                      onChange={(event) =>
                        updateWorkingBlock(block.id, {
                          status: event.target.value as WorkingBlockStatus,
                        })
                      }
                    >
                      {Object.entries(workingBlockStatusLabels).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    <span>Notes</span>
                    <input
                      value={block.notes ?? ""}
                      onChange={(event) =>
                        updateWorkingBlock(block.id, {
                          notes: event.target.value || undefined,
                        })
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <button
                    className="text-button danger-text-button"
                    type="button"
                    onClick={() => removeWorkingBlock(block.id)}
                  >
                    {block.plannedTaskIds?.length || block.actualSessionIds?.length
                      ? "Cancel"
                      : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="daily-check-in-toggle-list">
            <label className="work-log-checkbox-row">
              <input
                type="checkbox"
                checked={preferLowEnergyTasks}
                onChange={(event) => setPreferLowEnergyTasks(event.target.checked)}
              />
              <span>Prefer low-energy tasks</span>
            </label>
            <label className="work-log-checkbox-row">
              <input
                type="checkbox"
                checked={avoidHighEmotionTasks}
                onChange={(event) =>
                  setAvoidHighEmotionTasks(event.target.checked)
                }
              />
              <span>Avoid high-emotion tasks</span>
            </label>
          </div>

          <div className="daily-check-in-notes">
            <label>
              <span>Protect</span>
              <textarea
                value={protectNotes}
                onChange={(event) => setProtectNotes(event.target.value)}
                placeholder="What needs guarding?"
                rows={3}
              />
            </label>
            <label>
              <span>Avoid</span>
              <textarea
                value={avoidNotes}
                onChange={(event) => setAvoidNotes(event.target.value)}
                placeholder="What should not eat the day?"
                rows={3}
              />
            </label>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="soft" onClick={onClose}>
              Skip for now
            </Button>
            <Button type="submit">Save check-in</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
