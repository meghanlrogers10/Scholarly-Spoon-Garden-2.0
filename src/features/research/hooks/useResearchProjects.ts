import { useEffect, useMemo, useState } from "react";
import { researchTaskBlueprints } from "../data/researchTaskBlueprints";
import type {
  NewResearchProjectInput,
  ResearchProject,
  ResearchProjectColor,
  ResearchProjectStatus,
  UpdateResearchProjectInput,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

type SortMode = "updated" | "title" | "focus";

const STORAGE_KEY = "ssg:researchProjects";

const colorCycle: ResearchProjectColor[] = [
  "purple",
  "sky",
  "mint",
  "coral",
  "pink",
  "gold",
];

function getFocusRank(project: ResearchProject) {
  if (project.focusLevel === "primary") return 0;
  if (project.focusLevel === "secondary") return 1;
  return 2;
}

function makeProjectId(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${base || "research-project"}-${Date.now()}`;
}

function loadProjects() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchProject[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveProjects(projects: ResearchProject[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function calculateDueDate(durationMonths: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + durationMonths);
  return date.toISOString().slice(0, 10);
}

export function useResearchProjects() {
  const [projects, setProjects] = useState<ResearchProject[]>(loadProjects);
  const [sortMode, setSortMode] = useState<SortMode>("focus");

  function refreshProjects() {
    setProjects(loadProjects());
  }

  useResearchStorageSync(STORAGE_KEY, refreshProjects);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);


function addProject(input: NewResearchProjectInput) {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const newProject: ResearchProject = {
    id: makeProjectId(input.title),
    title: input.title.trim(),
    shortName: input.shortName.trim() || input.title.trim().slice(0, 6),
    description:
      input.description.trim() ||
      "New research project. Add the next concrete action when ready.",
    focusLevel: input.focusLevel,
    status: "active",
    currentStage: "lit-framing",
    targetJournal: input.targetJournal?.trim() || undefined,
    nextAction: "Clarify the research question and core puzzle.",
    dueDate: calculateDueDate(input.durationMonths),
    startDate: today,
    durationMonths: input.durationMonths,
    createdAt: now,
    updatedAt: today,
    color: colorCycle[projects.length % colorCycle.length],
    taskCount: researchTaskBlueprints.length,
    completedTaskCount: 0,
    literatureCount: 0,
    notesCount: 0,
    journalStatus: "Not submitted",
  };

  setProjects((currentProjects) => {
    const normalizedProjects =
      newProject.focusLevel === "primary"
        ? currentProjects.map((project) =>
            project.focusLevel === "primary"
              ? { ...project, focusLevel: "secondary" as const }
              : project
          )
        : currentProjects;

    return [newProject, ...normalizedProjects];
  });

  return newProject;
}

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sortMode === "title") {
        return a.title.localeCompare(b.title);
      }

      if (sortMode === "updated") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }

      return getFocusRank(a) - getFocusRank(b);
    });
  }, [projects, sortMode]);

function updateProjectFocus(
  projectId: string,
  focusLevel: ResearchProject["focusLevel"]
) {
  const today = new Date().toISOString().slice(0, 10);

  setProjects((currentProjects) => {
    if (focusLevel === "primary") {
      return currentProjects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            focusLevel: "primary",
            status: "active",
            updatedAt: today,
          };
        }

        if (project.focusLevel === "primary") {
          return {
            ...project,
            focusLevel: "secondary",
            updatedAt: today,
          };
        }

        return project;
      });
    }

    return currentProjects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            focusLevel,
            status: "active",
            updatedAt: today,
          }
        : project
    );
  });
}

function updateProject(input: UpdateResearchProjectInput) {
  const today = new Date().toISOString().slice(0, 10);

  setProjects((currentProjects) => {
    const normalizedProjects =
      input.focusLevel === "primary"
        ? currentProjects.map((project) =>
            project.id !== input.id && project.focusLevel === "primary"
              ? {
                  ...project,
                  focusLevel: "secondary" as const,
                  updatedAt: today,
                }
              : project
          )
        : currentProjects;

    return normalizedProjects.map((project) =>
      project.id === input.id
        ? {
            ...project,
            title: input.title.trim(),
            shortName: input.shortName.trim(),
            description: input.description.trim(),
            focusLevel: input.focusLevel,
            currentStage: input.currentStage,
            targetJournal: input.targetJournal?.trim() || undefined,
            nextAction: input.nextAction.trim() || "Define the next action.",
            dueDate: input.dueDate || undefined,
            durationMonths: input.durationMonths,
            updatedAt: today,
          }
        : project
    );
  });
}

function archiveProject(projectId: string) {
  const today = new Date().toISOString().slice(0, 10);

  setProjects((currentProjects) =>
    currentProjects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            status: "archived",
            focusLevel: "paused",
            updatedAt: today,
          }
        : project
    )
  );
}

function deleteProject(projectId: string) {
  const today = new Date().toISOString().slice(0, 10);

  setProjects((currentProjects) =>
    currentProjects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            status: "deleted",
            focusLevel: "paused",
            updatedAt: today,
          }
        : project
    )
  );
}

function restoreProject(projectId: string) {
  const today = new Date().toISOString().slice(0, 10);

  setProjects((currentProjects) =>
    currentProjects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            status: "active",
            focusLevel: "secondary",
            updatedAt: today,
          }
        : project
    )
  );
}

function permanentlyDeleteProject(projectId: string) {
  setProjects((currentProjects) =>
    currentProjects.filter((project) => project.id !== projectId)
  );
}

  function byStatus(status: ResearchProjectStatus) {
    return sortedProjects.filter((project) => project.status === status);
  }

return {
  projects: sortedProjects,
  activeProjects: byStatus("active"),
  archivedProjects: byStatus("archived"),
  deletedProjects: byStatus("deleted"),
  sortMode,
  setSortMode,
  addProject,
  updateProject,
  updateProjectFocus,
  archiveProject,
  deleteProject,
  restoreProject,
  permanentlyDeleteProject,
};
}
