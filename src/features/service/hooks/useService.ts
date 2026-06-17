import { useMemo } from "react";
import {
  ADVISING_STUDENTS_STORAGE_KEY,
  SERVICE_ADMIN_ITEMS_STORAGE_KEY,
  SERVICE_BOUNDARY_LESSONS_STORAGE_KEY,
  SERVICE_COMMITTEES_STORAGE_KEY,
  SERVICE_ITEMS_STORAGE_KEY,
  SERVICE_REVIEW_LETTERS_STORAGE_KEY,
} from "../../../shared/constants/serviceStorage";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import {
  advisingMilestoneOrder,
} from "../data/advisingMilestones";
import type {
  AdvisingStudent,
  Committee,
  NewAdvisingStudentInput,
  NewCommitteeInput,
  NewReviewLetterInput,
  NewServiceAdminItemInput,
  NewServiceBoundaryLessonInput,
  NewServiceItemInput,
  ReviewLetter,
  ServiceAdminItem,
  ServiceBoundaryLesson,
  ServiceItem,
  UpdateAdvisingStudentInput,
  UpdateCommitteeInput,
  UpdateReviewLetterInput,
  UpdateServiceAdminItemInput,
  UpdateServiceBoundaryLessonInput,
  UpdateServiceItemInput,
} from "../types";

function cleanOptionalString(value?: string) {
  const cleanedValue = value?.trim();

  return cleanedValue ? cleanedValue : undefined;
}

function todayAtMidnight() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function parseDateAtMidnight(dateString?: string) {
  if (!dateString) {
    return undefined;
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function isOverdue(item: ServiceItem) {
  const dueDate = parseDateAtMidnight(item.dueDate);

  if (!dueDate || item.status === "done" || item.status === "archived") {
    return false;
  }

  return dueDate < todayAtMidnight();
}

function isDueWithinDays(item: ServiceItem, days: number) {
  const dueDate = parseDateAtMidnight(item.dueDate);

  if (!dueDate || item.status === "done" || item.status === "archived") {
    return false;
  }

  const today = todayAtMidnight();
  const windowEnd = new Date(today);
  windowEnd.setDate(today.getDate() + days);

  return dueDate >= today && dueDate <= windowEnd;
}

function sortByAttention(a: ServiceItem, b: ServiceItem) {
  const aOverdue = isOverdue(a) ? 0 : 1;
  const bOverdue = isOverdue(b) ? 0 : 1;

  if (aOverdue !== bOverdue) {
    return aOverdue - bOverdue;
  }

  const aDue = parseDateAtMidnight(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bDue = parseDateAtMidnight(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;

  if (aDue !== bDue) {
    return aDue - bDue;
  }

  if (a.highStakes !== b.highStakes) {
    return a.highStakes ? -1 : 1;
  }

  return a.title.localeCompare(b.title);
}

function sortCommittees(committees: Committee[]) {
  return [...committees].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

function sortStudents(students: AdvisingStudent[]) {
  return [...students].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

function buildDefaultMilestones(stage?: AdvisingStudent["stage"]) {
  return advisingMilestoneOrder.map((name) => ({
    id: crypto.randomUUID(),
    name,
    status: name === stage ? ("in-progress" as const) : ("not-started" as const),
  }));
}

function cleanServiceInput(input: NewServiceItemInput): NewServiceItemInput {
  return {
    ...input,
    title: input.title.trim(),
    dueDate: cleanOptionalString(input.dueDate),
    nextAction: input.nextAction.trim(),
    estimatedMinutes: input.estimatedMinutes || undefined,
    waitingOn: cleanOptionalString(input.waitingOn),
    relatedCommitteeId: cleanOptionalString(input.relatedCommitteeId),
    relatedStudentId: cleanOptionalString(input.relatedStudentId),
    link: cleanOptionalString(input.link),
    boundaryNote: cleanOptionalString(input.boundaryNote),
  };
}

function cleanCommitteeInput(input: NewCommitteeInput): NewCommitteeInput {
  return {
    ...input,
    name: input.name.trim(),
    role: cleanOptionalString(input.role),
    term: cleanOptionalString(input.term),
    nextMeeting: cleanOptionalString(input.nextMeeting),
    nextAction: cleanOptionalString(input.nextAction),
    notes: cleanOptionalString(input.notes),
    boundaryNote: cleanOptionalString(input.boundaryNote),
  };
}

function cleanStudentInput(input: NewAdvisingStudentInput): NewAdvisingStudentInput {
  return {
    ...input,
    name: input.name.trim(),
    program: cleanOptionalString(input.program),
    lastContactDate: cleanOptionalString(input.lastContactDate),
    nextMeetingDate: cleanOptionalString(input.nextMeetingDate),
    currentSemester: cleanOptionalString(input.currentSemester),
    semesterGoal: cleanOptionalString(input.semesterGoal),
    semesterGoalOutcome: cleanOptionalString(input.semesterGoalOutcome),
    advisorSupportPlan: cleanOptionalString(input.advisorSupportPlan),
    alternateGoal: cleanOptionalString(input.alternateGoal),
    advisingMemory: cleanOptionalString(input.advisingMemory),
  };
}

function cleanReviewLetterInput(
  input: NewReviewLetterInput
): NewReviewLetterInput {
  return {
    ...input,
    title: input.title.trim(),
    dueDate: cleanOptionalString(input.dueDate),
    requestedBy: cleanOptionalString(input.requestedBy),
    organization: cleanOptionalString(input.organization),
    nextAction: cleanOptionalString(input.nextAction),
    waitingOn: cleanOptionalString(input.waitingOn),
    estimatedMinutes: input.estimatedMinutes || undefined,
    notes: cleanOptionalString(input.notes),
    boundaryNote: cleanOptionalString(input.boundaryNote),
  };
}

function cleanAdminItemInput(
  input: NewServiceAdminItemInput
): NewServiceAdminItemInput {
  return {
    ...input,
    title: input.title.trim(),
    dueDate: cleanOptionalString(input.dueDate),
    nextAction: cleanOptionalString(input.nextAction),
    waitingOn: cleanOptionalString(input.waitingOn),
    estimatedMinutes: input.estimatedMinutes || undefined,
    notes: cleanOptionalString(input.notes),
  };
}

function cleanBoundaryLessonInput(
  input: NewServiceBoundaryLessonInput
): NewServiceBoundaryLessonInput {
  return {
    ...input,
    commitment: input.commitment.trim(),
    whyCostly: cleanOptionalString(input.whyCostly),
    warningSign: cleanOptionalString(input.warningSign),
    futureBoundary: cleanOptionalString(input.futureBoundary),
    relatedId: cleanOptionalString(input.relatedId),
  };
}

function valueFromInput<TInput extends object, TKey extends keyof TInput>(
  input: TInput,
  key: TKey,
  fallback: TInput[TKey]
) {
  return Object.prototype.hasOwnProperty.call(input, key) ? input[key] : fallback;
}

export function useService() {
  const [serviceItems, setServiceItems] = useLocalStorage<ServiceItem[]>(
    SERVICE_ITEMS_STORAGE_KEY,
    []
  );

  const [committees, setCommittees] = useLocalStorage<Committee[]>(
    SERVICE_COMMITTEES_STORAGE_KEY,
    []
  );

  const [advisingStudents, setAdvisingStudents] = useLocalStorage<AdvisingStudent[]>(
    ADVISING_STUDENTS_STORAGE_KEY,
    []
  );

  const [reviewLetters, setReviewLetters] = useLocalStorage<ReviewLetter[]>(
    SERVICE_REVIEW_LETTERS_STORAGE_KEY,
    []
  );

  const [adminItems, setAdminItems] = useLocalStorage<ServiceAdminItem[]>(
    SERVICE_ADMIN_ITEMS_STORAGE_KEY,
    []
  );

  const [boundaryLessons, setBoundaryLessons] = useLocalStorage<
    ServiceBoundaryLesson[]
  >(SERVICE_BOUNDARY_LESSONS_STORAGE_KEY, []);

  const activeServiceItems = useMemo(
    () =>
      serviceItems.filter(
        (item) => item.status !== "done" && item.status !== "archived"
      ),
    [serviceItems]
  );

  const inboxItems = useMemo(
    () => serviceItems.filter((item) => item.status === "inbox"),
    [serviceItems]
  );

  const needsAttentionItems = useMemo(
    () =>
      activeServiceItems
        .filter(
          (item) =>
            isOverdue(item) ||
            isDueWithinDays(item, 7) ||
            item.status === "waiting-on-me" ||
            item.highStakes
        )
        .sort(sortByAttention),
    [activeServiceItems]
  );

  const doneServiceItems = useMemo(
    () => serviceItems.filter((item) => item.status === "done"),
    [serviceItems]
  );

  const archivedServiceItems = useMemo(
    () => serviceItems.filter((item) => item.status === "archived"),
    [serviceItems]
  );

  const activeCommittees = useMemo(
    () => sortCommittees(committees.filter((committee) => committee.status === "active")),
    [committees]
  );

  const archivedCommittees = useMemo(
    () => sortCommittees(committees.filter((committee) => committee.status === "archived")),
    [committees]
  );

  const activeAdvisingStudents = useMemo(
    () => sortStudents(advisingStudents.filter((student) => student.status === "active")),
    [advisingStudents]
  );

  const archivedAdvisingStudents = useMemo(
    () => sortStudents(advisingStudents.filter((student) => student.status === "archived")),
    [advisingStudents]
  );

  const activeReviewLetters = useMemo(
    () =>
      reviewLetters
        .filter(
          (review) =>
            review.status !== "submitted" &&
            review.status !== "declined" &&
            review.status !== "archived"
        )
        .sort((a, b) => sortByDueDate(a.dueDate, b.dueDate, a.title, b.title)),
    [reviewLetters]
  );

  const activeAdminItems = useMemo(
    () =>
      adminItems
        .filter((item) => item.status !== "done" && item.status !== "archived")
        .sort((a, b) => sortByDueDate(a.dueDate, b.dueDate, a.title, b.title)),
    [adminItems]
  );

  const activeBoundaryLessons = useMemo(
    () =>
      boundaryLessons.filter((lesson) => lesson.status === "active-lesson"),
    [boundaryLessons]
  );

  function createServiceItem(input: NewServiceItemInput) {
    const now = new Date().toISOString();
    const cleanedInput = cleanServiceInput(input);

    const serviceItem: ServiceItem = {
      id: crypto.randomUUID(),
      ...cleanedInput,
      createdAt: now,
      updatedAt: now,
    };

    setServiceItems((currentItems) => [serviceItem, ...currentItems]);

    return serviceItem;
  }

  function updateServiceItem(id: string, input: UpdateServiceItemInput) {
    const now = new Date().toISOString();

    setServiceItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const mergedInput: NewServiceItemInput = {
          title: input.title ?? item.title,
          bucket: input.bucket ?? item.bucket,
          status: input.status ?? item.status,
          dueDate: valueFromInput(input, "dueDate", item.dueDate),
          nextAction: input.nextAction ?? item.nextAction,
          spoonCost: valueFromInput(input, "spoonCost", item.spoonCost),
          estimatedMinutes: valueFromInput(
            input,
            "estimatedMinutes",
            item.estimatedMinutes
          ),
          highStakes: input.highStakes ?? item.highStakes,
          confidential: input.confidential ?? item.confidential,
          waitingOn: valueFromInput(input, "waitingOn", item.waitingOn),
          relatedCommitteeId: valueFromInput(
            input,
            "relatedCommitteeId",
            item.relatedCommitteeId
          ),
          relatedStudentId: valueFromInput(
            input,
            "relatedStudentId",
            item.relatedStudentId
          ),
          link: valueFromInput(input, "link", item.link),
          boundaryNote: valueFromInput(input, "boundaryNote", item.boundaryNote),
          neverAgain: input.neverAgain ?? item.neverAgain,
        };

        return {
          ...item,
          ...cleanServiceInput(mergedInput),
          updatedAt: now,
        };
      })
    );
  }

  function markServiceItemDone(id: string) {
    updateServiceItem(id, { status: "done" });
  }

  function archiveServiceItem(id: string) {
    updateServiceItem(id, { status: "archived" });
  }

  function restoreServiceItem(id: string) {
    updateServiceItem(id, { status: "accepted" });
  }

  function createCommittee(input: NewCommitteeInput) {
    const now = new Date().toISOString();
    const cleanedInput = cleanCommitteeInput(input);

    const committee: Committee = {
      id: crypto.randomUUID(),
      name: cleanedInput.name,
      role: cleanedInput.role,
      term: cleanedInput.term,
      status: "active",
      nextMeeting: cleanedInput.nextMeeting,
      nextAction: cleanedInput.nextAction,
      loadRating: cleanedInput.loadRating,
      notes: cleanedInput.notes,
      boundaryNote: cleanedInput.boundaryNote,
      createdAt: now,
      updatedAt: now,
    };

    setCommittees((currentCommittees) => [committee, ...currentCommittees]);

    return committee;
  }

  function updateCommittee(id: string, input: UpdateCommitteeInput) {
    const now = new Date().toISOString();

    setCommittees((currentCommittees) =>
      currentCommittees.map((committee) => {
        if (committee.id !== id) {
          return committee;
        }

        const cleanedInput = cleanCommitteeInput({
          name: input.name ?? committee.name,
          role: input.role ?? committee.role,
          term: input.term ?? committee.term,
          nextMeeting: input.nextMeeting ?? committee.nextMeeting,
          nextAction: input.nextAction ?? committee.nextAction,
          loadRating: input.loadRating ?? committee.loadRating,
          notes: input.notes ?? committee.notes,
          boundaryNote: input.boundaryNote ?? committee.boundaryNote,
        });

        return {
          ...committee,
          ...cleanedInput,
          status: input.status ?? committee.status,
          updatedAt: now,
        };
      })
    );
  }

  function archiveCommittee(id: string) {
    updateCommittee(id, { status: "archived" });
  }

  function restoreCommittee(id: string) {
    updateCommittee(id, { status: "active" });
  }

  function getCommitteeById(id?: string) {
    if (!id) {
      return undefined;
    }

    return committees.find((committee) => committee.id === id);
  }

  function createAdvisingStudent(input: NewAdvisingStudentInput) {
    const now = new Date().toISOString();
    const cleanedInput = cleanStudentInput(input);

    const student: AdvisingStudent = {
      id: crypto.randomUUID(),
      name: cleanedInput.name,
      program: cleanedInput.program,
      role: cleanedInput.role,
      status: "active",
      stage: cleanedInput.stage,
      lastContactDate: cleanedInput.lastContactDate,
      nextMeetingDate: cleanedInput.nextMeetingDate,
      currentSemester: cleanedInput.currentSemester,
      semesterGoal: cleanedInput.semesterGoal,
      semesterGoalStatus: cleanedInput.semesterGoalStatus,
      semesterGoalOutcome: cleanedInput.semesterGoalOutcome,
      advisorSupportPlan: cleanedInput.advisorSupportPlan,
      ultimateGoal: cleanedInput.ultimateGoal,
      alternateGoal: cleanedInput.alternateGoal,
      advisingMemory: cleanedInput.advisingMemory,
      milestones: cleanedInput.milestones ?? buildDefaultMilestones(cleanedInput.stage),
      createdAt: now,
      updatedAt: now,
    };

    setAdvisingStudents((currentStudents) => [student, ...currentStudents]);

    return student;
  }

  function updateAdvisingStudent(id: string, input: UpdateAdvisingStudentInput) {
    const now = new Date().toISOString();

    setAdvisingStudents((currentStudents) =>
      currentStudents.map((student) => {
        if (student.id !== id) {
          return student;
        }

        const cleanedInput = cleanStudentInput({
          name: input.name ?? student.name,
          program: input.program ?? student.program,
          role: input.role ?? student.role,
          stage: input.stage ?? student.stage,
          lastContactDate: input.lastContactDate ?? student.lastContactDate,
          nextMeetingDate: input.nextMeetingDate ?? student.nextMeetingDate,
          currentSemester: input.currentSemester ?? student.currentSemester,
          semesterGoal: input.semesterGoal ?? student.semesterGoal,
          semesterGoalStatus: input.semesterGoalStatus ?? student.semesterGoalStatus,
          semesterGoalOutcome: input.semesterGoalOutcome ?? student.semesterGoalOutcome,
          advisorSupportPlan: input.advisorSupportPlan ?? student.advisorSupportPlan,
          ultimateGoal: input.ultimateGoal ?? student.ultimateGoal,
          alternateGoal: input.alternateGoal ?? student.alternateGoal,
          advisingMemory: input.advisingMemory ?? student.advisingMemory,
          milestones: input.milestones ?? student.milestones,
        });

        return {
          ...student,
          ...cleanedInput,
          status: input.status ?? student.status,
          milestones: cleanedInput.milestones ?? student.milestones,
          updatedAt: now,
        };
      })
    );
  }

  function archiveAdvisingStudent(id: string) {
    updateAdvisingStudent(id, { status: "archived" });
  }

  function restoreAdvisingStudent(id: string) {
    updateAdvisingStudent(id, { status: "active" });
  }

  function getAdvisingStudentById(id?: string) {
    if (!id) {
      return undefined;
    }

    return advisingStudents.find((student) => student.id === id);
  }

  function createReviewLetter(input: NewReviewLetterInput) {
    const now = new Date().toISOString();
    const cleanedInput = cleanReviewLetterInput(input);

    const review: ReviewLetter = {
      id: crypto.randomUUID(),
      ...cleanedInput,
      createdAt: now,
      updatedAt: now,
    };

    setReviewLetters((currentReviews) => [review, ...currentReviews]);

    return review;
  }

  function updateReviewLetter(id: string, input: UpdateReviewLetterInput) {
    const now = new Date().toISOString();

    setReviewLetters((currentReviews) =>
      currentReviews.map((review) => {
        if (review.id !== id) {
          return review;
        }

        const mergedInput: NewReviewLetterInput = {
          title: input.title ?? review.title,
          type: input.type ?? review.type,
          status: input.status ?? review.status,
          dueDate: valueFromInput(input, "dueDate", review.dueDate),
          requestedBy: valueFromInput(input, "requestedBy", review.requestedBy),
          organization: valueFromInput(input, "organization", review.organization),
          nextAction: valueFromInput(input, "nextAction", review.nextAction),
          waitingOn: valueFromInput(input, "waitingOn", review.waitingOn),
          spoonCost: valueFromInput(input, "spoonCost", review.spoonCost),
          estimatedMinutes: valueFromInput(
            input,
            "estimatedMinutes",
            review.estimatedMinutes
          ),
          notes: valueFromInput(input, "notes", review.notes),
          boundaryNote: valueFromInput(input, "boundaryNote", review.boundaryNote),
          neverAgain: input.neverAgain ?? review.neverAgain,
        };

        return {
          ...review,
          ...cleanReviewLetterInput(mergedInput),
          updatedAt: now,
        };
      })
    );
  }

  function archiveReviewLetter(id: string) {
    updateReviewLetter(id, { status: "archived" });
  }

  function createAdminItem(input: NewServiceAdminItemInput) {
    const now = new Date().toISOString();
    const cleanedInput = cleanAdminItemInput(input);

    const item: ServiceAdminItem = {
      id: crypto.randomUUID(),
      ...cleanedInput,
      createdAt: now,
      updatedAt: now,
    };

    setAdminItems((currentItems) => [item, ...currentItems]);

    return item;
  }

  function updateAdminItem(id: string, input: UpdateServiceAdminItemInput) {
    const now = new Date().toISOString();

    setAdminItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const mergedInput: NewServiceAdminItemInput = {
          title: input.title ?? item.title,
          type: input.type ?? item.type,
          status: input.status ?? item.status,
          dueDate: valueFromInput(input, "dueDate", item.dueDate),
          nextAction: valueFromInput(input, "nextAction", item.nextAction),
          waitingOn: valueFromInput(input, "waitingOn", item.waitingOn),
          spoonCost: valueFromInput(input, "spoonCost", item.spoonCost),
          estimatedMinutes: valueFromInput(
            input,
            "estimatedMinutes",
            item.estimatedMinutes
          ),
          notes: valueFromInput(input, "notes", item.notes),
          recurring: input.recurring ?? item.recurring,
        };

        return {
          ...item,
          ...cleanAdminItemInput(mergedInput),
          updatedAt: now,
        };
      })
    );
  }

  function archiveAdminItem(id: string) {
    updateAdminItem(id, { status: "archived" });
  }

  function createBoundaryLesson(input: NewServiceBoundaryLessonInput) {
    const now = new Date().toISOString();
    const cleanedInput = cleanBoundaryLessonInput(input);

    const lesson: ServiceBoundaryLesson = {
      id: crypto.randomUUID(),
      ...cleanedInput,
      createdAt: now,
      updatedAt: now,
    };

    setBoundaryLessons((currentLessons) => [lesson, ...currentLessons]);

    return lesson;
  }

  function updateBoundaryLesson(
    id: string,
    input: UpdateServiceBoundaryLessonInput
  ) {
    const now = new Date().toISOString();

    setBoundaryLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== id) {
          return lesson;
        }

        const mergedInput: NewServiceBoundaryLessonInput = {
          commitment: input.commitment ?? lesson.commitment,
          whyCostly: valueFromInput(input, "whyCostly", lesson.whyCostly),
          warningSign: valueFromInput(input, "warningSign", lesson.warningSign),
          futureBoundary: valueFromInput(
            input,
            "futureBoundary",
            lesson.futureBoundary
          ),
          relatedKind: valueFromInput(input, "relatedKind", lesson.relatedKind),
          relatedId: valueFromInput(input, "relatedId", lesson.relatedId),
          status: input.status ?? lesson.status,
        };

        return {
          ...lesson,
          ...cleanBoundaryLessonInput(mergedInput),
          updatedAt: now,
        };
      })
    );
  }

  return {
    serviceItems,
    activeServiceItems,
    inboxItems,
    needsAttentionItems,
    doneServiceItems,
    archivedServiceItems,
    committees,
    activeCommittees,
    archivedCommittees,
    advisingStudents,
    activeAdvisingStudents,
    archivedAdvisingStudents,
    reviewLetters,
    activeReviewLetters,
    adminItems,
    activeAdminItems,
    boundaryLessons,
    activeBoundaryLessons,
    createServiceItem,
    updateServiceItem,
    markServiceItemDone,
    archiveServiceItem,
    restoreServiceItem,
    createCommittee,
    updateCommittee,
    archiveCommittee,
    restoreCommittee,
    getCommitteeById,
    createAdvisingStudent,
    updateAdvisingStudent,
    archiveAdvisingStudent,
    restoreAdvisingStudent,
    getAdvisingStudentById,
    createReviewLetter,
    updateReviewLetter,
    archiveReviewLetter,
    createAdminItem,
    updateAdminItem,
    archiveAdminItem,
    createBoundaryLesson,
    updateBoundaryLesson,
  };
}

function sortByDueDate(
  aDueDate: string | undefined,
  bDueDate: string | undefined,
  aTitle: string,
  bTitle: string
) {
  const aDue = parseDateAtMidnight(aDueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bDue = parseDateAtMidnight(bDueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;

  if (aDue !== bDue) {
    return aDue - bDue;
  }

  return aTitle.localeCompare(bTitle);
}
