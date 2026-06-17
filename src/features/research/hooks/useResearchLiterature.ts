import { useMemo, useState } from "react";
import type {
  ResearchLiteratureSource,
  ResearchLiteratureSourceInput,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const STORAGE_KEY = "ssg:researchLiteratureSources";

function loadSources() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchLiteratureSource[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveSources(sources: ResearchLiteratureSource[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
}

function createSourceId(projectId: string) {
  const suffix =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${projectId}-source-${suffix}`;
}

export function useResearchLiterature() {
  const [sources, setSources] =
    useState<ResearchLiteratureSource[]>(loadSources);

  function updateSources(
    updater: (currentSources: ResearchLiteratureSource[]) => ResearchLiteratureSource[]
  ) {
    setSources((currentSources) => {
      const updatedSources = updater(currentSources);
      saveSources(updatedSources);
      return updatedSources;
    });
  }

  function refreshSources() {
    setSources(loadSources());
  }

  useResearchStorageSync(STORAGE_KEY, refreshSources);

  const sourcesByProject = useMemo(() => {
    return sources.reduce<Record<string, ResearchLiteratureSource[]>>(
      (groups, source) => {
        if (!groups[source.projectId]) {
          groups[source.projectId] = [];
        }

        groups[source.projectId].push(source);
        return groups;
      },
      {}
    );
  }, [sources]);

  function getSourcesForProject(projectId: string) {
    return [...(sourcesByProject[projectId] ?? [])].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  function createSource(input: ResearchLiteratureSourceInput) {
    const now = new Date().toISOString();

    const newSource: ResearchLiteratureSource = {
      id: createSourceId(input.projectId),
      projectId: input.projectId,
      title: input.title.trim(),
      authors: input.authors?.trim() || undefined,
      year: input.year?.trim() || undefined,
      sourceType: input.sourceType,
      status: input.status,
      link: input.link?.trim() || undefined,
      themes: input.themes,
      keyQuote: input.keyQuote?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      pinned: input.pinned,
      createdAt: now,
      updatedAt: now,
    };

    updateSources((currentSources) => [newSource, ...currentSources]);
  }

  function updateSource(
    sourceId: string,
    input: ResearchLiteratureSourceInput
  ) {
    const now = new Date().toISOString();

    updateSources((currentSources) =>
      currentSources.map((source) =>
        source.id === sourceId
          ? {
              ...source,
              title: input.title.trim(),
              authors: input.authors?.trim() || undefined,
              year: input.year?.trim() || undefined,
              sourceType: input.sourceType,
              status: input.status,
              link: input.link?.trim() || undefined,
              themes: input.themes,
              keyQuote: input.keyQuote?.trim() || undefined,
              notes: input.notes?.trim() || undefined,
              pinned: input.pinned,
              updatedAt: now,
            }
          : source
      )
    );
  }

  function togglePinnedSource(sourceId: string) {
    const now = new Date().toISOString();

    updateSources((currentSources) =>
      currentSources.map((source) =>
        source.id === sourceId
          ? {
              ...source,
              pinned: !source.pinned,
              updatedAt: now,
            }
          : source
      )
    );
  }

  function deleteSource(sourceId: string) {
    updateSources((currentSources) =>
      currentSources.filter((source) => source.id !== sourceId)
    );
  }

  function mergeSources(importedSources: ResearchLiteratureSource[]) {
    updateSources((currentSources) => [...importedSources, ...currentSources]);
  }

  return {
    sources,
    getSourcesForProject,
    createSource,
    updateSource,
    togglePinnedSource,
    deleteSource,
    mergeSources,
    refreshSources,
  };
}
