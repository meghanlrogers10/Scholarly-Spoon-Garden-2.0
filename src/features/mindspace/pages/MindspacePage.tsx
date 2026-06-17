import { useMemo, useState } from "react";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import type { Task, TaskArea } from "../../../shared/types/task";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useMindspace } from "../hooks/useMindspace";
import type {
  GoalTimeHorizon,
  MindspaceGoal,
  MindspaceItem,
  MindspaceItemArea,
  MindspaceItemKind,
} from "../types";
import "./mindspace.css";

const itemKinds: Array<{ value: MindspaceItemKind; label: string }> = [
  { value: "thought", label: "Thought" },
  { value: "worry", label: "Worry" },
  { value: "idea", label: "Idea" },
  { value: "reminder", label: "Reminder" },
  { value: "question", label: "Question" },
  { value: "goal-seed", label: "Goal seed" },
  { value: "avoidance", label: "Avoidance" },
  { value: "other", label: "Other" },
];

const itemAreas: Array<{ value: MindspaceItemArea; label: string }> = [
  { value: "research", label: "Research" },
  { value: "teaching", label: "Teaching" },
  { value: "service", label: "Service" },
  { value: "personal", label: "Personal" },
  { value: "mindspace", label: "Mindspace" },
  { value: "other", label: "Other" },
];

const goalHorizons: Array<{ value: GoalTimeHorizon; label: string }> = [
  { value: "long-term", label: "Long-term" },
  { value: "semester", label: "Semester" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
];

function mapMindspaceAreaToTaskArea(area: MindspaceItemArea): TaskArea {
  if (area === "research") return "Research";
  if (area === "teaching") return "Teaching";
  if (area === "service") return "Service";
  if (area === "personal") return "Personal";
  return "Other";
}

function getSpoonCost(item: MindspaceItem): Task["spoonCost"] {
  if (!item.emotionalWeight || item.emotionalWeight <= 1) return 1;
  if (item.emotionalWeight === 2) return 2;
  if (item.emotionalWeight === 3) return 3;
  if (item.emotionalWeight === 4) return 4;
  return 5;
}

function getDaysOld(dateString: string) {
  const createdAt = new Date(dateString);

  if (Number.isNaN(createdAt.getTime())) {
    return 0;
  }

  return Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
}

function isAvoidanceRadarItem(item: MindspaceItem) {
  const isOpen = item.status === "inbox" || item.status === "clarify-later";

  return (
    isOpen &&
    ((getDaysOld(item.lastTouchedAt ?? item.createdAt) >= 7 && !item.nextAction) ||
      (item.emotionalWeight ?? 0) >= 4 ||
      !item.tinyStep)
  );
}

function createTaskFromMindspaceItem(item: MindspaceItem): Task {
  const now = new Date().toISOString();
  const title = item.nextAction || item.tinyStep || item.title;

  return {
    id: crypto.randomUUID(),
    title,
    area: mapMindspaceAreaToTaskArea(item.area),
    spoonCost: getSpoonCost(item),
    priority: (item.emotionalWeight ?? 0) >= 4 ? "High" : "Medium",
    status: "todo",
    today: false,
    notes: [
      item.body,
      item.tinyStep ? `Tiny step: ${item.tinyStep}` : undefined,
      item.emotionalWeight ? `Emotional weight: ${item.emotionalWeight}/5` : undefined,
      `[source:mindspace-item:${item.id}]`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    source: "mindspace-item",
    sourceId: item.id,
    taskType: "mindspace",
    nextAction: item.nextAction || item.tinyStep,
    lowEnergyFriendly: item.lowEnergyFriendly,
    estimatedMinutes: item.tinyStep ? 15 : 20,
    estimateSource: "default",
    createdAt: now,
    updatedAt: now,
  };
}

function createTaskFromGoal(goal: MindspaceGoal): Task {
  const now = new Date().toISOString();
  const title = goal.tinyStep || goal.nextAction || goal.title;

  return {
    id: crypto.randomUUID(),
    title,
    area: "Other",
    spoonCost: goal.tinyStep ? 1 : 2,
    priority: "Medium",
    status: "todo",
    today: false,
    notes: [
      `Goal: ${goal.title}`,
      goal.description,
      goal.tinyStep ? `Tiny step: ${goal.tinyStep}` : undefined,
      `[source:mindspace-item:${goal.id}]`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    source: "mindspace-item",
    sourceId: goal.id,
    taskType: "mindspace",
    nextAction: goal.nextAction || goal.tinyStep,
    lowEnergyFriendly: Boolean(goal.tinyStep),
    estimatedMinutes: goal.tinyStep ? 15 : 20,
    estimateSource: "default",
    createdAt: now,
    updatedAt: now,
  };
}

export function MindspacePage() {
  const {
    items,
    goals,
    addBrainDumpItem,
    updateItem,
    releaseItem,
    archiveItem,
    moveItemToClarifyLater,
    markItemConverted,
    addGoal,
    updateGoal,
    archiveGoal,
  } = useMindspace();
  const { tasks, updateTasks } = useTaskBridge();
  const [brainTitle, setBrainTitle] = useState("");
  const [brainBody, setBrainBody] = useState("");
  const [brainKind, setBrainKind] = useState<MindspaceItemKind>("thought");
  const [brainArea, setBrainArea] = useState<MindspaceItemArea>("mindspace");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalHorizon, setGoalHorizon] = useState<GoalTimeHorizon>("week");
  const [parentGoalId, setParentGoalId] = useState("");
  const [goalNextAction, setGoalNextAction] = useState("");
  const [goalTinyStep, setGoalTinyStep] = useState("");

  const activeItems = items.filter(
    (item) => item.status === "inbox" || item.status === "clarify-later",
  );
  const convertedItems = items.filter((item) => item.status === "converted");
  const radarItems = activeItems.filter(isAvoidanceRadarItem);
  const activeGoals = goals.filter((goal) => goal.status !== "archived");
  const taskBySourceId = useMemo(
    () =>
      new Map(
        tasks
          .filter((task) => task.source === "mindspace-item" && task.sourceId)
          .map((task) => [task.sourceId!, task]),
      ),
    [tasks],
  );

  function handleParkIt() {
    const title = brainTitle.trim();

    if (!title) {
      return;
    }

    addBrainDumpItem({
      title,
      body: brainBody.trim() || undefined,
      kind: brainKind,
      area: brainArea,
    });
    setBrainTitle("");
    setBrainBody("");
    setBrainKind("thought");
    setBrainArea("mindspace");
  }

  function handleConvertItemToTask(item: MindspaceItem) {
    if (item.convertedToType === "task" && item.convertedToId) {
      return;
    }

    const existingTask = taskBySourceId.get(item.id);

    if (existingTask) {
      markItemConverted(item.id, "task", existingTask.id);
      return;
    }

    const newTask = createTaskFromMindspaceItem(item);
    updateTasks((currentTasks) => [newTask, ...currentTasks]);
    markItemConverted(item.id, "task", newTask.id);
  }

  function handleCreateGoal() {
    const title = goalTitle.trim();

    if (!title) {
      return;
    }

    addGoal({
      title,
      description: goalDescription.trim() || undefined,
      horizon: goalHorizon,
      parentGoalId: parentGoalId || undefined,
      nextAction: goalNextAction.trim() || undefined,
      tinyStep: goalTinyStep.trim() || undefined,
    });
    setGoalTitle("");
    setGoalDescription("");
    setGoalHorizon("week");
    setParentGoalId("");
    setGoalNextAction("");
    setGoalTinyStep("");
  }

  function handleMakeGoalTask(goal: MindspaceGoal) {
    const existingTask = taskBySourceId.get(goal.id);

    if (existingTask) {
      updateGoal(goal.id, {
        linkedTaskIds: Array.from(
          new Set([...(goal.linkedTaskIds ?? []), existingTask.id]),
        ),
      });
      return;
    }

    const newTask = createTaskFromGoal(goal);
    updateTasks((currentTasks) => [newTask, ...currentTasks]);
    updateGoal(goal.id, {
      linkedTaskIds: Array.from(new Set([...(goal.linkedTaskIds ?? []), newTask.id])),
    });
  }

  return (
    <section className="page-stack mindspace-page">
      <PageHeader
        eyebrow="Mindspace"
        title="Park it here. You do not have to solve it yet."
        description="Capture, clarify, convert, or release mental clutter without turning it into a giant journal."
        className="mindspace-hero"
      />

      <div className="mindspace-overview-grid">
        <Card className="mindspace-capture-card">
          <div className="mindspace-section-heading">
            <p className="eyebrow">Brain dump</p>
            <h2>What is taking up space?</h2>
            <p className="muted-text">
              Dump it first. Decide what it is later.
            </p>
          </div>

          <label className="mindspace-field">
            <span>Title</span>
            <input
              value={brainTitle}
              onChange={(event) => setBrainTitle(event.target.value)}
              placeholder="The thing currently taking up mental rent"
            />
          </label>

          <label className="mindspace-field">
            <span>Optional context</span>
            <textarea
              className="mindspace-textarea"
              value={brainBody}
              onChange={(event) => setBrainBody(event.target.value)}
              placeholder="Park the details here. They do not need to be tidy."
            />
          </label>

          <div className="mindspace-form-grid">
            <label className="mindspace-field">
              <span>Kind</span>
              <select
                value={brainKind}
                onChange={(event) =>
                  setBrainKind(event.target.value as MindspaceItemKind)
                }
              >
                {itemKinds.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mindspace-field">
              <span>Area</span>
              <select
                value={brainArea}
                onChange={(event) =>
                  setBrainArea(event.target.value as MindspaceItemArea)
                }
              >
                {itemAreas.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mindspace-action-row">
            <Button type="button" onClick={handleParkIt}>
              Park it
            </Button>
          </div>
        </Card>

        <Card className="mindspace-checkin-card">
          <p className="eyebrow">Mindspace signal</p>
          <div className="mindspace-stat-list">
            <div>
              <strong>{activeItems.length}</strong>
              <span>clarify-later items</span>
            </div>
            <div>
              <strong>{radarItems.length}</strong>
              <span>avoidance radar</span>
            </div>
            <div>
              <strong>{convertedItems.length}</strong>
              <span>converted</span>
            </div>
          </div>
          <p className="muted-text">
            Not everything deserves today-energy.
          </p>
        </Card>
      </div>

      <div className="mindspace-two-column">
        <section className="page-stack">
          <div className="mindspace-section-heading">
            <p className="eyebrow">Clarify later</p>
            <h2>Make this actionable</h2>
          </div>

          <div className="mindspace-item-list">
            {activeItems.length === 0 ? (
              <Card className="mindspace-tool-card">
                <p className="muted-text">
                  Nothing is parked right now. A rare quiet shelf.
                </p>
              </Card>
            ) : (
              activeItems.map((item) => (
                <article
                  key={item.id}
                  className={`mindspace-item-card mindspace-area-${item.area}`}
                >
                  <div className="mindspace-item-header">
                    <div>
                      <p className="mindspace-kicker">{item.kind}</p>
                      <h3>{item.title}</h3>
                    </div>
                    <span className="mindspace-status-pill">{item.status}</span>
                  </div>

                  {item.body ? <p className="muted-text">{item.body}</p> : null}

                  <div className="mindspace-form-grid">
                    <label className="mindspace-field">
                      <span>Next action</span>
                      <input
                        defaultValue={item.nextAction}
                        onBlur={(event) =>
                          updateItem(item.id, {
                            nextAction: event.currentTarget.value.trim() || undefined,
                          })
                        }
                      />
                    </label>

                    <label className="mindspace-field">
                      <span>Tiny next move</span>
                      <input
                        defaultValue={item.tinyStep}
                        onBlur={(event) =>
                          updateItem(item.id, {
                            tinyStep: event.currentTarget.value.trim() || undefined,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="mindspace-form-grid">
                    <label className="mindspace-field">
                      <span>Emotional weight</span>
                      <select
                        value={item.emotionalWeight ?? ""}
                        onChange={(event) =>
                          updateItem(item.id, {
                            emotionalWeight: event.target.value
                              ? (Number(event.target.value) as MindspaceItem["emotionalWeight"])
                              : undefined,
                          })
                        }
                      >
                        <option value="">Not set</option>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="mindspace-checkbox-row">
                      <input
                        type="checkbox"
                        checked={Boolean(item.lowEnergyFriendly)}
                        onChange={(event) =>
                          updateItem(item.id, {
                            lowEnergyFriendly: event.currentTarget.checked,
                          })
                        }
                      />
                      <span>Low-energy friendly</span>
                    </label>
                  </div>

                  <div className="mindspace-action-row">
                    <Button
                      type="button"
                      onClick={() => handleConvertItemToTask(item)}
                      disabled={item.convertedToType === "task"}
                    >
                      {item.convertedToType === "task"
                        ? "Converted"
                        : "Convert to task"}
                    </Button>
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => moveItemToClarifyLater(item.id)}
                    >
                      Clarify later
                    </Button>
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => releaseItem(item.id)}
                    >
                      Release
                    </Button>
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => archiveItem(item.id)}
                    >
                      Archive
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="page-stack">
          <div className="mindspace-section-heading">
            <p className="eyebrow">Avoidance radar</p>
            <h2>Still real, too vague, or safe to release?</h2>
          </div>

          <div className="mindspace-item-list">
            {radarItems.length === 0 ? (
              <Card className="mindspace-tool-card">
                <p className="muted-text">No avoidance flags right now.</p>
              </Card>
            ) : (
              radarItems.map((item) => (
                <Card key={item.id} className="mindspace-tool-card">
                  <p className="mindspace-kicker">
                    {getDaysOld(item.lastTouchedAt ?? item.createdAt)} days old ·
                    load {item.emotionalWeight ?? "?"}/5
                  </p>
                  <h2>{item.title}</h2>
                  <p className="muted-text">
                    Still real, too vague, emotionally expensive, or safe to
                    release?
                  </p>
                  <div className="mindspace-action-row">
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => moveItemToClarifyLater(item.id)}
                    >
                      Clarify later
                    </Button>
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => releaseItem(item.id)}
                    >
                      Release
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mindspace-two-column">
        <Card className="mindspace-tool-card">
          <div className="mindspace-section-heading">
            <p className="eyebrow">Goals</p>
            <h2>Long-term to tiny next move</h2>
          </div>

          <label className="mindspace-field">
            <span>Goal title</span>
            <input
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
              placeholder="A goal with a humane next move"
            />
          </label>

          <label className="mindspace-field">
            <span>Description</span>
            <textarea
              value={goalDescription}
              onChange={(event) => setGoalDescription(event.target.value)}
              rows={2}
            />
          </label>

          <div className="mindspace-form-grid">
            <label className="mindspace-field">
              <span>Horizon</span>
              <select
                value={goalHorizon}
                onChange={(event) =>
                  setGoalHorizon(event.target.value as GoalTimeHorizon)
                }
              >
                {goalHorizons.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mindspace-field">
              <span>Parent goal</span>
              <select
                value={parentGoalId}
                onChange={(event) => setParentGoalId(event.target.value)}
              >
                <option value="">None</option>
                {activeGoals
                  .filter((goal) => goal.horizon === "long-term")
                  .map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="mindspace-form-grid">
            <label className="mindspace-field">
              <span>Next action</span>
              <input
                value={goalNextAction}
                onChange={(event) => setGoalNextAction(event.target.value)}
              />
            </label>

            <label className="mindspace-field">
              <span>Tiny step</span>
              <input
                value={goalTinyStep}
                onChange={(event) => setGoalTinyStep(event.target.value)}
              />
            </label>
          </div>

          <div className="mindspace-action-row">
            <Button type="button" onClick={handleCreateGoal}>
              Add goal
            </Button>
          </div>
        </Card>

        <section className="page-stack">
          <div className="mindspace-section-heading">
            <p className="eyebrow">Goal ladder</p>
            <h2>Progress without perfection</h2>
          </div>

          <div className="mindspace-item-list">
            {activeGoals.length === 0 ? (
              <Card className="mindspace-tool-card">
                <p className="muted-text">No goals yet. A seed is enough.</p>
              </Card>
            ) : (
              activeGoals.map((goal) => (
                <article key={goal.id} className="goal-ladder-card">
                  <div className="mindspace-item-header">
                    <div>
                      <p className="mindspace-kicker">{goal.horizon} goal</p>
                      <h3>{goal.title}</h3>
                    </div>
                    <span className="mindspace-status-pill">{goal.status}</span>
                  </div>

                  {goal.description ? (
                    <p className="muted-text">{goal.description}</p>
                  ) : null}

                  <div className="goal-ladder-grid">
                    <label className="mindspace-field">
                      <span>Next action</span>
                      <input
                        defaultValue={goal.nextAction}
                        onBlur={(event) =>
                          updateGoal(goal.id, {
                            nextAction: event.currentTarget.value.trim() || undefined,
                          })
                        }
                      />
                    </label>
                    <label className="mindspace-field">
                      <span>Tiny step</span>
                      <input
                        defaultValue={goal.tinyStep}
                        onBlur={(event) =>
                          updateGoal(goal.id, {
                            tinyStep: event.currentTarget.value.trim() || undefined,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="mindspace-action-row">
                    <Button type="button" onClick={() => handleMakeGoalTask(goal)}>
                      Make tiny task
                    </Button>
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => updateGoal(goal.id, { status: "paused" })}
                    >
                      Pause
                    </Button>
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => archiveGoal(goal.id)}
                    >
                      Archive
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
