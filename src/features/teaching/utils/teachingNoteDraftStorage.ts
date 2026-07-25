import { TEACHING_COURSE_NOTE_DRAFT_PREFIX } from "../../../shared/constants/teachingStorage";
import { readLocalStorageValue, writeLocalStorageValue } from "../../../shared/utils/localStorageSync";
import type { TeachingCourseNoteDraft } from "../types";

type StoredTeachingCourseNoteDraft = Omit<
  TeachingCourseNoteDraft,
  "id" | "courseId" | "noteId" | "createdAt" | "updatedAt" | "tags"
> & {
  tags?: string[] | string;
  updatedAt?: string;
};

function draftStorageKey(draft: TeachingCourseNoteDraft) {
  return `${TEACHING_COURSE_NOTE_DRAFT_PREFIX}${draft.courseId}.${draft.noteId ?? "new"}`;
}

function splitDraftKey(key: string) {
  const suffix = key.slice(TEACHING_COURSE_NOTE_DRAFT_PREFIX.length);
  const separatorIndex = suffix.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const courseId = suffix.slice(0, separatorIndex);
  const noteId = suffix.slice(separatorIndex + 1);

  return {
    id: suffix,
    courseId,
    noteId: noteId === "new" ? undefined : noteId,
  };
}

function normalizeDraft(
  value: unknown,
  identity: { id: string; courseId: string; noteId?: string },
): TeachingCourseNoteDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const stored = value as Partial<StoredTeachingCourseNoteDraft>;
  const now = new Date().toISOString();
  const tags = Array.isArray(stored.tags)
    ? stored.tags.filter((tag): tag is string => typeof tag === "string")
    : typeof stored.tags === "string"
      ? stored.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  return {
    id: identity.id,
    courseId: identity.courseId,
    noteId: identity.noteId,
    title: typeof stored.title === "string" ? stored.title : "",
    body: typeof stored.body === "string" ? stored.body : "",
    tags,
    noteType:
      stored.noteType === "lecture" ||
      stored.noteType === "student-confusion" ||
      stored.noteType === "change-next-time" ||
      stored.noteType === "policy" ||
      stored.noteType === "activity" ||
      stored.noteType === "exam" ||
      stored.noteType === "ta"
        ? stored.noteType
        : "other",
    savedAt: typeof stored.savedAt === "string" ? stored.savedAt : undefined,
    createdAt: typeof stored.savedAt === "string" ? stored.savedAt : now,
    updatedAt:
      typeof stored.updatedAt === "string"
        ? stored.updatedAt
        : typeof stored.savedAt === "string"
          ? stored.savedAt
          : now,
  };
}

export function readLocalTeachingCourseNoteDrafts() {
  const drafts: TeachingCourseNoteDraft[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith(TEACHING_COURSE_NOTE_DRAFT_PREFIX)) {
      continue;
    }

    const identity = splitDraftKey(key);

    if (!identity) {
      continue;
    }

    const value = readLocalStorageValue<unknown>(key, null);
    const draft = normalizeDraft(value, identity);

    if (draft) {
      drafts.push(draft);
    }
  }

  return drafts;
}

export function writeLocalTeachingCourseNoteDrafts(
  drafts: TeachingCourseNoteDraft[],
) {
  drafts.forEach((draft) => {
    const storedDraft: StoredTeachingCourseNoteDraft = {
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      noteType: draft.noteType,
      savedAt: draft.savedAt,
      updatedAt: draft.updatedAt,
    };

    writeLocalStorageValue(draftStorageKey(draft), storedDraft);
  });
}
