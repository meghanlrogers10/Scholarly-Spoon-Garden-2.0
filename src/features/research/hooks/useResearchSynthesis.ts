import { useMemo, useState } from "react";
import type {
  ResearchSynthesisSection,
  ResearchSynthesisSectionInput,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const STORAGE_KEY = "ssg:researchSynthesisSections";

function loadSections() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchSynthesisSection[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveSections(sections: ResearchSynthesisSection[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

export function useResearchSynthesis() {
  const [sections, setSections] =
    useState<ResearchSynthesisSection[]>(loadSections);

  function updateSections(
    updater: (
      currentSections: ResearchSynthesisSection[]
    ) => ResearchSynthesisSection[]
  ) {
    setSections((currentSections) => {
      const updatedSections = updater(currentSections);
      saveSections(updatedSections);
      return updatedSections;
    });
  }

  function refreshSections() {
    setSections(loadSections());
  }

  useResearchStorageSync(STORAGE_KEY, refreshSections);

  const sectionsByProject = useMemo(() => {
    return sections.reduce<Record<string, ResearchSynthesisSection[]>>(
      (groups, section) => {
        if (!groups[section.projectId]) {
          groups[section.projectId] = [];
        }

        groups[section.projectId].push(section);
        return groups;
      },
      {}
    );
  }, [sections]);

  function sortSections(sectionList: ResearchSynthesisSection[]) {
    return [...sectionList].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  function getSectionsForProject(projectId: string) {
    return sortSections(sectionsByProject[projectId] ?? []);
  }

  function createSection(input: ResearchSynthesisSectionInput) {
    const now = new Date().toISOString();

    const newSection: ResearchSynthesisSection = {
      id: `${input.projectId}-synthesis-section-${Date.now()}`,
      projectId: input.projectId,
      title: input.title.trim(),
      claim: input.claim.trim(),
      themes: input.themes,
      linkedSourceIds: input.linkedSourceIds,
      linkedNoteIds: input.linkedNoteIds,
      draftNote: input.draftNote?.trim() || undefined,
      status: input.status,
      pinned: input.pinned,
      createdAt: now,
      updatedAt: now,
    };

    updateSections((currentSections) => [newSection, ...currentSections]);
  }

  function updateSection(
    sectionId: string,
    input: ResearchSynthesisSectionInput
  ) {
    const now = new Date().toISOString();

    updateSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              title: input.title.trim(),
              claim: input.claim.trim(),
              themes: input.themes,
              linkedSourceIds: input.linkedSourceIds,
              linkedNoteIds: input.linkedNoteIds,
              draftNote: input.draftNote?.trim() || undefined,
              status: input.status,
              pinned: input.pinned,
              updatedAt: now,
            }
          : section
      )
    );
  }

  function togglePinnedSection(sectionId: string) {
    const now = new Date().toISOString();

    updateSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              pinned: !section.pinned,
              updatedAt: now,
            }
          : section
      )
    );
  }

  function deleteSection(sectionId: string) {
    updateSections((currentSections) =>
      currentSections.filter((section) => section.id !== sectionId)
    );
  }

  function mergeSections(importedSections: ResearchSynthesisSection[]) {
    updateSections((currentSections) => [
      ...importedSections,
      ...currentSections,
    ]);
  }

  return {
    sections,
    getSectionsForProject,
    createSection,
    updateSection,
    togglePinnedSection,
    deleteSection,
    mergeSections,
    refreshSections,
  };
}
