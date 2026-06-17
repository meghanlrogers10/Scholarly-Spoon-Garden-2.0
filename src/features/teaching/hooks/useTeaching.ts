import { useMemo } from "react";
import {
  TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY,
  TEACHING_ASSISTANTS_STORAGE_KEY,
  TEACHING_COURSE_NOTES_STORAGE_KEY,
  TEACHING_COURSE_TEMPLATES_STORAGE_KEY,
  TEACHING_COURSES_STORAGE_KEY,
  TEACHING_GRADING_ITEMS_STORAGE_KEY,
  TEACHING_MEETINGS_STORAGE_KEY,
  TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY,
  TEACHING_PREP_SESSIONS_STORAGE_KEY,
  TEACHING_RESOURCES_STORAGE_KEY,
  TEACHING_SEMESTERS_STORAGE_KEY,
  TEACHING_TA_ITEMS_STORAGE_KEY,
} from "../../../shared/constants/teachingStorage";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import type {
  NewTeachingCourseInput,
  NewTeachingCourseTemplateInput,
  NewTeachingCourseNoteInput,
  NewTeachingAnnouncementReminderInput,
  NewTeachingAssistantInput,
  NewTeachingGradingItemInput,
  NewTeachingMeetingInput,
  NewTeachingOfficeHourVisitInput,
  NewTeachingPrepSessionInput,
  NewTeachingResourceInput,
  NewTeachingSemesterInput,
  NewTeachingTaItemInput,
  TeachingAttentionItem,
  TeachingAttentionPriority,
  TeachingAnnouncementAlert,
  TeachingAnnouncementReminder,
  TeachingAssistant,
  TeachingCourse,
  TeachingCourseRolloverInput,
  TeachingCourseTemplate,
  TeachingCourseNote,
  TeachingGradingItem,
  TeachingMeeting,
  TeachingOfficeHourVisit,
  TeachingPrepSession,
  TeachingResource,
  TeachingSemester,
  TeachingTaItem,
  TeachingTaReminderAlert,
  UpdateTeachingAnnouncementReminderInput,
  UpdateTeachingAssistantInput,
  UpdateTeachingCourseInput,
  UpdateTeachingCourseTemplateInput,
  UpdateTeachingCourseNoteInput,
  UpdateTeachingGradingItemInput,
  UpdateTeachingMeetingInput,
  UpdateTeachingOfficeHourVisitInput,
  UpdateTeachingPrepSessionInput,
  UpdateTeachingResourceInput,
  UpdateTeachingSemesterInput,
  UpdateTeachingTaItemInput,
} from "../types";

type TeachingRecord = {
  id: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
};

function sortSemesters(semesters: TeachingSemester[]) {
  return [...semesters].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }

    const yearCompare = b.year.localeCompare(a.year);

    if (yearCompare !== 0) {
      return yearCompare;
    }

    return a.name.localeCompare(b.name);
  });
}

function sortCourses(courses: TeachingCourse[]) {
  return [...courses].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }

    return `${a.code} ${a.title}`.localeCompare(`${b.code} ${b.title}`);
  });
}

function sortByUpdatedAt<T extends { updatedAt: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function sortByDate<T extends { dueDate?: string; date?: string; visitDate?: string }>(
  items: T[]
) {
  return [...items].sort((a, b) =>
    (a.dueDate ?? a.date ?? a.visitDate ?? "").localeCompare(
      b.dueDate ?? b.date ?? b.visitDate ?? ""
    )
  );
}

function cleanOptionalValue(value?: string) {
  const cleanedValue = value?.trim();

  return cleanedValue ? cleanedValue : undefined;
}

function createRecord<TInput extends object, TRecord extends TeachingRecord>(
  input: TInput,
  fallback: Omit<TRecord, keyof TInput | "id" | "createdAt" | "updatedAt">
) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ...fallback,
    ...input,
    createdAt: now,
    updatedAt: now,
  } as unknown as TRecord;
}

function getDateDistanceInDays(value?: string) {
  if (!value) {
    return undefined;
  }

  const target = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timestamp = target.getTime();

  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return Math.ceil((timestamp - today.getTime()) / 86_400_000);
}

function priorityForDueDate(value?: string): TeachingAttentionPriority {
  const distance = getDateDistanceInDays(value);

  if (distance === undefined) {
    return "low";
  }

  if (distance < 0 || distance <= 2) {
    return "high";
  }

  if (distance <= 7) {
    return "medium";
  }

  return "low";
}

function createAttentionItem(input: Omit<TeachingAttentionItem, "priority">) {
  return {
    ...input,
    priority: priorityForDueDate(input.dueDate),
  };
}

function dateIsTodayOrPast(value?: string) {
  const distance = getDateDistanceInDays(value);
  return distance !== undefined && distance <= 0;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function useTeaching() {
  const [semesters, setSemesters] = useLocalStorage<TeachingSemester[]>(
    TEACHING_SEMESTERS_STORAGE_KEY,
    []
  );

  const [courses, setCourses] = useLocalStorage<TeachingCourse[]>(
    TEACHING_COURSES_STORAGE_KEY,
    []
  );

  const [meetings, setMeetings] = useLocalStorage<TeachingMeeting[]>(
    TEACHING_MEETINGS_STORAGE_KEY,
    []
  );

  const [prepSessions, setPrepSessions] = useLocalStorage<
    TeachingPrepSession[]
  >(TEACHING_PREP_SESSIONS_STORAGE_KEY, []);

  const [gradingItems, setGradingItems] = useLocalStorage<TeachingGradingItem[]>(
    TEACHING_GRADING_ITEMS_STORAGE_KEY,
    []
  );

  const [taItems, setTaItems] = useLocalStorage<TeachingTaItem[]>(
    TEACHING_TA_ITEMS_STORAGE_KEY,
    []
  );

  const [teachingAssistants, setTeachingAssistants] = useLocalStorage<
    TeachingAssistant[]
  >(TEACHING_ASSISTANTS_STORAGE_KEY, []);

  const [officeHourVisits, setOfficeHourVisits] = useLocalStorage<
    TeachingOfficeHourVisit[]
  >(TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY, []);

  const [courseNotes, setCourseNotes] = useLocalStorage<TeachingCourseNote[]>(
    TEACHING_COURSE_NOTES_STORAGE_KEY,
    []
  );

  const [resources, setResources] = useLocalStorage<TeachingResource[]>(
    TEACHING_RESOURCES_STORAGE_KEY,
    []
  );

  const [announcementReminders, setAnnouncementReminders] = useLocalStorage<
    TeachingAnnouncementReminder[]
  >(TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY, []);

  const [courseTemplates, setCourseTemplates] = useLocalStorage<
    TeachingCourseTemplate[]
  >(TEACHING_COURSE_TEMPLATES_STORAGE_KEY, []);

  const activeSemesters = useMemo(
    () =>
      sortSemesters(semesters.filter((semester) => semester.status === "active")),
    [semesters]
  );

  const archivedSemesters = useMemo(
    () =>
      sortSemesters(
        semesters.filter((semester) => semester.status === "archived")
      ),
    [semesters]
  );

  const activeCourses = useMemo(
    () => sortCourses(courses.filter((course) => course.status === "active")),
    [courses]
  );

  const archivedCourses = useMemo(
    () => sortCourses(courses.filter((course) => course.status === "archived")),
    [courses]
  );

  function createSemester(input: NewTeachingSemesterInput) {
    const now = new Date().toISOString();

    const semester: TeachingSemester = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      term: input.term,
      year: input.year.trim(),
      status: "active",
      startDate: input.startDate || undefined,
      endDate: input.endDate || undefined,
      notes: cleanOptionalValue(input.notes),
      createdAt: now,
      updatedAt: now,
    };

    setSemesters((currentSemesters) => [semester, ...currentSemesters]);

    return semester;
  }

  function updateSemester(
    semesterId: string,
    input: UpdateTeachingSemesterInput
  ) {
    const now = new Date().toISOString();

    setSemesters((currentSemesters) =>
      currentSemesters.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              name: input.name.trim(),
              term: input.term,
              year: input.year.trim(),
              status: input.status ?? semester.status,
              startDate: input.startDate || undefined,
              endDate: input.endDate || undefined,
              notes: cleanOptionalValue(input.notes),
              updatedAt: now,
            }
          : semester
      )
    );
  }

  function archiveSemester(semesterId: string) {
    const now = new Date().toISOString();

    setSemesters((currentSemesters) =>
      currentSemesters.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              status: "archived",
              updatedAt: now,
            }
          : semester
      )
    );

    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.semesterId === semesterId
          ? {
              ...course,
              status: "archived",
              updatedAt: now,
            }
          : course
      )
    );
  }

  function restoreSemester(semesterId: string) {
    const now = new Date().toISOString();

    setSemesters((currentSemesters) =>
      currentSemesters.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              status: "active",
              updatedAt: now,
            }
          : semester
      )
    );
  }

  function createCourse(input: NewTeachingCourseInput) {
    const now = new Date().toISOString();

    const course: TeachingCourse = {
      id: crypto.randomUUID(),
      semesterId: input.semesterId,
      sourceCourseId: cleanOptionalValue(input.sourceCourseId),
      code: input.code.trim(),
      title: input.title.trim(),
      section: cleanOptionalValue(input.section),
      meetingPattern: cleanOptionalValue(input.meetingPattern),
      location: cleanOptionalValue(input.location),
      status: "active",
      notes: cleanOptionalValue(input.notes),
      createdAt: now,
      updatedAt: now,
    };

    setCourses((currentCourses) => [course, ...currentCourses]);

    return course;
  }

  function updateCourse(courseId: string, input: UpdateTeachingCourseInput) {
    const now = new Date().toISOString();

    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              semesterId: input.semesterId,
              sourceCourseId: cleanOptionalValue(input.sourceCourseId),
              code: input.code.trim(),
              title: input.title.trim(),
              section: cleanOptionalValue(input.section),
              meetingPattern: cleanOptionalValue(input.meetingPattern),
              location: cleanOptionalValue(input.location),
              status: input.status ?? course.status,
              notes: cleanOptionalValue(input.notes),
              updatedAt: now,
            }
          : course
      )
    );
  }

  function archiveCourse(courseId: string) {
    const now = new Date().toISOString();

    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              status: "archived",
              updatedAt: now,
            }
          : course
      )
    );
  }

  function restoreCourse(courseId: string) {
    const now = new Date().toISOString();

    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              status: "active",
              updatedAt: now,
            }
          : course
      )
    );
  }

  function createMeeting(input: NewTeachingMeetingInput) {
    const meeting = createRecord<NewTeachingMeetingInput, TeachingMeeting>(
      input,
      {}
    );
    setMeetings((currentMeetings) => [meeting, ...currentMeetings]);
    return meeting;
  }

  function updateMeeting(
    meetingId: string,
    input: UpdateTeachingMeetingInput
  ) {
    const now = new Date().toISOString();

    setMeetings((currentMeetings) =>
      currentMeetings.map((meeting) =>
        meeting.id === meetingId
          ? { ...meeting, ...input, updatedAt: now }
          : meeting
      )
    );
  }

  function deleteMeeting(meetingId: string) {
    setMeetings((currentMeetings) =>
      currentMeetings.filter((meeting) => meeting.id !== meetingId)
    );
  }

  function createPrepSession(input: NewTeachingPrepSessionInput) {
    const prepSession = createRecord<
      NewTeachingPrepSessionInput,
      TeachingPrepSession
    >(input, {});
    setPrepSessions((currentSessions) => [prepSession, ...currentSessions]);
    return prepSession;
  }

  function updatePrepSession(
    prepSessionId: string,
    input: UpdateTeachingPrepSessionInput
  ) {
    const now = new Date().toISOString();

    setPrepSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === prepSessionId
          ? { ...session, ...input, updatedAt: now }
          : session
      )
    );
  }

  function deletePrepSession(prepSessionId: string) {
    setPrepSessions((currentSessions) =>
      currentSessions.filter((session) => session.id !== prepSessionId)
    );
  }

  function createGradingItem(input: NewTeachingGradingItemInput) {
    const gradingItem = createRecord<
      NewTeachingGradingItemInput,
      TeachingGradingItem
    >(input, {});
    setGradingItems((currentItems) => [gradingItem, ...currentItems]);
    return gradingItem;
  }

  function createCourseTemplate(input: NewTeachingCourseTemplateInput) {
    const now = new Date().toISOString();
    const template: TeachingCourseTemplate = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      codePattern: cleanOptionalValue(input.codePattern),
      titlePattern: cleanOptionalValue(input.titlePattern),
      meetingPattern: cleanOptionalValue(input.meetingPattern),
      prepChecklist: input.prepChecklist.filter(Boolean),
      gradingCategories: input.gradingCategories.filter(Boolean),
      resourceCategories: input.resourceCategories.filter(Boolean),
      taSupported: input.taSupported ?? false,
      notes: cleanOptionalValue(input.notes),
      createdAt: now,
      updatedAt: now,
    };

    setCourseTemplates((currentTemplates) => [template, ...currentTemplates]);

    return template;
  }

  function updateCourseTemplate(
    templateId: string,
    input: UpdateTeachingCourseTemplateInput
  ) {
    const now = new Date().toISOString();

    setCourseTemplates((currentTemplates) =>
      currentTemplates.map((template) =>
        template.id === templateId
          ? {
              ...template,
              ...input,
              name: input.name?.trim() ?? template.name,
              codePattern: cleanOptionalValue(input.codePattern) ?? template.codePattern,
              titlePattern:
                cleanOptionalValue(input.titlePattern) ?? template.titlePattern,
              meetingPattern:
                cleanOptionalValue(input.meetingPattern) ?? template.meetingPattern,
              prepChecklist: input.prepChecklist
                ? input.prepChecklist.filter(Boolean)
                : template.prepChecklist,
              gradingCategories: input.gradingCategories
                ? input.gradingCategories.filter(Boolean)
                : template.gradingCategories,
              resourceCategories: input.resourceCategories
                ? input.resourceCategories.filter(Boolean)
                : template.resourceCategories,
              notes: cleanOptionalValue(input.notes) ?? template.notes,
              updatedAt: now,
            }
          : template
      )
    );
  }

  function deleteCourseTemplate(templateId: string) {
    setCourseTemplates((currentTemplates) =>
      currentTemplates.filter((template) => template.id !== templateId)
    );
  }

  function rolloverCourse(input: TeachingCourseRolloverInput) {
    const sourceCourse = getCourseById(input.sourceCourseId);

    if (!sourceCourse) {
      return undefined;
    }

    const newCourse = createCourse({
      semesterId: input.semesterId,
      sourceCourseId: sourceCourse.id,
      code: input.code,
      title: input.title,
      section: input.section,
      meetingPattern: input.meetingPattern || sourceCourse.meetingPattern,
      location: input.location || sourceCourse.location,
      notes: input.notes || sourceCourse.notes,
    });

    if (input.copyPrep) {
      getPrepSessionsForCourse(sourceCourse.id)
        .filter((session) => !session.completed)
        .forEach((session) =>
          createPrepSession({
            courseId: newCourse.id,
            week: session.week,
            topic: session.topic,
            slides: session.slides,
            plan: session.plan,
            nextAction: session.nextAction,
            prepChecklist: session.prepChecklist,
            completed: false,
          })
        );
    }

    if (input.copyResources) {
      getResourcesForCourse(sourceCourse.id).forEach((resource) =>
        createResource({
          courseId: newCourse.id,
          title: resource.title,
          description: resource.description,
          url: resource.url,
          fileName: resource.fileName,
          resourceType: resource.resourceType,
          faqCategory: resource.faqCategory,
          shortAnswer: resource.shortAnswer,
          reusable: resource.reusable,
          nextAction: resource.nextAction,
          dueDate: undefined,
        })
      );
    }

    if (input.copyGradingCategories) {
      const seenCategories = new Set<string>();

      getGradingItemsForCourse(sourceCourse.id).forEach((item) => {
        const category = item.assignmentType ?? "other";

        if (seenCategories.has(category)) {
          return;
        }

        seenCategories.add(category);
        createGradingItem({
          courseId: newCourse.id,
          assignment: `${category} grading`,
          assignmentType: item.assignmentType,
          dueDate: "",
          scoresText: "",
          missing: "",
          status: "pending",
          notes: "Copied as a grading category shell during semester rollover.",
          nextAction: `Set up ${category} grading plan.`,
          spoonCost: item.spoonCost,
          estimatedMinutes: item.estimatedMinutes,
        });
      });
    }

    if (input.copyNotes) {
      getCourseNotesForCourse(sourceCourse.id).forEach((note) =>
        createCourseNote({
          courseId: newCourse.id,
          title: note.title,
          body: note.body,
          noteType: note.noteType,
          tags: note.tags,
        })
      );
    }

    return newCourse;
  }

  function updateGradingItem(
    gradingItemId: string,
    input: UpdateTeachingGradingItemInput
  ) {
    const now = new Date().toISOString();

    setGradingItems((currentItems) =>
      currentItems.map((item) =>
        item.id === gradingItemId ? { ...item, ...input, updatedAt: now } : item
      )
    );
  }

  function deleteGradingItem(gradingItemId: string) {
    setGradingItems((currentItems) =>
      currentItems.filter((item) => item.id !== gradingItemId)
    );
  }

  function createTaItem(input: NewTeachingTaItemInput) {
    const assignmentDueDate = input.assignmentDueDate || input.dueDate;
    const taItem = createRecord<NewTeachingTaItemInput, TeachingTaItem>(
      {
        ...input,
        assignmentDueDate: input.assignmentDueDate || undefined,
        reminderDueDate: input.reminderDueDate || assignmentDueDate || undefined,
        followUpDueDate:
          input.followUpDueDate ||
          (assignmentDueDate ? addDays(assignmentDueDate, 7) : undefined),
        gradingReportedComplete: input.gradingReportedComplete ?? false,
        reminderCount: input.reminderCount ?? 0,
        reminderHistory: input.reminderHistory ?? [],
        rubricReminderEnabled:
          input.rubricReminderEnabled ?? Boolean(input.rubricIncluded),
        gradeNormingEnabled: input.gradeNormingEnabled ?? false,
        gradeNormingCompleted: input.gradeNormingCompleted ?? false,
      },
      {}
    );
    setTaItems((currentItems) => [taItem, ...currentItems]);
    return taItem;
  }

  function updateTaItem(taItemId: string, input: UpdateTeachingTaItemInput) {
    const now = new Date().toISOString();

    setTaItems((currentItems) =>
      currentItems.map((item) =>
        item.id === taItemId ? { ...item, ...input, updatedAt: now } : item
      )
    );
  }

  function deleteTaItem(taItemId: string) {
    setTaItems((currentItems) =>
      currentItems.filter((item) => item.id !== taItemId)
    );
  }

  function createTeachingAssistant(input: NewTeachingAssistantInput) {
    const teachingAssistant = createRecord<
      NewTeachingAssistantInput,
      TeachingAssistant
    >(input, {});
    setTeachingAssistants((currentAssistants) => [
      teachingAssistant,
      ...currentAssistants,
    ]);
    return teachingAssistant;
  }

  function updateTeachingAssistant(
    teachingAssistantId: string,
    input: UpdateTeachingAssistantInput
  ) {
    const now = new Date().toISOString();

    setTeachingAssistants((currentAssistants) =>
      currentAssistants.map((assistant) =>
        assistant.id === teachingAssistantId
          ? { ...assistant, ...input, updatedAt: now }
          : assistant
      )
    );
  }

  function deleteTeachingAssistant(teachingAssistantId: string) {
    setTeachingAssistants((currentAssistants) =>
      currentAssistants.filter((assistant) => assistant.id !== teachingAssistantId)
    );
  }

  function createOfficeHourVisit(input: NewTeachingOfficeHourVisitInput) {
    const visit = createRecord<
      NewTeachingOfficeHourVisitInput,
      TeachingOfficeHourVisit
    >(input, {});
    setOfficeHourVisits((currentVisits) => [visit, ...currentVisits]);
    return visit;
  }

  function updateOfficeHourVisit(
    visitId: string,
    input: UpdateTeachingOfficeHourVisitInput
  ) {
    const now = new Date().toISOString();

    setOfficeHourVisits((currentVisits) =>
      currentVisits.map((visit) =>
        visit.id === visitId ? { ...visit, ...input, updatedAt: now } : visit
      )
    );
  }

  function deleteOfficeHourVisit(visitId: string) {
    setOfficeHourVisits((currentVisits) =>
      currentVisits.filter((visit) => visit.id !== visitId)
    );
  }

  function createCourseNote(input: NewTeachingCourseNoteInput) {
    const note = createRecord<NewTeachingCourseNoteInput, TeachingCourseNote>(
      input,
      {}
    );
    setCourseNotes((currentNotes) => [note, ...currentNotes]);
    return note;
  }

  function updateCourseNote(
    noteId: string,
    input: UpdateTeachingCourseNoteInput
  ) {
    const now = new Date().toISOString();

    setCourseNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId ? { ...note, ...input, updatedAt: now } : note
      )
    );
  }

  function deleteCourseNote(noteId: string) {
    setCourseNotes((currentNotes) =>
      currentNotes.filter((note) => note.id !== noteId)
    );
  }

  function createResource(input: NewTeachingResourceInput) {
    const resource = createRecord<NewTeachingResourceInput, TeachingResource>(
      input,
      {}
    );
    setResources((currentResources) => [resource, ...currentResources]);
    return resource;
  }

  function updateResource(
    resourceId: string,
    input: UpdateTeachingResourceInput
  ) {
    const now = new Date().toISOString();

    setResources((currentResources) =>
      currentResources.map((resource) =>
        resource.id === resourceId
          ? { ...resource, ...input, updatedAt: now }
          : resource
      )
    );
  }

  function deleteResource(resourceId: string) {
    setResources((currentResources) =>
      currentResources.filter((resource) => resource.id !== resourceId)
    );
  }

  function createAnnouncementReminder(
    input: NewTeachingAnnouncementReminderInput
  ) {
    const reminder = createRecord<
      NewTeachingAnnouncementReminderInput,
      TeachingAnnouncementReminder
    >(input, {});
    setAnnouncementReminders((currentReminders) => [reminder, ...currentReminders]);
    return reminder;
  }

  function updateAnnouncementReminder(
    reminderId: string,
    input: UpdateTeachingAnnouncementReminderInput
  ) {
    const now = new Date().toISOString();

    setAnnouncementReminders((currentReminders) =>
      currentReminders.map((reminder) =>
        reminder.id === reminderId
          ? { ...reminder, ...input, updatedAt: now }
          : reminder
      )
    );
  }

  function deleteAnnouncementReminder(reminderId: string) {
    setAnnouncementReminders((currentReminders) =>
      currentReminders.filter((reminder) => reminder.id !== reminderId)
    );
  }

  function getCoursesForSemester(semesterId: string) {
    return sortCourses(courses.filter((course) => course.semesterId === semesterId));
  }

  function getActiveCoursesForSemester(semesterId: string) {
    return sortCourses(
      courses.filter(
        (course) =>
          course.semesterId === semesterId && course.status === "active"
      )
    );
  }

  function getCourseById(courseId?: string) {
    if (!courseId) {
      return undefined;
    }

    return courses.find((course) => course.id === courseId);
  }

  function getSemesterById(semesterId?: string) {
    if (!semesterId) {
      return undefined;
    }

    return semesters.find((semester) => semester.id === semesterId);
  }

  function getMeetingsForCourse(courseId: string) {
    return sortByDate(
      meetings.filter((meeting) => meeting.courseId === courseId)
    ).sort((a, b) => a.order - b.order);
  }

  function getPrepSessionsForCourse(courseId: string) {
    return sortByUpdatedAt(
      prepSessions.filter((session) => session.courseId === courseId)
    );
  }

  function getGradingItemsForCourse(courseId: string) {
    return sortByDate(gradingItems.filter((item) => item.courseId === courseId));
  }

  function getTaItemsForCourse(courseId: string) {
    return sortByDate(taItems.filter((item) => item.courseId === courseId));
  }

  function getTeachingAssistantsForCourse(courseId: string) {
    return sortByUpdatedAt(
      teachingAssistants.filter((assistant) => assistant.courseId === courseId)
    );
  }

  function getOfficeHourVisitsForCourse(courseId: string) {
    return sortByDate(
      officeHourVisits.filter((visit) => visit.courseId === courseId)
    );
  }

  function getCourseNotesForCourse(courseId: string) {
    return sortByUpdatedAt(courseNotes.filter((note) => note.courseId === courseId));
  }

  function getResourcesForCourse(courseId: string) {
    return sortByUpdatedAt(
      resources.filter((resource) => resource.courseId === courseId)
    );
  }

  function getAnnouncementRemindersForCourse(courseId: string) {
    return sortByDate(
      announcementReminders.filter((reminder) => reminder.courseId === courseId)
    );
  }

  function getPendingGradingItems() {
    return sortByDate(
      gradingItems.filter(
        (item) => item.status === "pending" || item.status === "in-progress"
      )
    );
  }

  function getPendingTaItems() {
    return sortByDate(taItems.filter((item) => !item.completed));
  }

  function getOpenOfficeHourFollowUps() {
    return sortByDate(
      officeHourVisits.filter((visit) => !visit.followUpCompleted)
    );
  }

  function getUpcomingTeachingDeadlines(days = 7) {
    return [
      ...meetings
        .filter((meeting) => !meeting.canceled)
        .map((meeting) => ({
          id: meeting.id,
          courseId: meeting.courseId,
          type: "notebook" as const,
          title: meeting.topic,
          detail: meeting.due || meeting.readings || meeting.notes,
          dueDate: meeting.date,
          nextAction: meeting.changeNextTime || "Review class meeting.",
          sourceId: meeting.id,
          sourceType: "teaching-meeting",
        })),
      ...prepSessions
        .filter((session) => !session.completed)
        .map((session) => ({
          id: session.id,
          courseId: session.courseId,
          type: "prep" as const,
          title: session.topic,
          detail: session.plan || session.slides,
          dueDate: undefined,
          nextAction: session.nextAction || "Finish class prep.",
          sourceId: session.id,
          sourceType: "teaching-prep-session",
        })),
      ...getPendingGradingItems().map((item) => ({
        id: item.id,
        courseId: item.courseId,
        type: "grading" as const,
        title: item.assignment,
        detail: item.notes || item.missing,
        dueDate: item.dueDate,
        nextAction: item.nextAction || "Move grading forward.",
        sourceId: item.id,
        sourceType: "teaching-grading-item",
      })),
      ...getPendingTaItems().map((item) => ({
        id: item.id,
        courseId: item.courseId,
        type: "ta" as const,
        title: item.task,
        detail: item.taName || item.notes || item.weeklyComment,
        dueDate: item.dueDate,
        nextAction: item.nextAction || "Follow up with TA.",
        sourceId: item.id,
        sourceType: "teaching-ta-item",
      })),
      ...getTaReminderAlerts().map((alert) => ({
        id: alert.id,
        courseId: alert.courseId,
        type: "ta" as const,
        title: alert.title,
        detail: alert.detail,
        dueDate: alert.dueDate,
        nextAction: alert.nextAction,
        sourceId: alert.taItemId,
        sourceType: alert.type,
      })),
      ...getAnnouncementAlerts().map((alert) => ({
        id: alert.id,
        courseId: alert.courseId,
        type: "announcement" as const,
        title: alert.title,
        detail: alert.itemName,
        dueDate: alert.announcementDate || alert.dueDate,
        nextAction: alert.nextAction,
        sourceId: alert.reminderId,
        sourceType: "teaching-announcement-reminder",
      })),
      ...getOpenOfficeHourFollowUps().map((visit) => ({
        id: visit.id,
        courseId: visit.courseId,
        type: "office-hours" as const,
        title: visit.student,
        detail: visit.concern || visit.followUp,
        dueDate: visit.visitDate,
        nextAction: visit.nextAction || visit.followUp || "Complete follow-up.",
        sourceId: visit.id,
        sourceType: "teaching-office-hour-visit",
      })),
    ]
      .filter((item) => {
        const distance = getDateDistanceInDays(item.dueDate);

        return distance !== undefined && distance <= days;
      })
      .map(createAttentionItem)
      .sort((a, b) => {
        const priorityRank = { high: 0, medium: 1, low: 2 };

        if (priorityRank[a.priority] !== priorityRank[b.priority]) {
          return priorityRank[a.priority] - priorityRank[b.priority];
        }

        return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
      });
  }

  function getTeachingAttentionItems() {
    const upcomingMeetings = meetings.filter((meeting) => {
      const distance = getDateDistanceInDays(meeting.date);

      return !meeting.canceled && distance !== undefined && distance >= 0;
    });

    const prepAttentionItems = prepSessions
      .filter((session) => !session.completed)
      .map((session) => {
        const matchingMeeting = upcomingMeetings.find(
          (meeting) =>
            meeting.courseId === session.courseId &&
            meeting.week === session.week &&
            meeting.topic.toLowerCase() === session.topic.toLowerCase()
        );

        const baseItem = createAttentionItem({
          id: session.id,
          courseId: session.courseId,
          type: "prep",
          title: session.topic,
          detail: session.plan || session.slides,
          dueDate: matchingMeeting?.date,
          nextAction: session.nextAction || "Finish class prep.",
          sourceId: session.id,
          sourceType: "teaching-prep-session",
        });

        if (matchingMeeting) {
          return { ...baseItem, priority: "high" as const };
        }

        return baseItem;
      });

    const gradingAttentionItems = getPendingGradingItems().map((item) =>
      createAttentionItem({
        id: item.id,
        courseId: item.courseId,
        type: "grading",
        title: item.assignment,
        detail: item.notes || item.missing || item.scoresText,
        dueDate: item.dueDate,
        nextAction: item.nextAction || "Move grading forward.",
        sourceId: item.id,
        sourceType: "teaching-grading-item",
      })
    );

    const taAttentionItems = getPendingTaItems().map((item) =>
      createAttentionItem({
        id: item.id,
        courseId: item.courseId,
        type: "ta",
        title: item.task,
        detail: item.taName || item.notes || item.weeklyComment,
        dueDate: item.dueDate,
        nextAction: item.nextAction || "Follow up with TA.",
        sourceId: item.id,
        sourceType: "teaching-ta-item",
      })
    );

    const officeHourAttentionItems = getOpenOfficeHourFollowUps().map((visit) => ({
      id: visit.id,
      courseId: visit.courseId,
      type: "office-hours" as const,
      title: visit.student,
      detail: visit.concern || visit.followUp,
      dueDate: visit.visitDate,
      priority: "high" as const,
      nextAction: visit.nextAction || visit.followUp || "Complete follow-up.",
      sourceId: visit.id,
      sourceType: "teaching-office-hour-visit",
    }));

    const taReminderAttentionItems = getTaReminderAlerts().map((alert) => ({
      id: alert.id,
      courseId: alert.courseId,
      type: "ta" as const,
      title: alert.title,
      detail: alert.detail,
      dueDate: alert.dueDate,
      priority: alert.priority,
      nextAction: alert.nextAction,
      sourceId: alert.taItemId,
      sourceType: alert.type,
    }));

    const announcementAttentionItems = getAnnouncementAlerts().map((alert) => ({
      id: alert.id,
      courseId: alert.courseId,
      type: "announcement" as const,
      title: alert.title,
      detail: alert.itemName,
      dueDate: alert.announcementDate || alert.dueDate,
      priority: alert.priority,
      nextAction: alert.nextAction,
      sourceId: alert.reminderId,
      sourceType: "teaching-announcement-reminder",
    }));

    return [
      ...prepAttentionItems,
      ...gradingAttentionItems,
      ...taAttentionItems,
      ...taReminderAttentionItems,
      ...announcementAttentionItems,
      ...officeHourAttentionItems,
    ].sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 };

      if (priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }

      return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    });
  }

  function getTaReminderAlerts(courseId?: string): TeachingTaReminderAlert[] {
    const relevantItems = taItems.filter(
      (item) => !courseId || item.courseId === courseId
    );

    return relevantItems.flatMap((item) => {
      const assignmentName = item.assignmentName || item.task || "grading";
      const dueDate = item.reminderDueDate || item.assignmentDueDate || item.dueDate;
      const followUpDueDate =
        item.followUpDueDate ||
        (item.assignmentDueDate ? addDays(item.assignmentDueDate, 7) : undefined);
      const complete = Boolean(item.gradingReportedComplete || item.completed);
      const alerts: TeachingTaReminderAlert[] = [];

      if (!complete && dueDate && !item.initialReminderSentAt && dateIsTodayOrPast(dueDate)) {
        alerts.push({
          id: `${item.id}:initial`,
          courseId: item.courseId,
          taItemId: item.id,
          taId: item.taId,
          type: "ta-initial-reminder",
          title: `Initial grading reminder: ${assignmentName}`,
          detail: item.taName || item.notes || "TA grading reminder is due.",
          priority: "high",
          dueDate,
          nextAction: `Draft initial grading reminder for ${assignmentName}.`,
          actionLabel: "Draft email",
        });
      }

      if (
        !complete &&
        followUpDueDate &&
        !item.followUpReminderSentAt &&
        dateIsTodayOrPast(followUpDueDate)
      ) {
        alerts.push({
          id: `${item.id}:follow-up`,
          courseId: item.courseId,
          taItemId: item.id,
          taId: item.taId,
          type: "ta-follow-up-reminder",
          title: `Follow-up grading reminder: ${assignmentName}`,
          detail: "About a week has passed and grading is not marked complete.",
          priority: "high",
          dueDate: followUpDueDate,
          nextAction: `Check in on grading for ${assignmentName}.`,
          actionLabel: "Draft follow-up",
        });
      }

      if (
        !complete &&
        item.initialReminderSentAt &&
        followUpDueDate &&
        !dateIsTodayOrPast(followUpDueDate)
      ) {
        alerts.push({
          id: `${item.id}:waiting`,
          courseId: item.courseId,
          taItemId: item.id,
          taId: item.taId,
          type: "ta-waiting",
          title: `Waiting on grading: ${assignmentName}`,
          detail: "Initial reminder was sent; follow-up date has not arrived yet.",
          priority: "medium",
          dueDate: followUpDueDate,
          nextAction: "Keep this visible until grading is marked complete.",
          actionLabel: "Mark complete",
        });
      }

      if (
        !complete &&
        (item.rubricIncluded || item.rubricLink) &&
        item.rubricReminderEnabled !== false &&
        dateIsTodayOrPast(dueDate)
      ) {
        alerts.push({
          id: `${item.id}:rubric`,
          courseId: item.courseId,
          taItemId: item.id,
          taId: item.taId,
          type: "ta-rubric-reminder",
          title: `Rubric reminder: ${assignmentName}`,
          detail: "Remind TA to use the rubric while grading.",
          priority: "high",
          dueDate,
          nextAction: `Remind TA to use the rubric while grading ${assignmentName}.`,
          actionLabel: "Draft rubric email",
        });
      }

      if (
        !complete &&
        (item.taInstructionsIncluded || item.taInstructions) &&
        dateIsTodayOrPast(dueDate)
      ) {
        alerts.push({
          id: `${item.id}:instructions`,
          courseId: item.courseId,
          taItemId: item.id,
          taId: item.taId,
          type: "ta-instructions-reminder",
          title: `TA instructions reminder: ${assignmentName}`,
          detail: "Send or mention TA-specific grading instructions.",
          priority: "high",
          dueDate,
          nextAction: `Send TA grading instructions for ${assignmentName}.`,
          actionLabel: "Draft instructions",
        });
      }

      if (
        !complete &&
        item.gradeNormingEnabled &&
        !item.gradeNormingCompleted &&
        dateIsTodayOrPast(item.gradeNormingReminderDate)
      ) {
        alerts.push({
          id: `${item.id}:norming`,
          courseId: item.courseId,
          taItemId: item.id,
          taId: item.taId,
          type: "ta-grade-norming-reminder",
          title: `Grade norming check: ${assignmentName}`,
          detail: "Check consistency before grading gets too far.",
          priority: "high",
          dueDate: item.gradeNormingReminderDate,
          nextAction: `Check grade norming for ${assignmentName} before grading gets too far.`,
          actionLabel: "Draft norming email",
        });
      }

      return alerts;
    });
  }

  function getAnnouncementAlerts(courseId?: string): TeachingAnnouncementAlert[] {
    return announcementReminders
      .filter((reminder) => !courseId || reminder.courseId === courseId)
      .filter((reminder) => reminder.status === "planned" || reminder.status === "drafted")
      .flatMap((reminder) => {
        const alerts: TeachingAnnouncementAlert[] = [];
        const announcementDistance = getDateDistanceInDays(reminder.announcementDate);
        const dueDistance = getDateDistanceInDays(reminder.dueDate);

        if (announcementDistance !== undefined && announcementDistance <= 0) {
          alerts.push({
            id: `${reminder.id}:announcement-date`,
            courseId: reminder.courseId,
            reminderId: reminder.id,
            title: reminder.title || `Announcement due: ${reminder.itemName}`,
            itemName: reminder.itemName,
            dueDate: reminder.dueDate,
            announcementDate: reminder.announcementDate,
            priority: announcementDistance < 0 ? "high" : "high",
            nextAction: "Draft or post the announcement.",
          });
        }

        if (dueDistance !== undefined && dueDistance >= 0 && dueDistance <= 7) {
          alerts.push({
            id: `${reminder.id}:due-soon`,
            courseId: reminder.courseId,
            reminderId: reminder.id,
            title: `Due soon: ${reminder.itemName}`,
            itemName: reminder.itemName,
            dueDate: reminder.dueDate,
            announcementDate: reminder.announcementDate,
            priority: dueDistance <= 2 ? "high" : "medium",
            nextAction: "Draft a student-facing reminder.",
          });
        }

        return alerts;
      });
  }

  return {
    semesters,
    courses,
    meetings,
    prepSessions,
    gradingItems,
    taItems,
    teachingAssistants,
    officeHourVisits,
    courseNotes,
    resources,
    announcementReminders,
    courseTemplates,
    activeSemesters,
    archivedSemesters,
    activeCourses,
    archivedCourses,
    createSemester,
    updateSemester,
    archiveSemester,
    restoreSemester,
    createCourse,
    updateCourse,
    archiveCourse,
    restoreCourse,
    createCourseTemplate,
    updateCourseTemplate,
    deleteCourseTemplate,
    rolloverCourse,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    createPrepSession,
    updatePrepSession,
    deletePrepSession,
    createGradingItem,
    updateGradingItem,
    deleteGradingItem,
    createTaItem,
    updateTaItem,
    deleteTaItem,
    createTeachingAssistant,
    updateTeachingAssistant,
    deleteTeachingAssistant,
    createOfficeHourVisit,
    updateOfficeHourVisit,
    deleteOfficeHourVisit,
    createCourseNote,
    updateCourseNote,
    deleteCourseNote,
    createResource,
    updateResource,
    deleteResource,
    createAnnouncementReminder,
    updateAnnouncementReminder,
    deleteAnnouncementReminder,
    getCoursesForSemester,
    getActiveCoursesForSemester,
    getCourseById,
    getSemesterById,
    getMeetingsForCourse,
    getPrepSessionsForCourse,
    getGradingItemsForCourse,
    getTaItemsForCourse,
    getTeachingAssistantsForCourse,
    getOfficeHourVisitsForCourse,
    getCourseNotesForCourse,
    getResourcesForCourse,
    getAnnouncementRemindersForCourse,
    getPendingGradingItems,
    getPendingTaItems,
    getOpenOfficeHourFollowUps,
    getUpcomingTeachingDeadlines,
    getTeachingAttentionItems,
    getTaReminderAlerts,
    getAnnouncementAlerts,
  };
}
