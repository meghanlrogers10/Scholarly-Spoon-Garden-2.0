import { useMemo, useState } from "react";
import type { ResearchSubmission, ResearchSubmissionInput } from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const STORAGE_KEY = "ssg:researchSubmissions";

function loadSubmissions() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchSubmission[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveSubmissions(submissions: ResearchSubmission[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

export function useResearchSubmissions() {
  const [submissions, setSubmissions] =
    useState<ResearchSubmission[]>(loadSubmissions);

  function updateSubmissions(
    updater: (currentSubmissions: ResearchSubmission[]) => ResearchSubmission[]
  ) {
    setSubmissions((currentSubmissions) => {
      const updatedSubmissions = updater(currentSubmissions);
      saveSubmissions(updatedSubmissions);
      return updatedSubmissions;
    });
  }

  function refreshSubmissions() {
    setSubmissions(loadSubmissions());
  }

  useResearchStorageSync(STORAGE_KEY, refreshSubmissions);

  const submissionsByProject = useMemo(() => {
    return submissions.reduce<Record<string, ResearchSubmission[]>>(
      (groups, submission) => {
        if (!groups[submission.projectId]) {
          groups[submission.projectId] = [];
        }

        groups[submission.projectId].push(submission);
        return groups;
      },
      {}
    );
  }, [submissions]);

  function getSubmissionsForProject(projectId: string) {
    return [...(submissionsByProject[projectId] ?? [])].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  function createSubmission(input: ResearchSubmissionInput) {
    const now = new Date().toISOString();

    const newSubmission: ResearchSubmission = {
      id: `${input.projectId}-submission-${Date.now()}`,
      projectId: input.projectId,
      journalName: input.journalName.trim(),
      status: input.status,
      manuscriptVersion: input.manuscriptVersion?.trim() || undefined,
      submittedAt: input.submittedAt || undefined,
      decisionAt: input.decisionAt || undefined,
      nextAction: input.nextAction?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      pinned: input.pinned,
      createdAt: now,
      updatedAt: now,
    };

    updateSubmissions((currentSubmissions) => [
      newSubmission,
      ...currentSubmissions,
    ]);
  }

  function updateSubmission(
    submissionId: string,
    input: ResearchSubmissionInput
  ) {
    const now = new Date().toISOString();

    updateSubmissions((currentSubmissions) =>
      currentSubmissions.map((submission) =>
        submission.id === submissionId
          ? {
              ...submission,
              journalName: input.journalName.trim(),
              status: input.status,
              manuscriptVersion: input.manuscriptVersion?.trim() || undefined,
              submittedAt: input.submittedAt || undefined,
              decisionAt: input.decisionAt || undefined,
              nextAction: input.nextAction?.trim() || undefined,
              notes: input.notes?.trim() || undefined,
              pinned: input.pinned,
              updatedAt: now,
            }
          : submission
      )
    );
  }

  function togglePinnedSubmission(submissionId: string) {
    const now = new Date().toISOString();

    updateSubmissions((currentSubmissions) =>
      currentSubmissions.map((submission) =>
        submission.id === submissionId
          ? {
              ...submission,
              pinned: !submission.pinned,
              updatedAt: now,
            }
          : submission
      )
    );
  }

  function deleteSubmission(submissionId: string) {
    updateSubmissions((currentSubmissions) =>
      currentSubmissions.filter((submission) => submission.id !== submissionId)
    );
  }

  return {
    submissions,
    getSubmissionsForProject,
    createSubmission,
    updateSubmission,
    togglePinnedSubmission,
    deleteSubmission,
    refreshSubmissions,
  };
}
