import type { SourceTaskInput } from "../../../shared/hooks/useTaskBridge";
import type {
  NewTeachingAnnouncementReminderInput,
  NewTeachingTaItemInput,
  TeachingAnnouncementReminder,
  TeachingCourse,
  TeachingGradingItem,
  TeachingSuggestion,
  TeachingTaItem,
} from "../types";

export const TEACHING_SUGGESTION_NOTE_PREFIX = "[teaching-suggestion:";

export function teachingSuggestionMarker(suggestionId: string) {
  return `${TEACHING_SUGGESTION_NOTE_PREFIX}${suggestionId}]`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);

  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function courseLabel(course: TeachingCourse) {
  return course.code || course.title || "Course";
}

function suggestionId(item: TeachingGradingItem, key: string) {
  return `${item.id}:${key}`;
}

function suggestion(
  course: TeachingCourse,
  item: TeachingGradingItem,
  input: Omit<
    TeachingSuggestion,
    | "id"
    | "areaLabel"
    | "contextLabel"
    | "sourceId"
    | "sourceType"
  >,
): TeachingSuggestion {
  return {
    ...input,
    id: suggestionId(item, input.key),
    areaLabel: "Teaching",
    contextLabel: `${courseLabel(course)} · ${item.assignment}`,
    sourceId: item.id,
    sourceType: "teaching-grading-item",
  };
}

export function generateGradingItemSuggestions(
  course: TeachingCourse,
  item: TeachingGradingItem,
): TeachingSuggestion[] {
  const dueDate = item.dueDate || undefined;
  const undatedReason =
    "No due date is set yet, so this suggestion is undated until you add one.";

  return [
    suggestion(course, item, {
      key: "confirm-instructions",
      title: `Confirm instructions are posted for ${item.assignment}`,
      description: "Check the assignment page, files, and student-facing details.",
      suggestedDate: dueDate ? addDays(dueDate, -7) : undefined,
      kind: "task",
      targetType: "sharedTask",
      checkedByDefault: true,
      lowEnergyFriendly: true,
      spoonCost: 1,
      estimatedMinutes: 15,
      reason: dueDate
        ? "Suggested 7 days before the due date so missing instructions do not become a last-minute scramble."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "check-rubric",
      title: `Check rubric is attached for ${item.assignment}`,
      description: "Make sure grading criteria are visible before students submit.",
      suggestedDate: dueDate ? addDays(dueDate, -7) : undefined,
      kind: "task",
      targetType: "sharedTask",
      checkedByDefault: true,
      lowEnergyFriendly: true,
      spoonCost: 1,
      estimatedMinutes: 15,
      reason: dueDate
        ? "Suggested 7 days before the due date because rubric fixes are easier before submissions arrive."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "student-reminder",
      title: `Post student reminder for ${item.assignment}`,
      description: "Create a Teaching announcement reminder for students.",
      suggestedDate: dueDate ? addDays(dueDate, -2) : undefined,
      kind: "announcement",
      targetType: "announcement",
      checkedByDefault: true,
      lowEnergyFriendly: true,
      spoonCost: 1,
      estimatedMinutes: 15,
      reason: dueDate
        ? "Suggested 2 days before the due date as a gentle student-facing nudge."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "prep-grading-plan",
      title: `Prep grading plan for ${item.assignment}`,
      description: "Name the first grading move, estimate time, and identify any setup needs.",
      suggestedDate: dueDate ? addDays(dueDate, -1) : undefined,
      kind: "grading",
      targetType: "sharedTask",
      checkedByDefault: true,
      lowEnergyFriendly: true,
      spoonCost: 2,
      estimatedMinutes: 25,
      reason: dueDate
        ? "Suggested 1 day before the due date so grading has a next action before submissions arrive."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "ta-instructions",
      title: `Send TA grading instructions for ${item.assignment}`,
      description: "Create a TA follow-up item with rubric/instruction fields ready.",
      suggestedDate: dueDate ? addDays(dueDate, -2) : undefined,
      kind: "ta",
      targetType: "taItem",
      checkedByDefault: false,
      lowEnergyFriendly: true,
      spoonCost: 1,
      estimatedMinutes: 20,
      reason: dueDate
        ? "Suggested 2 days before the due date when TA-supported grading needs clear instructions."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "grade-norming",
      title: `Norm grading with TA/sample papers for ${item.assignment}`,
      description: "Create a TA follow-up item for calibration before grading gets too far.",
      suggestedDate: dueDate ? addDays(dueDate, 1) : undefined,
      kind: "ta",
      targetType: "taItem",
      checkedByDefault: false,
      lowEnergyFriendly: false,
      spoonCost: 2,
      estimatedMinutes: 30,
      reason: dueDate
        ? "Suggested 1 day after the due date so grading standards are aligned early."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "grading-block",
      title: `Set aside grading block for ${item.assignment}`,
      description: "Create a shared Teaching task that appears on Tasks and Dashboard.",
      suggestedDate: dueDate,
      kind: "grading",
      targetType: "sharedTask",
      checkedByDefault: true,
      lowEnergyFriendly: false,
      spoonCost: item.spoonCost ?? 3,
      estimatedMinutes: item.estimatedMinutes ?? 45,
      reason: dueDate
        ? "Suggested on the due date so the grading queue becomes visible when submissions arrive."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "late-missing-check",
      title: `Check late/missing submissions for ${item.assignment}`,
      description: "Review missing work before grading or feedback gets finalized.",
      suggestedDate: dueDate ? addDays(dueDate, 1) : undefined,
      kind: "grading",
      targetType: "sharedTask",
      checkedByDefault: true,
      lowEnergyFriendly: true,
      spoonCost: 1,
      estimatedMinutes: 20,
      reason: dueDate
        ? "Suggested 1 day after the due date to catch late or missing submissions."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "return-grades",
      title: `Return grades / release feedback for ${item.assignment}`,
      description: "Create a shared Teaching task for the default one-week turnaround.",
      suggestedDate: dueDate ? addDays(dueDate, 7) : undefined,
      kind: "grading",
      targetType: "sharedTask",
      checkedByDefault: true,
      lowEnergyFriendly: false,
      spoonCost: 2,
      estimatedMinutes: 30,
      reason: dueDate
        ? "Suggested 7 days after the due date as a default grading turnaround target."
        : undatedReason,
    }),
    suggestion(course, item, {
      key: "common-feedback",
      title: `Post common feedback or FAQ for ${item.assignment}`,
      description: "Create a shared Teaching task to turn repeated issues into reusable feedback.",
      suggestedDate: dueDate ? addDays(dueDate, 8) : undefined,
      kind: "resource",
      targetType: "sharedTask",
      checkedByDefault: false,
      lowEnergyFriendly: true,
      spoonCost: 1,
      estimatedMinutes: 20,
      reason: dueDate
        ? "Suggested after grading starts, when repeated questions or feedback patterns are easier to see."
        : undatedReason,
    }),
  ];
}

export function teachingSuggestionTaskInput(
  course: TeachingCourse,
  item: TeachingGradingItem,
  suggestion: TeachingSuggestion,
): SourceTaskInput {
  return {
    source:
      suggestion.kind === "ta"
        ? "ta-follow-up"
        : suggestion.kind === "announcement"
          ? "announcement"
          : "grading",
    sourceId: suggestion.id,
    title: suggestion.title,
    area: "Teaching",
    courseId: course.id,
    taskType:
      suggestion.kind === "announcement" || suggestion.kind === "ta"
        ? "email-admin"
        : suggestion.kind === "prep"
          ? "class-prep"
          : "grading",
    nextAction: suggestion.description,
    dueDate: suggestion.suggestedDate,
    spoonCost: suggestion.spoonCost,
    estimatedMinutes: suggestion.estimatedMinutes,
    lowEnergyFriendly: suggestion.lowEnergyFriendly,
    notes: [
      `${courseLabel(course)} suggested follow-up for ${item.assignment}`,
      suggestion.reason,
      teachingSuggestionMarker(suggestion.id),
    ].join("\n"),
    today: false,
  };
}

export function teachingSuggestionAnnouncementInput(
  item: TeachingGradingItem,
  suggestion: TeachingSuggestion,
): NewTeachingAnnouncementReminderInput {
  return {
    courseId: item.courseId,
    title: suggestion.title,
    itemName: item.assignment,
    itemType: item.assignmentType === "quiz" || item.assignmentType === "exam"
      ? item.assignmentType
      : "assignment",
    dueDate: item.dueDate,
    announcementDate: suggestion.suggestedDate ?? "",
    audience: "students",
    channel: "icon",
    status: "planned",
    announcementSubject: `Reminder: ${item.assignment}`,
    announcementBody: "",
    taEmailSubject: "",
    taEmailBody: "",
    notes: [suggestion.reason, teachingSuggestionMarker(suggestion.id)].join("\n"),
  };
}

export function teachingSuggestionTaItemInput(
  item: TeachingGradingItem,
  suggestion: TeachingSuggestion,
): NewTeachingTaItemInput {
  const isNorming = suggestion.key === "grade-norming";

  return {
    courseId: item.courseId,
    taName: "",
    task: suggestion.title,
    assignmentName: item.assignment,
    assignmentDueDate: item.dueDate || undefined,
    reminderDueDate: suggestion.suggestedDate,
    followUpDueDate: item.dueDate || undefined,
    status: "open",
    category: "grading",
    dueDate: suggestion.suggestedDate ?? item.dueDate,
    notes: [suggestion.reason, teachingSuggestionMarker(suggestion.id)].join("\n"),
    weeklyComment: "",
    nextAction: suggestion.description,
    rubricIncluded: suggestion.key === "ta-instructions",
    rubricReminderEnabled: suggestion.key === "ta-instructions",
    taInstructionsIncluded: suggestion.key === "ta-instructions",
    gradeNormingEnabled: isNorming,
    gradeNormingReminderDate: isNorming ? suggestion.suggestedDate : undefined,
    completed: false,
  };
}

export function teachingSuggestionExists(input: {
  suggestion: TeachingSuggestion;
  tasks: Array<{ source?: string; sourceId?: string; notes?: string }>;
  announcementReminders: TeachingAnnouncementReminder[];
  taItems: TeachingTaItem[];
}) {
  const marker = teachingSuggestionMarker(input.suggestion.id);

  if (
    input.tasks.some(
      (task) =>
        task.sourceId === input.suggestion.id ||
        Boolean(task.notes?.includes(marker)),
    )
  ) {
    return true;
  }

  if (
    input.announcementReminders.some((reminder) =>
      reminder.notes.includes(marker),
    )
  ) {
    return true;
  }

  return input.taItems.some((item) => item.notes.includes(marker));
}
