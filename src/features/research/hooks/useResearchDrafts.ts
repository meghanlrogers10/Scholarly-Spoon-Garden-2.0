import { useMemo, useState } from "react";
import type {
  ResearchDraft,
  ResearchDraftInput,
  ResearchDraftStatus,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const STORAGE_KEY = "ssg:researchDrafts";

function normalizeDraftStatus(status: string): ResearchDraftStatus {
  if (status === "in-progress") {
    return "drafting";
  }

  if (status === "needs-revision") {
    return "revising";
  }

  if (status === "complete") {
    return "done";
  }

  if (
    [
      "not-started",
      "sketching",
      "drafting",
      "revising",
      "waiting",
      "done",
      "parked",
    ].includes(status)
  ) {
    return status as ResearchDraftStatus;
  }

  return "drafting";
}

function normalizeDraft(draft: ResearchDraft): ResearchDraft {
  return {
    ...draft,
    status: normalizeDraftStatus(draft.status),
  };
}

function loadDrafts() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchDraft[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeDraft);
  } catch {
    return [];
  }
}

function saveDrafts(drafts: ResearchDraft[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

function createDraftId(projectId: string) {
  const suffix =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${projectId}-draft-${suffix}`;
}

function getDraftFields(input: ResearchDraftInput) {
  return {
    title: input.title.trim(),
    section: input.section.trim(),
    status: input.status,
    link: input.link?.trim() || undefined,
    versionLabel: input.versionLabel?.trim() || undefined,
    versionNotes: input.versionNotes?.trim() || undefined,
    lastWorkedAt: input.lastWorkedAt || undefined,
    whereLeftOff: input.whereLeftOff?.trim() || undefined,
    nextWritingMove: input.nextWritingMove?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    pinned: input.pinned,
  };
}

export function useResearchDrafts() {
  const [drafts, setDrafts] = useState<ResearchDraft[]>(loadDrafts);

  function updateDrafts(
    updater: (currentDrafts: ResearchDraft[]) => ResearchDraft[]
  ) {
    setDrafts((currentDrafts) => {
      const updatedDrafts = updater(currentDrafts);
      saveDrafts(updatedDrafts);
      return updatedDrafts;
    });
  }

  function refreshDrafts() {
    setDrafts(loadDrafts());
  }

  useResearchStorageSync(STORAGE_KEY, refreshDrafts);

  const draftsByProject = useMemo(() => {
    return drafts.reduce<Record<string, ResearchDraft[]>>((groups, draft) => {
      if (!groups[draft.projectId]) {
        groups[draft.projectId] = [];
      }

      groups[draft.projectId].push(draft);
      return groups;
    }, {});
  }, [drafts]);

  function getDraftsForProject(projectId: string) {
    return [...(draftsByProject[projectId] ?? [])].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  function createDraft(input: ResearchDraftInput) {
    const now = new Date().toISOString();

    const newDraft: ResearchDraft = {
      id: createDraftId(input.projectId),
      projectId: input.projectId,
      ...getDraftFields(input),
      createdAt: now,
      updatedAt: now,
    };

    updateDrafts((currentDrafts) => [newDraft, ...currentDrafts]);
  }

  function updateDraft(draftId: string, input: ResearchDraftInput) {
    const now = new Date().toISOString();

    updateDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              ...getDraftFields(input),
              updatedAt: now,
            }
          : draft
      )
    );
  }

  function togglePinnedDraft(draftId: string) {
    const now = new Date().toISOString();

    updateDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              pinned: !draft.pinned,
              updatedAt: now,
            }
          : draft
      )
    );
  }

  function deleteDraft(draftId: string) {
    updateDrafts((currentDrafts) =>
      currentDrafts.filter((draft) => draft.id !== draftId)
    );
  }

  return {
    drafts,
    getDraftsForProject,
    createDraft,
    updateDraft,
    togglePinnedDraft,
    deleteDraft,
    refreshDrafts,
  };
}
