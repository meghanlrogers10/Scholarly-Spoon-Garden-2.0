import type { MindspaceGoal, MindspaceItem } from "../types";

export const sampleMindspaceItems: MindspaceItem[] = [
  {
    id: "mind-1",
    title: "The thing I keep re-arguing in my head",
    body: "Decide whether this needs action or a safe parking place.",
    kind: "avoidance",
    status: "inbox",
    area: "service",
    emotionalWeight: 4,
    nextAction: "Name the actual decision before doing anything else.",
    createdAt: "2026-06-02T09:00:00.000Z",
    updatedAt: "2026-06-02T09:00:00.000Z",
  },
  {
    id: "mind-2",
    title: "SCD bigger picture idea",
    body: "Connect the paper goal to the long-term theory identity.",
    kind: "idea",
    status: "clarify-later",
    area: "research",
    emotionalWeight: 2,
    tinyStep: "Add one sentence to the theory memo.",
    createdAt: "2026-06-02T09:00:00.000Z",
    updatedAt: "2026-06-02T09:00:00.000Z",
  },
];

export const sampleGoals: MindspaceGoal[] = [
  {
    id: "goal-1",
    title: "Submit the SCD theory paper",
    description: "A coherent submitted manuscript, not a perfect monument.",
    horizon: "semester",
    status: "active",
    nextAction: "Open the theory section.",
    tinyStep: "Revise one definition sentence.",
    createdAt: "2026-06-02T09:00:00.000Z",
    updatedAt: "2026-06-02T09:00:00.000Z",
  },
];
