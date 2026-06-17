import { useMemo, useState } from "react";
import type {
  ResearchPrismaCriteria,
  ResearchPrismaRecord,
  ResearchPrismaRecordInput,
} from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const RECORDS_STORAGE_KEY = "ssg:researchPrismaRecords";
const CRITERIA_STORAGE_KEY = "ssg:researchPrismaCriteria";

function loadRecords() {
  try {
    const saved = window.localStorage.getItem(RECORDS_STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchPrismaRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadCriteria() {
  try {
    const saved = window.localStorage.getItem(CRITERIA_STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchPrismaCriteria[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records: ResearchPrismaRecord[]) {
  window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
}

function saveCriteria(criteria: ResearchPrismaCriteria[]) {
  window.localStorage.setItem(CRITERIA_STORAGE_KEY, JSON.stringify(criteria));
}

function createRecordId(projectId: string) {
  const suffix =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${projectId}-prisma-${suffix}`;
}

function normalizeRecordInput(input: ResearchPrismaRecordInput) {
  return {
    projectId: input.projectId,
    sourceId: input.sourceId || undefined,
    sourceTitle: input.sourceTitle?.trim() || undefined,
    status: input.status,
    exclusionReason: input.exclusionReason?.trim() || undefined,
    inclusionNotes: input.inclusionNotes?.trim() || undefined,
    screeningNotes: input.screeningNotes?.trim() || undefined,
    database: input.database?.trim() || undefined,
    sourceOrigin: input.sourceOrigin?.trim() || undefined,
    searchString: input.searchString?.trim() || undefined,
    importedAt: input.importedAt || undefined,
    screenedAt: input.screenedAt || undefined,
  };
}

export function useResearchPrisma() {
  const [records, setRecords] = useState<ResearchPrismaRecord[]>(loadRecords);
  const [criteria, setCriteria] =
    useState<ResearchPrismaCriteria[]>(loadCriteria);

  function updateRecords(
    updater: (currentRecords: ResearchPrismaRecord[]) => ResearchPrismaRecord[]
  ) {
    setRecords((currentRecords) => {
      const updatedRecords = updater(currentRecords);
      saveRecords(updatedRecords);
      return updatedRecords;
    });
  }

  function updateCriteria(
    updater: (
      currentCriteria: ResearchPrismaCriteria[]
    ) => ResearchPrismaCriteria[]
  ) {
    setCriteria((currentCriteria) => {
      const updatedCriteria = updater(currentCriteria);
      saveCriteria(updatedCriteria);
      return updatedCriteria;
    });
  }

  function refreshPrisma() {
    setRecords(loadRecords());
    setCriteria(loadCriteria());
  }

  useResearchStorageSync(RECORDS_STORAGE_KEY, refreshPrisma);
  useResearchStorageSync(CRITERIA_STORAGE_KEY, refreshPrisma);

  const recordsByProject = useMemo(() => {
    return records.reduce<Record<string, ResearchPrismaRecord[]>>(
      (groups, record) => {
        if (!groups[record.projectId]) {
          groups[record.projectId] = [];
        }

        groups[record.projectId].push(record);
        return groups;
      },
      {}
    );
  }, [records]);

  function getRecordsForProject(projectId: string) {
    return [...(recordsByProject[projectId] ?? [])].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  function getCriteriaForProject(projectId: string): ResearchPrismaCriteria {
    return (
      criteria.find((item) => item.projectId === projectId) ?? {
        projectId,
        inclusionCriteria: [],
        exclusionCriteria: [],
        updatedAt: new Date().toISOString(),
      }
    );
  }

  function createPrismaRecord(input: ResearchPrismaRecordInput) {
    const now = new Date().toISOString();
    const newRecord: ResearchPrismaRecord = {
      id: createRecordId(input.projectId),
      ...normalizeRecordInput(input),
      createdAt: now,
      updatedAt: now,
    };

    updateRecords((currentRecords) => [newRecord, ...currentRecords]);
  }

  function updatePrismaRecord(
    recordId: string,
    input: ResearchPrismaRecordInput
  ) {
    const now = new Date().toISOString();

    updateRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === recordId
          ? {
              ...record,
              ...normalizeRecordInput(input),
              updatedAt: now,
            }
          : record
      )
    );
  }

  function deletePrismaRecord(recordId: string) {
    updateRecords((currentRecords) =>
      currentRecords.filter((record) => record.id !== recordId)
    );
  }

  function upsertCriteria(
    projectId: string,
    inclusionCriteria: string[],
    exclusionCriteria: string[]
  ) {
    const now = new Date().toISOString();
    const nextCriteria: ResearchPrismaCriteria = {
      projectId,
      inclusionCriteria,
      exclusionCriteria,
      updatedAt: now,
    };

    updateCriteria((currentCriteria) => {
      const existing = currentCriteria.some((item) => item.projectId === projectId);

      return existing
        ? currentCriteria.map((item) =>
            item.projectId === projectId ? nextCriteria : item
          )
        : [nextCriteria, ...currentCriteria];
    });
  }

  function mergePrismaRecords(importedRecords: ResearchPrismaRecord[]) {
    updateRecords((currentRecords) => [...importedRecords, ...currentRecords]);
  }

  function mergePrismaCriteria(importedCriteria: ResearchPrismaCriteria[]) {
    updateCriteria((currentCriteria) => {
      const incomingByProject = new Map(
        importedCriteria.map((item) => [item.projectId, item])
      );
      const merged = currentCriteria.map(
        (item) => incomingByProject.get(item.projectId) ?? item
      );
      const existingProjectIds = new Set(merged.map((item) => item.projectId));

      importedCriteria.forEach((item) => {
        if (!existingProjectIds.has(item.projectId)) {
          merged.push(item);
        }
      });

      return merged;
    });
  }

  return {
    records,
    criteria,
    getRecordsForProject,
    getCriteriaForProject,
    createPrismaRecord,
    updatePrismaRecord,
    deletePrismaRecord,
    upsertCriteria,
    mergePrismaRecords,
    mergePrismaCriteria,
    refreshPrisma,
  };
}
