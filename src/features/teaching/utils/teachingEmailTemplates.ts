import type {
  TeachingAnnouncementReminder,
  TeachingAssistant,
  TeachingCourse,
  TeachingEmailTemplateType,
  TeachingTaItem,
} from "../types";

export type TeachingEmailDraft = {
  to?: string;
  subject: string;
  body: string;
  templateType?: TeachingEmailTemplateType;
};

type TaEmailInput = {
  course: TeachingCourse;
  ta?: TeachingAssistant;
  item: TeachingTaItem;
  instructorName?: string;
};

function professorName(value?: string) {
  return value?.trim() || "Professor";
}

function taName(input: TaEmailInput) {
  return input.ta?.name || input.item.taName || "there";
}

function taEmail(input: TaEmailInput) {
  return input.ta?.email || undefined;
}

function assignmentName(item: TeachingTaItem) {
  return item.assignmentName || item.task || "the assignment";
}

function dateInfo(item: TeachingTaItem) {
  const date = item.assignmentDueDate || item.dueDate || item.reminderDueDate;
  return date ? `on ${date}` : "soon";
}

function optionalGradingSections(item: TeachingTaItem) {
  const lines: string[] = [];

  if (item.rubricIncluded || item.rubricLink) {
    lines.push("Please make sure to use the rubric while grading.");
  }

  if (item.rubricLink) {
    lines.push(`Rubric: ${item.rubricLink}`);
  }

  if (item.taInstructions) {
    lines.push("");
    lines.push("A few grading notes/instructions:");
    lines.push(item.taInstructions);
  }

  if (item.gradeNormingEnabled) {
    lines.push("");
    lines.push(
      "Since this is one of the first/major assignments, let's also check grade norming early. After you grade the first few submissions, please let me know so we can make sure we are applying the rubric consistently."
    );
  }

  return lines.length > 0 ? `\n\n${lines.join("\n")}` : "";
}

export function generateTaInitialGradingReminderEmail(
  input: TaEmailInput
): TeachingEmailDraft {
  const assignment = assignmentName(input.item);
  const subject = `Friendly grading reminder for ${input.course.code}: ${assignment}`;
  const body = `Hi ${taName(input)},

Just a quick reminder that ${assignment} for ${input.course.code} is due/ready for grading ${dateInfo(input.item)}.

When you get a chance, please begin grading and let me know if you run into any issues.${optionalGradingSections(input.item)}

Best,
${professorName(input.instructorName)}`;

  return { to: taEmail(input), subject, body, templateType: "initial-grading-reminder" };
}

export function generateTaGradingFollowUpEmail(
  input: TaEmailInput
): TeachingEmailDraft {
  const assignment = assignmentName(input.item);
  const subject = `Checking in on grading for ${input.course.code}: ${assignment}`;
  const body = `Hi ${taName(input)},

I'm checking in on ${assignment} for ${input.course.code}. I had it marked for follow-up because it has been about a week since the assignment was due and I do not have it marked as completed yet.

Can you let me know where things stand?

Best,
${professorName(input.instructorName)}`;

  return { to: taEmail(input), subject, body, templateType: "grading-follow-up" };
}

export function generateTaGeneralCheckInEmail(input: TaEmailInput): TeachingEmailDraft {
  const subject = `Quick TA check-in for ${input.course.code}`;
  const body = `Hi ${taName(input)},

Just checking in on ${input.item.task || "our current TA follow-up item"} for ${input.course.code}.

${input.item.nextAction || "Can you let me know if anything needs my attention?"}

Best,
${professorName(input.instructorName)}`;

  return { to: taEmail(input), subject, body, templateType: "general-check-in" };
}

export function generateTaRubricReminderEmail(input: TaEmailInput): TeachingEmailDraft {
  const assignment = assignmentName(input.item);
  const subject = `Rubric reminder for ${input.course.code}: ${assignment}`;
  const body = `Hi ${taName(input)},

Quick reminder to use the rubric while grading ${assignment} for ${input.course.code}.

${input.item.rubricLink ? `Rubric: ${input.item.rubricLink}\n\n` : ""}Let me know if any rubric categories feel unclear once you start grading.

Best,
${professorName(input.instructorName)}`;

  return { to: taEmail(input), subject, body, templateType: "rubric-reminder" };
}

export function generateTaInstructionsReminderEmail(
  input: TaEmailInput
): TeachingEmailDraft {
  const assignment = assignmentName(input.item);
  const subject = `Grading notes for ${input.course.code}: ${assignment}`;
  const body = `Hi ${taName(input)},

Before grading ${assignment}, please keep these instructions in mind:

${input.item.taInstructions || "Use the course rubric and flag anything uncertain before returning grades."}

Best,
${professorName(input.instructorName)}`;

  return { to: taEmail(input), subject, body, templateType: "ta-instructions-reminder" };
}

export function generateTaGradeNormingReminderEmail(
  input: TaEmailInput
): TeachingEmailDraft {
  const assignment = assignmentName(input.item);
  const subject = `Grade norming check for ${input.course.code}: ${assignment}`;
  const body = `Hi ${taName(input)},

For ${assignment}, let's do a quick grade norming check before grading gets too far. After you grade the first few submissions, please let me know so we can make sure we are applying the rubric consistently.

Best,
${professorName(input.instructorName)}`;

  return { to: taEmail(input), subject, body, templateType: "grade-norming-reminder" };
}

export function generateStudentAnnouncementTemplate(input: {
  course: TeachingCourse;
  reminder: TeachingAnnouncementReminder;
  instructorName?: string;
}): TeachingEmailDraft {
  const subject = `Reminder: ${input.reminder.itemName} due ${input.reminder.dueDate}`;
  const body = `Hi everyone,

Quick reminder that ${input.reminder.itemName} for ${input.course.code} is due ${input.reminder.dueDate}.

Please make sure you review the instructions in ICON and submit before the deadline. If you have questions, reach out before the due date.

Best,
${professorName(input.instructorName)}`;

  return { subject, body };
}

export function generateTaPostAnnouncementEmail(input: {
  course: TeachingCourse;
  reminder: TeachingAnnouncementReminder;
  announcement: TeachingEmailDraft;
  ta?: TeachingAssistant;
  instructorName?: string;
}): TeachingEmailDraft {
  const subject = `Please remind students about ${input.reminder.itemName} for ${input.course.code}`;
  const body = `Hi ${input.ta?.name || "there"},

Could you please remind students that ${input.reminder.itemName} for ${input.course.code} is due ${input.reminder.dueDate}?

Here is a draft announcement you can use or adapt:

${input.announcement.body}

Thanks,
${professorName(input.instructorName)}`;

  return { to: input.ta?.email, subject, body };
}
