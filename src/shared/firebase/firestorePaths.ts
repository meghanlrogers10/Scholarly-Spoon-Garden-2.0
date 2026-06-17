export function getUserFirestorePaths(uid: string) {
  const userRoot = `users/${uid}`;

  return {
    userRoot,
    profileSettings: `${userRoot}/profile/settings`,
    appSettings: `${userRoot}/profile/appSettings`,
    appStatus: `${userRoot}/profile/appStatus`,
    tasks: `${userRoot}/tasks`,
    dailyCheckIns: `${userRoot}/dailyCheckIns`,
    workingBlocks: `${userRoot}/workingBlocks`,
    plannedTaskBlocks: `${userRoot}/plannedTaskBlocks`,
    endOfDayReviews: `${userRoot}/endOfDayReviews`,
    timerSessions: `${userRoot}/timerSessions`,
    manualWorkLogs: `${userRoot}/manualWorkLogs`,
    mindspace: `${userRoot}/mindspace`,
    research: `${userRoot}/research`,
    researchProjects: `${userRoot}/researchProjects`,
    researchTasks: `${userRoot}/researchTasks`,
    researchLogEntries: `${userRoot}/researchLogEntries`,
    researchDrafts: `${userRoot}/researchDrafts`,
    researchSubmissions: `${userRoot}/researchSubmissions`,
    researchLiteratureSources: `${userRoot}/researchLiteratureSources`,
    researchLiteratureNotes: `${userRoot}/researchLiteratureNotes`,
    researchReadingNotes: `${userRoot}/researchReadingNotes`,
    researchMindMapNodes: `${userRoot}/researchMindMapNodes`,
    researchSynthesisSections: `${userRoot}/researchSynthesisSections`,
    researchPrismaRecords: `${userRoot}/researchPrismaRecords`,
    researchPrismaCriteria: `${userRoot}/researchPrismaCriteria`,
    teaching: `${userRoot}/teaching`,
    teachingSemesters: `${userRoot}/teachingSemesters`,
    teachingCourses: `${userRoot}/teachingCourses`,
    teachingMeetings: `${userRoot}/teachingMeetings`,
    teachingPrepSessions: `${userRoot}/teachingPrepSessions`,
    teachingGradingItems: `${userRoot}/teachingGradingItems`,
    teachingTaItems: `${userRoot}/teachingTaItems`,
    teachingAssistants: `${userRoot}/teachingAssistants`,
    teachingOfficeHourVisits: `${userRoot}/teachingOfficeHourVisits`,
    teachingCourseNotes: `${userRoot}/teachingCourseNotes`,
    teachingResources: `${userRoot}/teachingResources`,
    teachingAnnouncementReminders: `${userRoot}/teachingAnnouncementReminders`,
    teachingCourseTemplates: `${userRoot}/teachingCourseTemplates`,
    service: `${userRoot}/service`,
    serviceItems: `${userRoot}/serviceItems`,
    serviceCommittees: `${userRoot}/serviceCommittees`,
    advisingStudents: `${userRoot}/advisingStudents`,
    serviceReviewLetters: `${userRoot}/serviceReviewLetters`,
    serviceAdminItems: `${userRoot}/serviceAdminItems`,
    serviceBoundaryLessons: `${userRoot}/serviceBoundaryLessons`,
  };
}

export function getAppStatusDocumentSegments(uid: string) {
  return ["users", uid, "profile", "appStatus"] as const;
}

export function getUserAppSettingsDocumentSegments(uid: string) {
  return ["users", uid, "profile", "appSettings"] as const;
}

export function getUserTasksCollectionSegments(uid: string) {
  return ["users", uid, "tasks"] as const;
}

export function getUserTaskDocumentSegments(uid: string, taskId: string) {
  return ["users", uid, "tasks", taskId] as const;
}

export function getUserDailyCheckInsCollectionSegments(uid: string) {
  return ["users", uid, "dailyCheckIns"] as const;
}

export function getUserDailyCheckInDocumentSegments(uid: string, dateOrId: string) {
  return ["users", uid, "dailyCheckIns", dateOrId] as const;
}

export function getUserWorkingBlocksCollectionSegments(uid: string) {
  return ["users", uid, "workingBlocks"] as const;
}

export function getUserWorkingBlockDocumentSegments(uid: string, blockId: string) {
  return ["users", uid, "workingBlocks", blockId] as const;
}

export function getUserPlannedTaskBlocksCollectionSegments(uid: string) {
  return ["users", uid, "plannedTaskBlocks"] as const;
}

export function getUserPlannedTaskBlockDocumentSegments(
  uid: string,
  blockId: string,
) {
  return ["users", uid, "plannedTaskBlocks", blockId] as const;
}

export function getUserEndOfDayReviewsCollectionSegments(uid: string) {
  return ["users", uid, "endOfDayReviews"] as const;
}

export function getUserEndOfDayReviewDocumentSegments(
  uid: string,
  dateOrId: string,
) {
  return ["users", uid, "endOfDayReviews", dateOrId] as const;
}

export function getUserTimerSessionsCollectionSegments(uid: string) {
  return ["users", uid, "timerSessions"] as const;
}

export function getUserTimerSessionDocumentSegments(
  uid: string,
  sessionId: string,
) {
  return ["users", uid, "timerSessions", sessionId] as const;
}

export function getUserManualWorkLogsCollectionSegments(uid: string) {
  return ["users", uid, "manualWorkLogs"] as const;
}

export function getUserManualWorkLogDocumentSegments(uid: string, logId: string) {
  return ["users", uid, "manualWorkLogs", logId] as const;
}

export function getUserMindspaceItemsCollectionSegments(uid: string) {
  return ["users", uid, "mindspaceItems"] as const;
}

export function getUserMindspaceItemDocumentSegments(uid: string, itemId: string) {
  return ["users", uid, "mindspaceItems", itemId] as const;
}

export function getUserMindspaceGoalsCollectionSegments(uid: string) {
  return ["users", uid, "mindspaceGoals"] as const;
}

export function getUserMindspaceGoalDocumentSegments(uid: string, goalId: string) {
  return ["users", uid, "mindspaceGoals", goalId] as const;
}

export function getUserResearchProjectsCollectionSegments(uid: string) {
  return ["users", uid, "researchProjects"] as const;
}

export function getUserResearchProjectDocumentSegments(
  uid: string,
  projectId: string,
) {
  return ["users", uid, "researchProjects", projectId] as const;
}

export function getUserResearchTasksCollectionSegments(uid: string) {
  return ["users", uid, "researchTasks"] as const;
}

export function getUserResearchTaskDocumentSegments(uid: string, taskId: string) {
  return ["users", uid, "researchTasks", taskId] as const;
}

export function getUserResearchLogEntriesCollectionSegments(uid: string) {
  return ["users", uid, "researchLogEntries"] as const;
}

export function getUserResearchLogEntryDocumentSegments(
  uid: string,
  entryId: string,
) {
  return ["users", uid, "researchLogEntries", entryId] as const;
}

export function getUserResearchDraftsCollectionSegments(uid: string) {
  return ["users", uid, "researchDrafts"] as const;
}

export function getUserResearchDraftDocumentSegments(
  uid: string,
  draftId: string,
) {
  return ["users", uid, "researchDrafts", draftId] as const;
}

export function getUserResearchSubmissionsCollectionSegments(uid: string) {
  return ["users", uid, "researchSubmissions"] as const;
}

export function getUserResearchSubmissionDocumentSegments(
  uid: string,
  submissionId: string,
) {
  return ["users", uid, "researchSubmissions", submissionId] as const;
}

export function getUserResearchLiteratureSourcesCollectionSegments(uid: string) {
  return ["users", uid, "researchLiteratureSources"] as const;
}

export function getUserResearchLiteratureSourceDocumentSegments(
  uid: string,
  sourceId: string,
) {
  return ["users", uid, "researchLiteratureSources", sourceId] as const;
}

export function getUserResearchLiteratureNotesCollectionSegments(uid: string) {
  return ["users", uid, "researchLiteratureNotes"] as const;
}

export function getUserResearchLiteratureNoteDocumentSegments(
  uid: string,
  noteId: string,
) {
  return ["users", uid, "researchLiteratureNotes", noteId] as const;
}

export function getUserResearchReadingNotesCollectionSegments(uid: string) {
  return ["users", uid, "researchReadingNotes"] as const;
}

export function getUserResearchReadingNoteDocumentSegments(
  uid: string,
  noteId: string,
) {
  return ["users", uid, "researchReadingNotes", noteId] as const;
}

export function getUserResearchMindMapNodesCollectionSegments(uid: string) {
  return ["users", uid, "researchMindMapNodes"] as const;
}

export function getUserResearchMindMapNodeDocumentSegments(
  uid: string,
  nodeId: string,
) {
  return ["users", uid, "researchMindMapNodes", nodeId] as const;
}

export function getUserResearchSynthesisSectionsCollectionSegments(uid: string) {
  return ["users", uid, "researchSynthesisSections"] as const;
}

export function getUserResearchSynthesisSectionDocumentSegments(
  uid: string,
  sectionId: string,
) {
  return ["users", uid, "researchSynthesisSections", sectionId] as const;
}

export function getUserResearchPrismaRecordsCollectionSegments(uid: string) {
  return ["users", uid, "researchPrismaRecords"] as const;
}

export function getUserResearchPrismaRecordDocumentSegments(
  uid: string,
  recordId: string,
) {
  return ["users", uid, "researchPrismaRecords", recordId] as const;
}

export function getUserResearchPrismaCriteriaCollectionSegments(uid: string) {
  return ["users", uid, "researchPrismaCriteria"] as const;
}

export function getUserResearchPrismaCriteriaDocumentSegments(
  uid: string,
  projectId: string,
) {
  return ["users", uid, "researchPrismaCriteria", projectId] as const;
}

export function getUserTeachingSemestersCollectionSegments(uid: string) {
  return ["users", uid, "teachingSemesters"] as const;
}

export function getUserTeachingSemesterDocumentSegments(
  uid: string,
  semesterId: string,
) {
  return ["users", uid, "teachingSemesters", semesterId] as const;
}

export function getUserTeachingCoursesCollectionSegments(uid: string) {
  return ["users", uid, "teachingCourses"] as const;
}

export function getUserTeachingCourseDocumentSegments(
  uid: string,
  courseId: string,
) {
  return ["users", uid, "teachingCourses", courseId] as const;
}

export function getUserTeachingMeetingsCollectionSegments(uid: string) {
  return ["users", uid, "teachingMeetings"] as const;
}

export function getUserTeachingMeetingDocumentSegments(
  uid: string,
  meetingId: string,
) {
  return ["users", uid, "teachingMeetings", meetingId] as const;
}

export function getUserTeachingPrepSessionsCollectionSegments(uid: string) {
  return ["users", uid, "teachingPrepSessions"] as const;
}

export function getUserTeachingPrepSessionDocumentSegments(
  uid: string,
  prepId: string,
) {
  return ["users", uid, "teachingPrepSessions", prepId] as const;
}

export function getUserTeachingGradingItemsCollectionSegments(uid: string) {
  return ["users", uid, "teachingGradingItems"] as const;
}

export function getUserTeachingGradingItemDocumentSegments(
  uid: string,
  gradingItemId: string,
) {
  return ["users", uid, "teachingGradingItems", gradingItemId] as const;
}

export function getUserTeachingTaItemsCollectionSegments(uid: string) {
  return ["users", uid, "teachingTaItems"] as const;
}

export function getUserTeachingTaItemDocumentSegments(
  uid: string,
  taItemId: string,
) {
  return ["users", uid, "teachingTaItems", taItemId] as const;
}

export function getUserTeachingAssistantsCollectionSegments(uid: string) {
  return ["users", uid, "teachingAssistants"] as const;
}

export function getUserTeachingAssistantDocumentSegments(
  uid: string,
  assistantId: string,
) {
  return ["users", uid, "teachingAssistants", assistantId] as const;
}

export function getUserTeachingOfficeHourVisitsCollectionSegments(uid: string) {
  return ["users", uid, "teachingOfficeHourVisits"] as const;
}

export function getUserTeachingOfficeHourVisitDocumentSegments(
  uid: string,
  visitId: string,
) {
  return ["users", uid, "teachingOfficeHourVisits", visitId] as const;
}

export function getUserTeachingCourseNotesCollectionSegments(uid: string) {
  return ["users", uid, "teachingCourseNotes"] as const;
}

export function getUserTeachingCourseNoteDocumentSegments(
  uid: string,
  noteId: string,
) {
  return ["users", uid, "teachingCourseNotes", noteId] as const;
}

export function getUserTeachingResourcesCollectionSegments(uid: string) {
  return ["users", uid, "teachingResources"] as const;
}

export function getUserTeachingResourceDocumentSegments(
  uid: string,
  resourceId: string,
) {
  return ["users", uid, "teachingResources", resourceId] as const;
}

export function getUserTeachingAnnouncementRemindersCollectionSegments(
  uid: string,
) {
  return ["users", uid, "teachingAnnouncementReminders"] as const;
}

export function getUserTeachingAnnouncementReminderDocumentSegments(
  uid: string,
  reminderId: string,
) {
  return ["users", uid, "teachingAnnouncementReminders", reminderId] as const;
}

export function getUserTeachingCourseTemplatesCollectionSegments(uid: string) {
  return ["users", uid, "teachingCourseTemplates"] as const;
}

export function getUserTeachingCourseTemplateDocumentSegments(
  uid: string,
  templateId: string,
) {
  return ["users", uid, "teachingCourseTemplates", templateId] as const;
}

export function getUserServiceItemsCollectionSegments(uid: string) {
  return ["users", uid, "serviceItems"] as const;
}

export function getUserServiceItemDocumentSegments(uid: string, itemId: string) {
  return ["users", uid, "serviceItems", itemId] as const;
}

export function getUserServiceCommitteesCollectionSegments(uid: string) {
  return ["users", uid, "serviceCommittees"] as const;
}

export function getUserServiceCommitteeDocumentSegments(
  uid: string,
  committeeId: string,
) {
  return ["users", uid, "serviceCommittees", committeeId] as const;
}

export function getUserAdvisingStudentsCollectionSegments(uid: string) {
  return ["users", uid, "advisingStudents"] as const;
}

export function getUserAdvisingStudentDocumentSegments(
  uid: string,
  studentId: string,
) {
  return ["users", uid, "advisingStudents", studentId] as const;
}

export function getUserServiceReviewLettersCollectionSegments(uid: string) {
  return ["users", uid, "serviceReviewLetters"] as const;
}

export function getUserServiceReviewLetterDocumentSegments(
  uid: string,
  recordId: string,
) {
  return ["users", uid, "serviceReviewLetters", recordId] as const;
}

export function getUserServiceAdminItemsCollectionSegments(uid: string) {
  return ["users", uid, "serviceAdminItems"] as const;
}

export function getUserServiceAdminItemDocumentSegments(
  uid: string,
  recordId: string,
) {
  return ["users", uid, "serviceAdminItems", recordId] as const;
}

export function getUserServiceBoundaryLessonsCollectionSegments(uid: string) {
  return ["users", uid, "serviceBoundaryLessons"] as const;
}

export function getUserServiceBoundaryLessonDocumentSegments(
  uid: string,
  lessonId: string,
) {
  return ["users", uid, "serviceBoundaryLessons", lessonId] as const;
}
