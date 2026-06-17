export type TeachingSemesterStatus = "active" | "archived";

export type TeachingCourseStatus = "active" | "archived";

export type TeachingTerm = "Fall" | "Spring" | "Summer" | "Winter" | "Other";

export type TeachingSemester = {
  id: string;
  name: string;
  term: TeachingTerm;
  year: string;
  status: TeachingSemesterStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TeachingCourse = {
  id: string;
  semesterId: string;
  sourceCourseId?: string;
  code: string;
  title: string;
  section?: string;
  meetingPattern?: string;
  location?: string;
  status: TeachingCourseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type NewTeachingSemesterInput = {
  name: string;
  term: TeachingTerm;
  year: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export type UpdateTeachingSemesterInput = NewTeachingSemesterInput & {
  status?: TeachingSemesterStatus;
};

export type NewTeachingCourseInput = {
  semesterId: string;
  sourceCourseId?: string;
  code: string;
  title: string;
  section?: string;
  meetingPattern?: string;
  location?: string;
  notes?: string;
};

export type UpdateTeachingCourseInput = NewTeachingCourseInput & {
  status?: TeachingCourseStatus;
};

export type TeachingGradingStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "returned";

export type TeachingCourseNoteType =
  | "lecture"
  | "student-confusion"
  | "change-next-time"
  | "policy"
  | "activity"
  | "exam"
  | "ta"
  | "other";

export type TeachingResourceType =
  | "syllabus"
  | "slides"
  | "rubric"
  | "reading"
  | "assignment"
  | "activity"
  | "exam"
  | "example"
  | "icon"
  | "external-link"
  | "other";

export type TeachingAttentionType =
  | "prep"
  | "grading"
  | "ta"
  | "announcement"
  | "office-hours"
  | "notebook";

export type TeachingAttentionPriority = "low" | "medium" | "high";

export type TeachingAssistantRole =
  | "grader"
  | "discussion"
  | "lead-ta"
  | "support"
  | "other";

export type TeachingAssistant = {
  id: string;
  courseId: string;
  name: string;
  email: string;
  officeHours: string;
  role?: TeachingAssistantRole;
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeachingReminderHistoryType =
  | "initial-grading-reminder"
  | "grading-follow-up"
  | "rubric-reminder"
  | "ta-instructions-reminder"
  | "grade-norming-reminder"
  | "general-check-in";

export type TeachingEmailTemplateType = TeachingReminderHistoryType;

export type TeachingTaReminderAlertType =
  | "ta-initial-reminder"
  | "ta-follow-up-reminder"
  | "ta-waiting"
  | "ta-rubric-reminder"
  | "ta-instructions-reminder"
  | "ta-grade-norming-reminder";

export type TeachingTaReminderAlert = {
  id: string;
  courseId: string;
  taItemId: string;
  taId?: string;
  type: TeachingTaReminderAlertType;
  title: string;
  detail: string;
  priority: TeachingAttentionPriority;
  dueDate?: string;
  nextAction: string;
  actionLabel: string;
};

export type TeachingAnnouncementItemType =
  | "assignment"
  | "quiz"
  | "exam"
  | "reading"
  | "class"
  | "other";

export type TeachingAnnouncementAudience = "students" | "ta" | "both";

export type TeachingAnnouncementChannel = "icon" | "email" | "ta-email" | "other";

export type TeachingAnnouncementStatus =
  | "planned"
  | "drafted"
  | "posted"
  | "skipped";

export type TeachingAnnouncementReminder = {
  id: string;
  courseId: string;
  title: string;
  itemName: string;
  itemType: TeachingAnnouncementItemType;
  dueDate: string;
  announcementDate: string;
  audience: TeachingAnnouncementAudience;
  channel: TeachingAnnouncementChannel;
  status: TeachingAnnouncementStatus;
  announcementSubject: string;
  announcementBody: string;
  taEmailSubject: string;
  taEmailBody: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TeachingAnnouncementAlert = {
  id: string;
  courseId: string;
  reminderId: string;
  title: string;
  itemName: string;
  dueDate?: string;
  announcementDate?: string;
  priority: TeachingAttentionPriority;
  nextAction: string;
};

export type TeachingMeeting = {
  id: string;
  courseId: string;
  week: string;
  date: string;
  topic: string;
  readings: string;
  due: string;
  notes: string;
  changeNextTime: string;
  canceled: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type TeachingPrepSession = {
  id: string;
  courseId: string;
  meetingId?: string;
  week: string;
  topic: string;
  slides: string;
  plan: string;
  nextAction: string;
  prepChecklist?: {
    iconPageReady?: boolean;
    lectureNotesDrafted?: boolean;
    slidesPrepped?: boolean;
    quizPrepared?: boolean;
    homeworkPrepared?: boolean;
    inClassActivityPrepped?: boolean;
  };
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeachingGradingItem = {
  id: string;
  courseId: string;
  assignment: string;
  assignmentType?:
    | "homework"
    | "quiz"
    | "exam"
    | "paper"
    | "discussion"
    | "project"
    | "other";
  dueDate: string;
  scoresText: string;
  missing: string;
  status: TeachingGradingStatus;
  returnedDate?: string;
  notes: string;
  nextAction: string;
  spoonCost?: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
};

export type TeachingTaItem = {
  id: string;
  courseId: string;
  taId?: string;
  taName: string;
  task: string;
  assignmentName?: string;
  assignmentDueDate?: string;
  reminderDueDate?: string;
  followUpDueDate?: string;
  status?: "open" | "waiting" | "completed";
  category?:
    | "grading"
    | "discussion"
    | "student-support"
    | "prep"
    | "admin"
    | "other";
  dueDate: string;
  notes: string;
  weeklyComment: string;
  nextAction: string;
  rubricIncluded?: boolean;
  rubricLink?: string;
  rubricReminderEnabled?: boolean;
  taInstructions?: string;
  taInstructionsIncluded?: boolean;
  gradeNormingEnabled?: boolean;
  gradeNormingReminderDate?: string;
  gradeNormingCompleted?: boolean;
  gradeNormingCompletedAt?: string;
  gradeNormingNotes?: string;
  rubricShared?: boolean;
  samplePapersReviewed?: boolean;
  deadlineClarified?: boolean;
  followUpSent?: boolean;
  studentConcernEscalated?: boolean;
  initialReminderSentAt?: string;
  followUpReminderSentAt?: string;
  reminderCount?: number;
  reminderHistory?: Array<{
    id: string;
    type: TeachingReminderHistoryType;
    sentAt: string;
    subject: string;
    body: string;
  }>;
  gradingReportedComplete?: boolean;
  gradingCompletedAt?: string;
  emailTemplateType?: TeachingEmailTemplateType;
  lastEmailSubject?: string;
  lastEmailBody?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeachingOfficeHourVisit = {
  id: string;
  courseId: string;
  student: string;
  visitType?: "office-hours" | "email" | "zoom" | "after-class" | "other";
  status?: "open" | "waiting" | "resolved";
  concern: string;
  followUp: string;
  visitDate: string;
  nextAction: string;
  followUpCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeachingCourseNote = {
  id: string;
  courseId: string;
  title: string;
  body: string;
  tags: string[];
  noteType: TeachingCourseNoteType;
  createdAt: string;
  updatedAt: string;
};

export type TeachingResource = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  url: string;
  fileName: string;
  resourceType: TeachingResourceType;
  faqCategory?: string;
  shortAnswer?: string;
  reusable?: boolean;
  nextAction?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TeachingCourseTemplate = {
  id: string;
  name: string;
  codePattern?: string;
  titlePattern?: string;
  meetingPattern?: string;
  prepChecklist: string[];
  gradingCategories: string[];
  resourceCategories: string[];
  taSupported?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type NewTeachingCourseTemplateInput = Omit<
  TeachingCourseTemplate,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateTeachingCourseTemplateInput =
  Partial<NewTeachingCourseTemplateInput>;

export type TeachingCourseRolloverInput = {
  sourceCourseId: string;
  semesterId: string;
  code: string;
  title: string;
  section?: string;
  meetingPattern?: string;
  location?: string;
  notes?: string;
  copyPrep?: boolean;
  copyResources?: boolean;
  copyGradingCategories?: boolean;
  copyNotes?: boolean;
};

export type TeachingAttentionItem = {
  id: string;
  courseId: string;
  type: TeachingAttentionType;
  title: string;
  detail: string;
  dueDate?: string;
  priority: TeachingAttentionPriority;
  nextAction: string;
  sourceId: string;
  sourceType: string;
};

export type TeachingSuggestionKind =
  | "task"
  | "announcement"
  | "grading"
  | "prep"
  | "ta"
  | "resource"
  | "note";

export type TeachingSuggestionTargetType =
  | "gradingItem"
  | "prepSession"
  | "announcement"
  | "taItem"
  | "resource"
  | "courseNote"
  | "sharedTask";

export type TeachingSuggestion = {
  id: string;
  key: string;
  title: string;
  description: string;
  suggestedDate?: string;
  suggestedTime?: string;
  kind: TeachingSuggestionKind;
  targetType: TeachingSuggestionTargetType;
  areaLabel: string;
  contextLabel: string;
  sourceId: string;
  sourceType: string;
  checkedByDefault: boolean;
  lowEnergyFriendly: boolean;
  spoonCost?: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes?: number;
  reason: string;
};

export type NewTeachingMeetingInput = Omit<
  TeachingMeeting,
  "id" | "createdAt" | "updatedAt"
>;

export type NewTeachingAssistantInput = Omit<
  TeachingAssistant,
  "id" | "createdAt" | "updatedAt"
>;

export type NewTeachingPrepSessionInput = Omit<
  TeachingPrepSession,
  "id" | "createdAt" | "updatedAt"
>;

export type NewTeachingGradingItemInput = Omit<
  TeachingGradingItem,
  "id" | "createdAt" | "updatedAt"
>;

export type NewTeachingTaItemInput = Omit<
  TeachingTaItem,
  "id" | "createdAt" | "updatedAt"
>;

export type NewTeachingOfficeHourVisitInput = Omit<
  TeachingOfficeHourVisit,
  "id" | "createdAt" | "updatedAt"
>;

export type NewTeachingCourseNoteInput = Omit<
  TeachingCourseNote,
  "id" | "createdAt" | "updatedAt"
>;

export type NewTeachingResourceInput = Omit<
  TeachingResource,
  "id" | "createdAt" | "updatedAt"
>;

export type NewTeachingAnnouncementReminderInput = Omit<
  TeachingAnnouncementReminder,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateTeachingMeetingInput = Partial<NewTeachingMeetingInput>;
export type UpdateTeachingAssistantInput = Partial<NewTeachingAssistantInput>;
export type UpdateTeachingPrepSessionInput =
  Partial<NewTeachingPrepSessionInput>;
export type UpdateTeachingGradingItemInput =
  Partial<NewTeachingGradingItemInput>;
export type UpdateTeachingTaItemInput = Partial<NewTeachingTaItemInput>;
export type UpdateTeachingOfficeHourVisitInput =
  Partial<NewTeachingOfficeHourVisitInput>;
export type UpdateTeachingCourseNoteInput = Partial<NewTeachingCourseNoteInput>;
export type UpdateTeachingResourceInput = Partial<NewTeachingResourceInput>;
export type UpdateTeachingAnnouncementReminderInput =
  Partial<NewTeachingAnnouncementReminderInput>;
