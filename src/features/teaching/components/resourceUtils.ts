import type { TeachingResourceType } from "../types";

export const resourceTypeOptions: Array<{
  value: TeachingResourceType;
  label: string;
}> = [
  { value: "syllabus", label: "Syllabus" },
  { value: "slides", label: "Slides" },
  { value: "assignment", label: "Assignment" },
  { value: "rubric", label: "Rubric" },
  { value: "reading", label: "Reading" },
  { value: "activity", label: "Activity" },
  { value: "exam", label: "Exam" },
  { value: "example", label: "Example" },
  { value: "icon", label: "ICON page" },
  { value: "external-link", label: "External link" },
  { value: "other", label: "Other" },
];

export function resourceTypeLabel(resourceType: TeachingResourceType) {
  return (
    resourceTypeOptions.find((option) => option.value === resourceType)?.label ??
    "Other"
  );
}
