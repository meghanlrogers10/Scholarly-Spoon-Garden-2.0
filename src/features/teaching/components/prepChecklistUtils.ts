import type { TeachingPrepSession } from "../types";

export const prepChecklistItems = [
  { key: "iconPageReady", label: "ICON page ready" },
  { key: "lectureNotesDrafted", label: "Lecture notes drafted" },
  { key: "slidesPrepped", label: "Lecture slides prepped" },
  { key: "quizPrepared", label: "Quiz prepared" },
  { key: "homeworkPrepared", label: "Homework prepared" },
  { key: "inClassActivityPrepped", label: "In-class activity prepped" },
] as const;

export type PrepChecklistKey = (typeof prepChecklistItems)[number]["key"];

export type PrepChecklistValue = NonNullable<TeachingPrepSession["prepChecklist"]>;

export function getChecklistCompletion(value?: PrepChecklistValue) {
  const completed = prepChecklistItems.filter((item) => value?.[item.key]).length;

  return {
    completed,
    total: prepChecklistItems.length,
  };
}
