import type { ResearchProject, ResearchStageKey, ResearchTask } from "../types";

type ResearchTaskBlueprint = {
  title: string;
  stageKey: ResearchStageKey;
  priority: "low" | "medium" | "high";
  spoonCost: 1 | 2 | 3 | 4 | 5;
  timelinePercent: number;
};

export const researchTaskBlueprints: ResearchTaskBlueprint[] = [
  {
    title: "Clarify the research question and core puzzle",
    stageKey: "lit-framing",
    priority: "high",
    spoonCost: 2,
    timelinePercent: 0.08,
  },
  {
    title: "Build or clean the core literature list",
    stageKey: "lit-framing",
    priority: "medium",
    spoonCost: 3,
    timelinePercent: 0.16,
  },
  {
    title: "Draft literature and theory argument",
    stageKey: "lit-theory-draft",
    priority: "high",
    spoonCost: 4,
    timelinePercent: 0.28,
  },
  {
    title: "Finalize data and analysis plan",
    stageKey: "data-analyses",
    priority: "high",
    spoonCost: 4,
    timelinePercent: 0.4,
  },
  {
    title: "Draft methods section",
    stageKey: "methods-draft",
    priority: "medium",
    spoonCost: 3,
    timelinePercent: 0.52,
  },
  {
    title: "Draft results section",
    stageKey: "results-draft",
    priority: "high",
    spoonCost: 4,
    timelinePercent: 0.64,
  },
  {
    title: "Draft discussion and contribution section",
    stageKey: "discussion-draft",
    priority: "high",
    spoonCost: 4,
    timelinePercent: 0.76,
  },
  {
    title: "Do structural revision pass",
    stageKey: "structural-revision",
    priority: "high",
    spoonCost: 5,
    timelinePercent: 0.86,
  },
  {
    title: "Do line edit and citation cleanup",
    stageKey: "line-edit",
    priority: "medium",
    spoonCost: 3,
    timelinePercent: 0.94,
  },
  {
    title: "Prepare submission files",
    stageKey: "submission-prep",
    priority: "high",
    spoonCost: 3,
    timelinePercent: 1,
  },
];

function makeTaskId(projectId: string, index: number) {
  return `${projectId}-task-${index + 1}-${Date.now()}`;
}

function getDateAtTimelinePercent(project: ResearchProject, timelinePercent: number) {
  const start = project.startDate ? new Date(project.startDate) : new Date();
  const end = project.dueDate ? new Date(project.dueDate) : new Date(start);

  if (!project.dueDate) {
    end.setMonth(end.getMonth() + (project.durationMonths ?? 6));
  }

  const startTime = start.getTime();
  const endTime = end.getTime();
  const targetTime = startTime + (endTime - startTime) * timelinePercent;

  return new Date(targetTime).toISOString().slice(0, 10);
}

export function generateResearchPipelineTasks(
  project: ResearchProject
): ResearchTask[] {
  const now = new Date().toISOString();

  return researchTaskBlueprints.map((blueprint, index) => ({
    id: makeTaskId(project.id, index),
    projectId: project.id,
    title: blueprint.title,
    stageKey: blueprint.stageKey,
    status: "todo",
    priority: blueprint.priority,
    spoonCost: blueprint.spoonCost,
    dueDate: getDateAtTimelinePercent(project, blueprint.timelinePercent),
    createdAt: now,
    updatedAt: now,
  }));
}