import { useMemo, useState } from "react";
import type {
  ResearchLiteratureReadingNote,
  ResearchLiteratureReadingNoteInput,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const STORAGE_KEY = "ssg:researchLiteratureReadingNotes";

function loadReadingNotes() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchLiteratureReadingNote[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveReadingNotes(notes: ResearchLiteratureReadingNote[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function useResearchLiteratureReadingNotes() {
  const [readingNotes, setReadingNotes] =
    useState<ResearchLiteratureReadingNote[]>(loadReadingNotes);

  function updateReadingNotes(
    updater: (
      currentNotes: ResearchLiteratureReadingNote[]
    ) => ResearchLiteratureReadingNote[]
  ) {
    setReadingNotes((currentNotes) => {
      const updatedNotes = updater(currentNotes);
      saveReadingNotes(updatedNotes);
      return updatedNotes;
    });
  }

  function refreshReadingNotes() {
    setReadingNotes(loadReadingNotes());
  }

  useResearchStorageSync(STORAGE_KEY, refreshReadingNotes);

  const notesByProject = useMemo(() => {
    return readingNotes.reduce<Record<string, ResearchLiteratureReadingNote[]>>(
      (groups, note) => {
        if (!groups[note.projectId]) {
          groups[note.projectId] = [];
        }

        groups[note.projectId].push(note);
        return groups;
      },
      {}
    );
  }, [readingNotes]);

  function sortReadingNotes(noteList: ResearchLiteratureReadingNote[]) {
    return [...noteList].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  function getReadingNotesForProject(projectId: string) {
    return sortReadingNotes(notesByProject[projectId] ?? []);
  }

  function getReadingNoteForSource(sourceId: string) {
    return readingNotes.find((note) => note.sourceId === sourceId);
  }

  function upsertReadingNote(input: ResearchLiteratureReadingNoteInput) {
    const now = new Date().toISOString();

    updateReadingNotes((currentNotes) => {
      const existingNote = currentNotes.find(
        (note) =>
          note.projectId === input.projectId && note.sourceId === input.sourceId
      );

      if (!existingNote) {
        const newNote: ResearchLiteratureReadingNote = {
          id: `${input.projectId}-reading-note-${input.sourceId}-${Date.now()}`,
          projectId: input.projectId,
          sourceId: input.sourceId,
          sourceTitle: input.sourceTitle,
          sections: input.sections,
          body: input.body?.trim() || undefined,
          extractedThemes: input.extractedThemes,
          manualThemes: input.manualThemes,
          pinned: input.pinned ?? false,
          createdAt: now,
          updatedAt: now,
        };

        return [newNote, ...currentNotes];
      }

      return currentNotes.map((note) =>
        note.id === existingNote.id
          ? {
              ...note,
              sourceTitle: input.sourceTitle,
              sections: input.sections,
              body: input.body?.trim() || undefined,
              extractedThemes: input.extractedThemes,
              manualThemes: input.manualThemes,
              pinned: input.pinned ?? note.pinned,
              updatedAt: now,
            }
          : note
      );
    });
  }

  function mergeReadingNotes(importedNotes: ResearchLiteratureReadingNote[]) {
    updateReadingNotes((currentNotes) => [...importedNotes, ...currentNotes]);
  }

  return {
    readingNotes,
    getReadingNotesForProject,
    getReadingNoteForSource,
    upsertReadingNote,
    mergeReadingNotes,
    refreshReadingNotes,
  };
}
