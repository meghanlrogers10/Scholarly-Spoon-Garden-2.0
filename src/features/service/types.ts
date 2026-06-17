export type ServiceBucket =
  | "committee"
  | "review-letter"
  | "advising"
  | "admin-other";

export type ServiceStatus =
  | "inbox"
  | "requested"
  | "accepted"
  | "in-progress"
  | "waiting-on-me"
  | "waiting-on-others"
  | "done"
  | "declined"
  | "archived";

export type SpoonCost = 1 | 2 | 3 | 4 | 5;

export type ServiceItem = {
  id: string;
  isSampleData?: boolean;
  source?: "sample-data";
  title: string;
  bucket: ServiceBucket;
  status: ServiceStatus;
  dueDate?: string;
  nextAction: string;
  spoonCost?: SpoonCost;
  estimatedMinutes?: number;
  highStakes?: boolean;
  confidential?: boolean;
  waitingOn?: string;
  relatedCommitteeId?: string;
  relatedStudentId?: string;
  link?: string;
  boundaryNote?: string;
  neverAgain?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewServiceItemInput = {
  title: string;
  bucket: ServiceBucket;
  status: ServiceStatus;
  dueDate?: string;
  nextAction: string;
  spoonCost?: SpoonCost;
  estimatedMinutes?: number;
  highStakes?: boolean;
  confidential?: boolean;
  waitingOn?: string;
  relatedCommitteeId?: string;
  relatedStudentId?: string;
  link?: string;
  boundaryNote?: string;
  neverAgain?: boolean;
};

export type UpdateServiceItemInput = Partial<NewServiceItemInput>;

export type CommitteeStatus = "active" | "archived";

export type CommitteeLoadRating = "light" | "moderate" | "heavy";

export type Committee = {
  id: string;
  isSampleData?: boolean;
  source?: "sample-data";
  name: string;
  role?: string;
  term?: string;
  status: CommitteeStatus;
  nextMeeting?: string;
  nextAction?: string;
  loadRating?: CommitteeLoadRating;
  notes?: string;
  boundaryNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type NewCommitteeInput = {
  name: string;
  role?: string;
  term?: string;
  nextMeeting?: string;
  nextAction?: string;
  loadRating?: CommitteeLoadRating;
  notes?: string;
  boundaryNote?: string;
};

export type UpdateCommitteeInput = Partial<NewCommitteeInput> & {
  status?: CommitteeStatus;
};

export type AdvisingMilestoneName =
  | "Coursework"
  | "MA"
  | "Comps"
  | "Prospectus"
  | "Prospectus Defense"
  | "Dissertation Drafts"
  | "Defense"
  | "Job Market";

export type AdvisingMilestoneStatus =
  | "not-started"
  | "in-progress"
  | "done"
  | "stalled"
  | "not-applicable";

export type AdvisingMilestone = {
  id: string;
  name: AdvisingMilestoneName;
  status: AdvisingMilestoneStatus;
  targetDate?: string;
  completedDate?: string;
  notes?: string;
  nextAction?: string;
};

export type CareerGoal =
  | "R1 faculty"
  | "R2 / regional university faculty"
  | "SLAC / teaching-focused faculty"
  | "Community college"
  | "Research institute"
  | "Government"
  | "Nonprofit"
  | "Industry"
  | "Policy work"
  | "Non-academic"
  | "Unsure / exploring";

export type AdvisingRole = "chair" | "committee" | "mentor" | "informal";

export type AdvisingStudentStatus = "active" | "archived";

export type SemesterGoalStatus =
  | "not-started"
  | "in-progress"
  | "reached"
  | "revised"
  | "stalled";

export type AdvisingStudent = {
  id: string;
  isSampleData?: boolean;
  source?: "sample-data";
  name: string;
  program?: string;
  role: AdvisingRole;
  status: AdvisingStudentStatus;
  stage?: AdvisingMilestoneName;
  lastContactDate?: string;
  nextMeetingDate?: string;
  currentSemester?: string;
  semesterGoal?: string;
  semesterGoalStatus?: SemesterGoalStatus;
  semesterGoalOutcome?: string;
  advisorSupportPlan?: string;
  ultimateGoal?: CareerGoal;
  alternateGoal?: string;
  advisingMemory?: string;
  milestones: AdvisingMilestone[];
  createdAt: string;
  updatedAt: string;
};

export type NewAdvisingStudentInput = {
  name: string;
  program?: string;
  role: AdvisingRole;
  stage?: AdvisingMilestoneName;
  lastContactDate?: string;
  nextMeetingDate?: string;
  currentSemester?: string;
  semesterGoal?: string;
  semesterGoalStatus?: SemesterGoalStatus;
  semesterGoalOutcome?: string;
  advisorSupportPlan?: string;
  ultimateGoal?: CareerGoal;
  alternateGoal?: string;
  advisingMemory?: string;
  milestones?: AdvisingMilestone[];
};

export type UpdateAdvisingStudentInput = Partial<NewAdvisingStudentInput> & {
  status?: AdvisingStudentStatus;
};

export type ReviewLetterType =
  | "peer-review"
  | "tenure-promotion-letter"
  | "recommendation-letter"
  | "manuscript-review"
  | "grant-review"
  | "other";

export type ReviewLetterStatus =
  | "not-started"
  | "in-progress"
  | "waiting"
  | "submitted"
  | "declined"
  | "archived";

export type ReviewLetter = {
  id: string;
  title: string;
  type: ReviewLetterType;
  status: ReviewLetterStatus;
  dueDate?: string;
  requestedBy?: string;
  organization?: string;
  nextAction?: string;
  waitingOn?: string;
  spoonCost?: SpoonCost;
  estimatedMinutes?: number;
  notes?: string;
  boundaryNote?: string;
  neverAgain?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewReviewLetterInput = {
  title: string;
  type: ReviewLetterType;
  status: ReviewLetterStatus;
  dueDate?: string;
  requestedBy?: string;
  organization?: string;
  nextAction?: string;
  waitingOn?: string;
  spoonCost?: SpoonCost;
  estimatedMinutes?: number;
  notes?: string;
  boundaryNote?: string;
  neverAgain?: boolean;
};

export type UpdateReviewLetterInput = Partial<NewReviewLetterInput>;

export type ServiceAdminType =
  | "admin-task"
  | "form"
  | "meeting-follow-up"
  | "report"
  | "email"
  | "policy"
  | "event"
  | "other";

export type ServiceAdminStatus =
  | "not-started"
  | "in-progress"
  | "waiting"
  | "done"
  | "archived";

export type ServiceAdminItem = {
  id: string;
  title: string;
  type: ServiceAdminType;
  status: ServiceAdminStatus;
  dueDate?: string;
  nextAction?: string;
  waitingOn?: string;
  spoonCost?: SpoonCost;
  estimatedMinutes?: number;
  notes?: string;
  recurring?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewServiceAdminItemInput = {
  title: string;
  type: ServiceAdminType;
  status: ServiceAdminStatus;
  dueDate?: string;
  nextAction?: string;
  waitingOn?: string;
  spoonCost?: SpoonCost;
  estimatedMinutes?: number;
  notes?: string;
  recurring?: boolean;
};

export type UpdateServiceAdminItemInput = Partial<NewServiceAdminItemInput>;

export type ServiceBoundaryStatus = "active-lesson" | "archived-lesson";

export type ServiceBoundaryLesson = {
  id: string;
  commitment: string;
  whyCostly?: string;
  warningSign?: string;
  futureBoundary?: string;
  relatedKind?: "service-item" | "review-letter" | "admin-other" | "committee";
  relatedId?: string;
  status: ServiceBoundaryStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewServiceBoundaryLessonInput = {
  commitment: string;
  whyCostly?: string;
  warningSign?: string;
  futureBoundary?: string;
  relatedKind?: ServiceBoundaryLesson["relatedKind"];
  relatedId?: string;
  status: ServiceBoundaryStatus;
};

export type UpdateServiceBoundaryLessonInput =
  Partial<NewServiceBoundaryLessonInput>;
