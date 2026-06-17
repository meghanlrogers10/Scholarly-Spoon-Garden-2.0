import { useMemo, useState } from "react";
import type {
  ResearchLiteratureNote,
  ResearchLiteratureNoteInput,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const STORAGE_KEY = "ssg:researchLiteratureNotes";

function loadNotes() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchLiteratureNote[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveNotes(notes: ResearchLiteratureNote[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function useResearchLiteratureNotes() {
  const [notes, setNotes] = useState<ResearchLiteratureNote[]>(loadNotes);

  function updateNotes(
    updater: (
      currentNotes: ResearchLiteratureNote[]
    ) => ResearchLiteratureNote[]
  ) {
    setNotes((currentNotes) => {
      const updatedNotes = updater(currentNotes);
      saveNotes(updatedNotes);
      return updatedNotes;
    });
  }

  function refreshNotes() {
    setNotes(loadNotes());
  }

  useResearchStorageSync(STORAGE_KEY, refreshNotes);

  const notesByProject = useMemo(() => {
    return notes.reduce<Record<string, ResearchLiteratureNote[]>>(
      (groups, note) => {
        if (!groups[note.projectId]) {
          groups[note.projectId] = [];
        }

        groups[note.projectId].push(note);
        return groups;
      },
      {}
    );
  }, [notes]);

  function sortNotes(noteList: ResearchLiteratureNote[]) {
    return [...noteList].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  function getNotesForProject(projectId: string) {
    return sortNotes(notesByProject[projectId] ?? []);
  }

  function getNotesForSource(sourceId: string) {
    return sortNotes(notes.filter((note) => note.sourceId === sourceId));
  }

  function createNote(input: ResearchLiteratureNoteInput) {
    const now = new Date().toISOString();

    const newNote: ResearchLiteratureNote = {
      id: `${input.projectId}-lit-note-${Date.now()}`,
      projectId: input.projectId,
      sourceId: input.sourceId || undefined,
      sourceTitle: input.sourceTitle?.trim() || undefined,
      noteKind: input.noteKind,
      title: input.title.trim(),
      body: input.body.trim() || "No details added yet.",
      themes: input.themes,
      keyQuote: input.keyQuote?.trim() || undefined,
      argumentSlot: input.argumentSlot?.trim() || undefined,
      pinned: input.pinned,
      createdAt: now,
      updatedAt: now,
    };

    updateNotes((currentNotes) => [newNote, ...currentNotes]);
  }

  function updateNote(noteId: string, input: ResearchLiteratureNoteInput) {
    const now = new Date().toISOString();

    updateNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              sourceId: input.sourceId || undefined,
              sourceTitle: input.sourceTitle?.trim() || undefined,
              noteKind: input.noteKind,
              title: input.title.trim(),
              body: input.body.trim() || "No details added yet.",
              themes: input.themes,
              keyQuote: input.keyQuote?.trim() || undefined,
              argumentSlot: input.argumentSlot?.trim() || undefined,
              pinned: input.pinned,
              updatedAt: now,
            }
          : note
      )
    );
  }

  function togglePinnedNote(noteId: string) {
    const now = new Date().toISOString();

    updateNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              pinned: !note.pinned,
              updatedAt: now,
            }
          : note
      )
    );
  }

  function deleteNote(noteId: string) {
    updateNotes((currentNotes) =>
      currentNotes.filter((note) => note.id !== noteId)
    );
  }

  function mergeNotes(importedNotes: ResearchLiteratureNote[]) {
    updateNotes((currentNotes) => [...importedNotes, ...currentNotes]);
  }

  return {
    notes,
    getNotesForProject,
    getNotesForSource,
    createNote,
    updateNote,
    togglePinnedNote,
    deleteNote,
    mergeNotes,
    refreshNotes,
  };
}
