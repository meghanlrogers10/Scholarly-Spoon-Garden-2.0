import { useMemo, useState } from "react";
import type {
  ResearchLogEntry,
  ResearchLogEntryInput,
  ResearchLogEntryType,
  ResearchResultBlock,
  ResearchResultBlockType,
  ResearchResultOutputType,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

// Research log entries stay local-first. Manual cloud sync skips oversized
// records rather than stripping large pasted outputs or image data.
const STORAGE_KEY = "ssg:researchLogEntries";
const validEntryTypes: ResearchLogEntryType[] = [
  "progress",
  "decision",
  "blocker",
  "idea",
  "next-action",
  "results",
];
const validOutputTypes: ResearchResultOutputType[] = [
  "stata",
  "excel-table",
  "figure",
  "model",
  "text",
  "mixed",
];
const validResultBlockTypes: ResearchResultBlockType[] = [
  "stata",
  "excel-table",
  "image",
  "note",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeResultBlock(
  value: unknown,
  entryId: string,
  index: number,
  fallbackDate: string
): ResearchResultBlock | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const type = validResultBlockTypes.includes(
    value.type as ResearchResultBlockType
  )
    ? (value.type as ResearchResultBlockType)
    : "note";

  return {
    id: readOptionalString(value.id) ?? `${entryId}-result-block-${index}`,
    type,
    title: readOptionalString(value.title),
    text: readOptionalString(value.text),
    html: readOptionalString(value.html),
    plainText: readOptionalString(value.plainText),
    imageDataUrl: readOptionalString(value.imageDataUrl),
    caption: readOptionalString(value.caption),
    createdAt: readOptionalString(value.createdAt) ?? fallbackDate,
    updatedAt: readOptionalString(value.updatedAt) ?? fallbackDate,
  };
}

function normalizeEntry(value: unknown): ResearchLogEntry | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const projectId = readOptionalString(value.projectId);
  const id = readOptionalString(value.id);

  if (!projectId || !id) {
    return undefined;
  }

  const now = new Date().toISOString();
  const createdAt = readOptionalString(value.createdAt) ?? now;
  const updatedAt = readOptionalString(value.updatedAt) ?? createdAt;
  const entryType = validEntryTypes.includes(value.entryType as ResearchLogEntryType)
    ? (value.entryType as ResearchLogEntryType)
    : "progress";
  const outputType = validOutputTypes.includes(
    value.outputType as ResearchResultOutputType
  )
    ? (value.outputType as ResearchResultOutputType)
    : undefined;
  const resultBlocks = Array.isArray(value.resultBlocks)
    ? value.resultBlocks
        .map((block, index) => normalizeResultBlock(block, id, index, createdAt))
        .filter((block): block is ResearchResultBlock => Boolean(block))
    : undefined;

  return {
    id,
    projectId,
    entryType,
    title: readOptionalString(value.title) ?? "Untitled log entry",
    body: readOptionalString(value.body) ?? "No details added yet.",
    doFile: readOptionalString(value.doFile),
    folderPath: readOptionalString(value.folderPath),
    datasetUsed: readOptionalString(value.datasetUsed),
    outputLabel: readOptionalString(value.outputLabel),
    outputType,
    commandNotes: readOptionalString(value.commandNotes),
    runDate: readOptionalString(value.runDate),
    versionCheckpoint: readOptionalString(value.versionCheckpoint),
    resultBlocks,
    tags: readStringArray(value.tags),
    pinned: typeof value.pinned === "boolean" ? value.pinned : false,
    createdAt,
    updatedAt,
  };
}

function loadEntries() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeEntry)
      .filter((entry): entry is ResearchLogEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function saveEntries(entries: ResearchLogEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function createEntryId(projectId: string) {
  const suffix =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${projectId}-log-${suffix}`;
}

function getResultFields(input: ResearchLogEntryInput) {
  return {
    doFile: input.doFile?.trim() || undefined,
    folderPath: input.folderPath?.trim() || undefined,
    datasetUsed: input.datasetUsed?.trim() || undefined,
    outputLabel: input.outputLabel?.trim() || undefined,
    outputType: input.outputType,
    commandNotes: input.commandNotes?.trim() || undefined,
    runDate: input.runDate || undefined,
    versionCheckpoint: input.versionCheckpoint?.trim() || undefined,
    resultBlocks: input.resultBlocks ?? [],
    tags: input.tags ?? [],
  };
}

export function useResearchLog() {
  const [entries, setEntries] = useState<ResearchLogEntry[]>(loadEntries);

  function updateEntries(
    updater: (currentEntries: ResearchLogEntry[]) => ResearchLogEntry[]
  ) {
    setEntries((currentEntries) => {
      const updatedEntries = updater(currentEntries);
      saveEntries(updatedEntries);
      return updatedEntries;
    });
  }

  function refreshLogEntries() {
    setEntries(loadEntries());
  }

  useResearchStorageSync(STORAGE_KEY, refreshLogEntries);

  const entriesByProject = useMemo(() => {
    return entries.reduce<Record<string, ResearchLogEntry[]>>(
      (groups, entry) => {
        if (!groups[entry.projectId]) {
          groups[entry.projectId] = [];
        }

        groups[entry.projectId].push(entry);
        return groups;
      },
      {}
    );
  }, [entries]);

  function getEntriesForProject(projectId: string) {
    return [...(entriesByProject[projectId] ?? [])].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  function createLogEntry(input: ResearchLogEntryInput) {
    const now = new Date().toISOString();

    const newEntry: ResearchLogEntry = {
      id: createEntryId(input.projectId),
      projectId: input.projectId,
      entryType: input.entryType,
      title: input.title.trim(),
      body: input.body.trim(),
      ...(input.entryType === "results" ? getResultFields(input) : {}),
      pinned: input.pinned,
      createdAt: now,
      updatedAt: now,
    };

    updateEntries((currentEntries) => [newEntry, ...currentEntries]);
  }

  function updateLogEntry(entryId: string, input: ResearchLogEntryInput) {
    const now = new Date().toISOString();

    updateEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              entryType: input.entryType,
              title: input.title.trim(),
              body: input.body.trim(),
              doFile: undefined,
              folderPath: undefined,
              datasetUsed: undefined,
              outputLabel: undefined,
              outputType: undefined,
              commandNotes: undefined,
              runDate: undefined,
              versionCheckpoint: undefined,
              resultBlocks: undefined,
              tags: undefined,
              ...(input.entryType === "results" ? getResultFields(input) : {}),
              pinned: input.pinned,
              updatedAt: now,
            }
          : entry
      )
    );
  }

  function togglePinnedEntry(entryId: string) {
    const now = new Date().toISOString();

    updateEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              pinned: !entry.pinned,
              updatedAt: now,
            }
          : entry
      )
    );
  }

  function deleteLogEntry(entryId: string) {
    updateEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== entryId)
    );
  }

  return {
    entries,
    getEntriesForProject,
    createLogEntry,
    updateLogEntry,
    togglePinnedEntry,
    deleteLogEntry,
    refreshLogEntries,
  };
}
