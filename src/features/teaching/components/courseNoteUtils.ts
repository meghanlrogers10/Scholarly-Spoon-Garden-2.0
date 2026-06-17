import type { TeachingCourseNoteType } from "../types";

export const noteTypeOptions: Array<{
  value: TeachingCourseNoteType;
  label: string;
}> = [
  { value: "lecture", label: "Lecture" },
  { value: "student-confusion", label: "Student confusion" },
  { value: "change-next-time", label: "Change next time" },
  { value: "policy", label: "Policy" },
  { value: "activity", label: "Activity" },
  { value: "exam", label: "Exam" },
  { value: "ta", label: "TA" },
  { value: "other", label: "Other" },
];

export function noteTypeLabel(noteType: TeachingCourseNoteType) {
  return noteTypeOptions.find((option) => option.value === noteType)?.label ?? "Other";
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
