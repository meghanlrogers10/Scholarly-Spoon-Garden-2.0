import type { SourceTaskInput } from "../../../shared/hooks/useTaskBridge";
import type {
  TeachingAnnouncementReminder,
  TeachingCourse,
  TeachingCourseNote,
  TeachingGradingItem,
  TeachingOfficeHourVisit,
  TeachingPrepSession,
  TeachingResource,
  TeachingTaItem,
} from "../types";

function courseLabel(course: TeachingCourse) {
  return course.code || course.title || "Course";
}

function compactNotes(lines: Array<string | undefined>) {
  return lines.filter(Boolean).join("\n");
}

export function prepSessionTaskInput(
  course: TeachingCourse,
  session: TeachingPrepSession,
  dueDate?: string,
): SourceTaskInput {
  const topic = session.topic || "class prep";

  return {
    source: "teaching-prep",
    sourceId: session.id,
    title: session.nextAction || `Prep ${topic}`,
    area: "Teaching",
    courseId: course.id,
    taskType: "class-prep",
    nextAction: session.nextAction || `Prep ${topic}`,
    dueDate,
    spoonCost: 2,
    estimatedMinutes: 30,
    lowEnergyFriendly: Boolean(session.nextAction),
    notes: compactNotes([
      `${courseLabel(course)} prep: ${topic}`,
      session.slides ? `Slides/link: ${session.slides}` : undefined,
      session.plan ? `Plan: ${session.plan}` : undefined,
    ]),
  };
}

export function gradingTaskInput(
  course: TeachingCourse,
  item: TeachingGradingItem,
): SourceTaskInput {
  return {
    source: "grading",
    sourceId: item.id,
    title: item.nextAction || `Grade ${item.assignment}`,
    area: "Teaching",
    courseId: course.id,
    taskType: "grading",
    nextAction: item.nextAction || `Grade ${item.assignment}`,
    dueDate: item.dueDate,
    spoonCost: item.spoonCost ?? (item.status === "in-progress" ? 2 : 3),
    estimatedMinutes: item.estimatedMinutes ?? 45,
    lowEnergyFriendly: Boolean(item.nextAction),
    notes: compactNotes([
      `${courseLabel(course)} grading: ${item.assignment}`,
      item.assignmentType ? `Type: ${item.assignmentType}` : undefined,
      item.missing ? `Missing: ${item.missing}` : undefined,
      item.notes,
    ]),
  };
}

export function officeHoursTaskInput(
  course: TeachingCourse,
  visit: TeachingOfficeHourVisit,
): SourceTaskInput {
  const student = visit.student || "student";

  return {
    source: "office-hours",
    sourceId: visit.id,
    title: visit.nextAction || `Follow up with ${student}`,
    area: "Teaching",
    courseId: course.id,
    taskType: "teaching",
    nextAction: visit.nextAction || visit.followUp || `Follow up with ${student}`,
    dueDate: visit.visitDate,
    spoonCost: visit.status === "waiting" ? 1 : 2,
    estimatedMinutes: 20,
    lowEnergyFriendly: true,
    notes: compactNotes([
      `${courseLabel(course)} office hours: ${student}`,
      visit.concern ? `Concern: ${visit.concern}` : undefined,
      visit.followUp ? `Follow-up: ${visit.followUp}` : undefined,
      visit.status === "waiting" ? "Status: waiting" : undefined,
    ]),
  };
}

export function taTaskInput(
  course: TeachingCourse,
  item: TeachingTaItem,
): SourceTaskInput {
  return {
    source: "ta-follow-up",
    sourceId: item.id,
    title: item.nextAction || item.task,
    area: "Teaching",
    courseId: course.id,
    taskType: "email-admin",
    nextAction: item.nextAction || item.task,
    dueDate: item.dueDate || item.followUpDueDate || item.reminderDueDate,
    spoonCost: item.status === "waiting" ? 1 : 2,
    estimatedMinutes: 20,
    lowEnergyFriendly: true,
    notes: compactNotes([
      `${courseLabel(course)} TA follow-up: ${item.taName || "Unassigned TA"}`,
      item.assignmentName ? `Assignment: ${item.assignmentName}` : undefined,
      item.notes,
      item.weeklyComment ? `Weekly comment: ${item.weeklyComment}` : undefined,
      item.status === "waiting" ? "Status: waiting" : undefined,
      item.rubricShared ? "Rubric shared" : undefined,
      item.gradeNormingCompleted ? "Grade norming done" : undefined,
      item.deadlineClarified ? "Deadline clarified" : undefined,
    ]),
  };
}

export function announcementTaskInput(
  course: TeachingCourse,
  reminder: TeachingAnnouncementReminder,
): SourceTaskInput {
  return {
    source: "announcement",
    sourceId: reminder.id,
    title: `Post announcement: ${reminder.title || reminder.itemName}`,
    area: "Teaching",
    courseId: course.id,
    taskType: "email-admin",
    nextAction: `Draft or post ${reminder.title || reminder.itemName}`,
    dueDate: reminder.announcementDate || reminder.dueDate,
    spoonCost: 1,
    estimatedMinutes: 15,
    lowEnergyFriendly: true,
    notes: compactNotes([
      `${courseLabel(course)} announcement: ${reminder.itemName}`,
      `Audience: ${reminder.audience}`,
      reminder.notes,
    ]),
  };
}

export function resourceTaskInput(
  course: TeachingCourse,
  resource: TeachingResource,
): SourceTaskInput {
  const label = resource.title || resource.fileName || resource.url || "resource";

  return {
    source: "resource",
    sourceId: resource.id,
    title: `Review resource: ${label}`,
    area: "Teaching",
    courseId: course.id,
    taskType: "teaching",
    nextAction: resource.nextAction || `Review or update ${label}`,
    dueDate: resource.dueDate,
    spoonCost: 1,
    estimatedMinutes: 15,
    lowEnergyFriendly: true,
    notes: compactNotes([
      `${courseLabel(course)} resource: ${label}`,
      resource.description,
      resource.shortAnswer ? `FAQ answer: ${resource.shortAnswer}` : undefined,
      resource.url ? `URL: ${resource.url}` : undefined,
      resource.fileName ? `File: ${resource.fileName}` : undefined,
      resource.reusable ? "Reusable student-facing resource" : undefined,
    ]),
  };
}

export function noteTaskInput(
  course: TeachingCourse,
  note: TeachingCourseNote,
): SourceTaskInput {
  const label = note.title || "teaching note";
  const nextAction =
    note.noteType === "change-next-time"
      ? `Apply note next time: ${label}`
      : `Review teaching note: ${label}`;

  return {
    source: "resource",
    sourceId: `note:${note.id}`,
    title: nextAction,
    area: "Teaching",
    courseId: course.id,
    taskType: "teaching",
    nextAction,
    spoonCost: 1,
    estimatedMinutes: 15,
    lowEnergyFriendly: true,
    notes: compactNotes([
      `${courseLabel(course)} note: ${label}`,
      `Type: ${note.noteType}`,
      note.body,
    ]),
  };
}
