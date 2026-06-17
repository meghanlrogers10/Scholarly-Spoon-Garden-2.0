import { useMemo, useState } from "react";
import { CourseCard } from "../components/CourseCard";
import { CourseModal } from "../components/CourseModal";
import { CourseRolloverModal } from "../components/CourseRolloverModal";
import { CourseTemplateModal } from "../components/CourseTemplateModal";
import { SemesterCard } from "../components/SemesterCard";
import { SemesterModal } from "../components/SemesterModal";
import { useTeaching } from "../hooks/useTeaching";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import type { TaskSource, TaskType } from "../../../shared/types/task";
import type { TeachingAttentionItem, TeachingCourseTemplate } from "../types";
import "./teaching.css";

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

function nextDate(values: Array<string | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const distance = getDateDistanceInDays(value);
      return distance !== undefined && distance >= 0;
    })
    .sort((a, b) => a.localeCompare(b))[0];
}

function formatAttentionType(type: TeachingAttentionItem["type"]) {
  return type.replace("-", " ");
}

function getTeachingTaskSource(item: TeachingAttentionItem): TaskSource {
  if (item.type === "prep" || item.type === "notebook") return "teaching-prep";
  if (item.type === "grading") return "grading";
  if (item.type === "ta") return "ta-follow-up";
  if (item.type === "office-hours") return "office-hours";
  if (item.type === "announcement") return "announcement";

  return "teaching-prep";
}

function getTeachingTaskType(item: TeachingAttentionItem): TaskType {
  if (item.type === "prep" || item.type === "notebook") return "class-prep";
  if (item.type === "grading") return "grading";
  if (item.type === "ta" || item.type === "announcement") return "email-admin";
  if (item.type === "office-hours") return "advising";

  return "teaching";
}

function getTeachingEstimatedMinutes(item: TeachingAttentionItem) {
  if (item.type === "grading") return 45;
  if (item.type === "prep" || item.type === "notebook") return 60;
  if (item.type === "office-hours") return 20;
  if (item.type === "ta" || item.type === "announcement") return 15;

  return undefined;
}

function sortLowSpoonItems(items: TeachingAttentionItem[]) {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const typeRank: Record<TeachingAttentionItem["type"], number> = {
    "office-hours": 0,
    grading: 1,
    ta: 2,
    announcement: 3,
    prep: 4,
    notebook: 5,
  };

  return [...items].sort((a, b) => {
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }

    const aDistance = getDateDistanceInDays(a.dueDate);
    const bDistance = getDateDistanceInDays(b.dueDate);
    const aOverdue = aDistance !== undefined && aDistance < 0;
    const bOverdue = bDistance !== undefined && bDistance < 0;

    if (aOverdue !== bOverdue) {
      return aOverdue ? -1 : 1;
    }

    const aDueSoon = aDistance !== undefined && aDistance <= 2;
    const bDueSoon = bDistance !== undefined && bDistance <= 2;

    if (aDueSoon !== bDueSoon) {
      return aDueSoon ? -1 : 1;
    }

    if (typeRank[a.type] !== typeRank[b.type]) {
      return typeRank[a.type] - typeRank[b.type];
    }

    return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
  });
}

export function TeachingPage() {
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<TeachingCourseTemplate>();
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(
    null
  );

  const {
    activeSemesters,
    archivedSemesters,
    courses,
    activeCourses,
    archivedCourses,
    meetings,
    prepSessions,
    gradingItems,
    taItems,
    officeHourVisits,
    courseNotes,
    resources,
    announcementReminders,
    courseTemplates,
    getPendingGradingItems,
    getPendingTaItems,
    getOpenOfficeHourFollowUps,
    getUpcomingTeachingDeadlines,
    getTeachingAttentionItems,
    getTaReminderAlerts,
    getAnnouncementAlerts,
    createSemester,
    archiveSemester,
    restoreSemester,
    createCourse,
    archiveCourse,
    restoreCourse,
    createCourseTemplate,
    updateCourseTemplate,
    deleteCourseTemplate,
    rolloverCourse,
    getCoursesForSemester,
    getActiveCoursesForSemester,
    getCourseById,
    getSemesterById,
    getMeetingsForCourse,
    getPrepSessionsForCourse,
    getGradingItemsForCourse,
    getTaItemsForCourse,
    getOfficeHourVisitsForCourse,
    getCourseNotesForCourse,
    getResourcesForCourse,
  } = useTeaching();
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();

  const selectedSemester = useMemo(() => {
    if (selectedSemesterId) {
      return getSemesterById(selectedSemesterId);
    }

    return activeSemesters[0] ?? archivedSemesters[0];
  }, [selectedSemesterId, activeSemesters, archivedSemesters, getSemesterById]);

  const selectedSemesterCourses = selectedSemester
    ? getCoursesForSemester(selectedSemester.id)
    : [];

  const selectedActiveCourses = selectedSemester
    ? getActiveCoursesForSemester(selectedSemester.id)
    : [];
  const pendingGradingItems = getPendingGradingItems();
  const pendingTaItems = getPendingTaItems();
  const openOfficeHourFollowUps = getOpenOfficeHourFollowUps();
  const upcomingTeachingDeadlines = getUpcomingTeachingDeadlines(7);
  const attentionItems = getTeachingAttentionItems();
  const lowSpoonItems = sortLowSpoonItems(attentionItems).slice(0, 5);
  const taReminderAlerts = getTaReminderAlerts();
  const announcementAlerts = getAnnouncementAlerts();
  const gradingEstimateMinutes = gradingItems
    .filter((item) => item.status === "pending" || item.status === "in-progress")
    .reduce((total, item) => total + (item.estimatedMinutes ?? 45), 0);
  const highSpoonGradingCount = gradingItems.filter(
    (item) =>
      (item.status === "pending" || item.status === "in-progress") &&
      (item.spoonCost ?? 3) >= 4,
  ).length;
  const noNextActionItems = attentionItems.filter((item) => !item.nextAction).slice(0, 4);

  function handleCreateSemester(input: Parameters<typeof createSemester>[0]) {
    const semester = createSemester(input);
    setSelectedSemesterId(semester.id);
  }

  function handleCreateCourse(input: Parameters<typeof createCourse>[0]) {
    createCourse(input);
  }

  function closeTemplateModal() {
    setEditingTemplate(undefined);
    setIsTemplateModalOpen(false);
  }

  function handleSaveTemplate(input: Parameters<typeof createCourseTemplate>[0]) {
    if (editingTemplate) {
      updateCourseTemplate(editingTemplate.id, input);
    } else {
      createCourseTemplate(input);
    }

    closeTemplateModal();
  }

  function handleRolloverCourse(input: Parameters<typeof rolloverCourse>[0]) {
    const course = rolloverCourse(input);

    if (course) {
      setSelectedSemesterId(course.semesterId);
    }

    setIsRolloverModalOpen(false);
  }

  function handleAddTeachingItemToToday(item: TeachingAttentionItem) {
    const course = getCourseById(item.courseId);
    const estimatedMinutes = getTeachingEstimatedMinutes(item);

    addLinkedTaskToToday({
      source: getTeachingTaskSource(item),
      sourceId: item.sourceId,
      title: item.nextAction || item.title,
      area: "Teaching",
      courseId: item.courseId,
      spoonCost: item.priority === "high" ? 3 : 2,
      priority: item.priority === "high" ? "High" : item.priority === "low" ? "Low" : "Medium",
      dueDate: item.dueDate,
      notes: [course?.code, item.detail].filter(Boolean).join("\n"),
      taskType: getTeachingTaskType(item),
      nextAction: item.nextAction,
      estimatedMinutes,
      lowEnergyFriendly: (estimatedMinutes ?? 999) <= 20,
    });
  }

  function isTeachingItemOnToday(item: TeachingAttentionItem) {
    return isSourceOnToday(getTeachingTaskSource(item), item.sourceId);
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <p className="eyebrow">Teaching</p>
          <h1>Your semester command center.</h1>
          <p>
            Courses, prep, grading, office hours, and TA follow-up live here so
            you can see what needs attention without reopening the whole
            semester in your head.
          </p>
        </div>

        <div className="teaching-hero-panel__actions">
          <button
            className="teaching-secondary-button"
            type="button"
            onClick={() => setIsSemesterModalOpen(true)}
          >
            + New Semester
          </button>

          <button
            className="teaching-primary-button"
            type="button"
            disabled={activeSemesters.length === 0}
            onClick={() => setIsCourseModalOpen(true)}
          >
            + New Course
          </button>

          <button
            className="teaching-secondary-button"
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
          >
            + Course Template
          </button>

          <button
            className="teaching-secondary-button"
            type="button"
            disabled={courses.length === 0 || activeSemesters.length === 0}
            onClick={() => setIsRolloverModalOpen(true)}
          >
            Semester Rollover
          </button>
        </div>
      </div>

      <div className="teaching-status-strip">
        <span>{activeSemesters.length} active semesters</span>
        <span>{activeCourses.length} active courses</span>
        <span>{archivedCourses.length} archived courses</span>
        <span>{meetings.length} meetings</span>
        <span>{prepSessions.length} prep sessions</span>
        <span>{gradingItems.length} grading items</span>
        <span>{taItems.length} TA items</span>
        <span>{officeHourVisits.length} office hour visits</span>
        <span>{courseNotes.length} notes</span>
        <span>{resources.length} resources</span>
        <span>{announcementReminders.length} announcements</span>
      </div>

      <section className="teaching-command-center">
        <div className="teaching-section-header">
          <div>
            <p className="eyebrow">Teaching command center</p>
            <h2>What needs attention?</h2>
            <p>
              A calm overview of grading, prep, follow-ups, and teaching
              deadlines.
            </p>
          </div>
        </div>

        <div className="teaching-snapshot-grid">
          <article>
            <span>Active semesters</span>
            <strong>{activeSemesters.length}</strong>
          </article>
          <article>
            <span>Active courses</span>
            <strong>{activeCourses.length}</strong>
          </article>
          <article>
            <span>Pending grading</span>
            <strong>{pendingGradingItems.length}</strong>
          </article>
          <article>
            <span>TA follow-ups</span>
            <strong>{pendingTaItems.length}</strong>
          </article>
          <article>
            <span>TA reminders</span>
            <strong>{taReminderAlerts.length}</strong>
          </article>
          <article>
            <span>Office-hour follow-ups</span>
            <strong>{openOfficeHourFollowUps.length}</strong>
          </article>
          <article>
            <span>Announcement alerts</span>
            <strong>{announcementAlerts.length}</strong>
          </article>
          <article>
            <span>Next 7 days</span>
            <strong>{upcomingTeachingDeadlines.length}</strong>
          </article>
          <article>
            <span>Grading estimate</span>
            <strong>{gradingEstimateMinutes}m</strong>
          </article>
          <article>
            <span>High-spoon grading</span>
            <strong>{highSpoonGradingCount}</strong>
          </article>
        </div>

        <div className="teaching-command-grid">
          <section className="teaching-attention-panel">
            <div className="teaching-panel-heading">
              <p className="eyebrow">Needs Attention</p>
              <h3>Highest priority first</h3>
            </div>

            <div className="teaching-attention-list">
              {attentionItems.slice(0, 8).map((item) => {
                const course = getCourseById(item.courseId);

                return (
                  <article key={`${item.sourceType}-${item.sourceId}`}>
                    <div>
                      <span className={`teaching-priority-badge teaching-priority-badge--${item.priority}`}>
                        {item.priority}
                      </span>
                      <strong>{item.title}</strong>
                      <p>
                        {[course?.code, formatAttentionType(item.type), item.dueDate]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {item.nextAction ? <small>{item.nextAction}</small> : null}
                    <button
                      className="teaching-chip-button"
                      type="button"
                      onClick={() => handleAddTeachingItemToToday(item)}
                      disabled={isTeachingItemOnToday(item)}
                    >
                      {isTeachingItemOnToday(item) ? "Added to Today" : "Add to Today"}
                    </button>
                  </article>
                );
              })}

              {attentionItems.length === 0 ? (
                <div className="teaching-empty-state">
                  Nothing is screaming right now. Add course details as your
                  teaching workflow grows.
                </div>
              ) : null}
            </div>
          </section>

          <section className="teaching-low-spoon-panel">
            <div className="teaching-panel-heading">
              <p className="eyebrow">Low-Spoon Teaching Mode</p>
              <h3>Only the next few moves</h3>
            </div>

            <div className="teaching-attention-list teaching-attention-list--compact">
              {lowSpoonItems.map((item) => {
                const course = getCourseById(item.courseId);

                return (
                  <article key={`${item.sourceType}-${item.sourceId}`}>
                    <div>
                      <strong>{item.nextAction || item.title}</strong>
                      <p>
                        {[course?.code, item.dueDate, formatAttentionType(item.type)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      className="teaching-chip-button"
                      type="button"
                      onClick={() => handleAddTeachingItemToToday(item)}
                      disabled={isTeachingItemOnToday(item)}
                    >
                      {isTeachingItemOnToday(item) ? "Added" : "Add"}
                    </button>
                  </article>
                );
              })}

              {lowSpoonItems.length === 0 ? (
                <div className="teaching-empty-state">
                  Nothing is screaming right now. Add course details as your
                  teaching workflow grows.
                </div>
              ) : null}

              {noNextActionItems.length > 0 ? (
                <div className="teaching-empty-state">
                  {noNextActionItems.length} teaching items need a clearer next
                  action before they become fog.
                </div>
              ) : null}
            </div>
          </section>

          <section className="teaching-deadline-panel">
            <div className="teaching-panel-heading">
              <p className="eyebrow">Upcoming Teaching Deadlines</p>
              <h3>Next 7 days</h3>
            </div>

            <div className="teaching-attention-list teaching-attention-list--compact">
              {upcomingTeachingDeadlines.slice(0, 7).map((item) => {
                const course = getCourseById(item.courseId);

                return (
                  <article key={`${item.sourceType}-${item.sourceId}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>
                        {[course?.code, item.dueDate, formatAttentionType(item.type)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {item.nextAction ? <small>{item.nextAction}</small> : null}
                    <button
                      className="teaching-chip-button"
                      type="button"
                      onClick={() => handleAddTeachingItemToToday(item)}
                      disabled={isTeachingItemOnToday(item)}
                    >
                      {isTeachingItemOnToday(item) ? "Added" : "Add"}
                    </button>
                  </article>
                );
              })}

              {upcomingTeachingDeadlines.length === 0 ? (
                <div className="teaching-empty-state">
                  Nothing is screaming right now. Add course details as your
                  teaching workflow grows.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>

      <section className="teaching-command-center">
        <div className="teaching-section-header">
          <div>
            <p className="eyebrow">Repeatable teaching</p>
            <h2>Templates and rollover</h2>
            <p>Carry structure forward without carrying old completed work.</p>
          </div>
          <div className="teaching-hero-panel__actions">
            <button
              className="teaching-secondary-button"
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
            >
              Add template
            </button>
            <button
              className="teaching-primary-button"
              type="button"
              disabled={courses.length === 0 || activeSemesters.length === 0}
              onClick={() => setIsRolloverModalOpen(true)}
            >
              Roll over course
            </button>
          </div>
        </div>

        <div className="teaching-course-grid">
          {courseTemplates.slice(0, 4).map((template) => (
            <article key={template.id} className="teaching-course-card">
              <p className="eyebrow">Template</p>
              <h3>{template.name}</h3>
              <p>
                {[template.codePattern, template.titlePattern, template.meetingPattern]
                  .filter(Boolean)
                  .join(" · ") || "Reusable course shell"}
              </p>
              <div className="teaching-course-card__meta">
                <span>{template.prepChecklist.length} prep checks</span>
                <span>{template.gradingCategories.length} grading categories</span>
                <span>{template.resourceCategories.length} resource categories</span>
                {template.taSupported ? <span>TA-supported</span> : null}
              </div>
              <div className="teaching-table-actions">
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => {
                    setEditingTemplate(template);
                    setIsTemplateModalOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="teaching-chip-button teaching-chip-button--danger"
                  type="button"
                  onClick={() => deleteCourseTemplate(template.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}

          {courseTemplates.length === 0 ? (
            <div className="teaching-empty-state teaching-empty-state--wide">
              No course templates yet. Save a reusable shell for the course you
              teach again and again.
            </div>
          ) : null}
        </div>
      </section>

      <div className="teaching-layout">
        <aside className="teaching-semester-panel">
          <div className="teaching-section-header">
            <div>
              <p className="eyebrow">Semesters</p>
              <h2>Choose the term.</h2>
            </div>
          </div>

          <div className="teaching-semester-list">
            {activeSemesters.map((semester) => (
              <SemesterCard
                key={semester.id}
                semester={semester}
                courseCount={getCoursesForSemester(semester.id).length}
                isSelected={selectedSemester?.id === semester.id}
                onSelect={() => setSelectedSemesterId(semester.id)}
                onArchive={() => archiveSemester(semester.id)}
                onRestore={() => restoreSemester(semester.id)}
              />
            ))}

            {activeSemesters.length === 0 ? (
              <div className="teaching-empty-state">
                No active semester yet. Add one semester, then add courses.
              </div>
            ) : null}
          </div>

          {archivedSemesters.length > 0 ? (
            <div className="teaching-archive-block">
              <p className="teaching-archive-block__title">Archived</p>

              <div className="teaching-semester-list">
                {archivedSemesters.map((semester) => (
                  <SemesterCard
                    key={semester.id}
                    semester={semester}
                    courseCount={getCoursesForSemester(semester.id).length}
                    isSelected={selectedSemester?.id === semester.id}
                    onSelect={() => setSelectedSemesterId(semester.id)}
                    onArchive={() => archiveSemester(semester.id)}
                    onRestore={() => restoreSemester(semester.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="teaching-course-panel">
          <div className="teaching-section-header">
            <div>
              <p className="eyebrow">
                {selectedSemester
                  ? `${selectedSemester.term} ${selectedSemester.year}`
                  : "Courses"}
              </p>
              <h2>
                {selectedSemester
                  ? selectedSemester.name
                  : "No semester selected"}
              </h2>
              <p>
                {selectedSemester
                  ? `${selectedActiveCourses.length} active courses in this semester.`
                  : "Create a semester to begin building the teaching shell."}
              </p>
            </div>

            <button
              className="teaching-primary-button"
              type="button"
              disabled={!selectedSemester || activeSemesters.length === 0}
              onClick={() => setIsCourseModalOpen(true)}
            >
              + Add Course
            </button>
          </div>

          <div className="teaching-course-grid">
            {selectedSemesterCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                semester={getSemesterById(course.semesterId)}
                pendingGradingCount={
                  getGradingItemsForCourse(course.id).filter(
                    (item) =>
                      item.status === "pending" || item.status === "in-progress"
                  ).length
                }
                incompletePrepCount={
                  getPrepSessionsForCourse(course.id).filter(
                    (session) => !session.completed
                  ).length
                }
                pendingTaCount={
                  getTaItemsForCourse(course.id).filter((item) => !item.completed)
                    .length
                }
                taReminderAlertCount={getTaReminderAlerts(course.id).length}
                openOfficeHourFollowUpCount={
                  getOfficeHourVisitsForCourse(course.id).filter(
                    (visit) => !visit.followUpCompleted
                  ).length
                }
                announcementAlertCount={getAnnouncementAlerts(course.id).length}
                noteCount={getCourseNotesForCourse(course.id).length}
                resourceCount={getResourcesForCourse(course.id).length}
                nextMeetingDate={nextDate(
                  getMeetingsForCourse(course.id)
                    .filter((meeting) => !meeting.canceled)
                    .map((meeting) => meeting.date)
                )}
                nextGradingDueDate={nextDate(
                  getGradingItemsForCourse(course.id)
                    .filter(
                      (item) =>
                        item.status === "pending" ||
                        item.status === "in-progress"
                    )
                    .map((item) => item.dueDate)
                )}
                onArchive={() => archiveCourse(course.id)}
                onRestore={() => restoreCourse(course.id)}
              />
            ))}

            {selectedSemester && selectedSemesterCourses.length === 0 ? (
              <div className="teaching-empty-state teaching-empty-state--wide">
                No courses in this semester yet. Add the course shell now;
                grading, prep, office hours, and TA tools come later.
              </div>
            ) : null}

            {!selectedSemester ? (
              <div className="teaching-empty-state teaching-empty-state--wide">
                No semester selected yet.
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {isSemesterModalOpen ? (
        <SemesterModal
          onClose={() => setIsSemesterModalOpen(false)}
          onSave={handleCreateSemester}
        />
      ) : null}

      {isCourseModalOpen ? (
        <CourseModal
          semesters={activeSemesters}
          templates={courseTemplates}
          selectedSemesterId={selectedSemester?.id}
          onClose={() => setIsCourseModalOpen(false)}
          onSave={handleCreateCourse}
        />
      ) : null}

      {isTemplateModalOpen ? (
        <CourseTemplateModal
          template={editingTemplate}
          onClose={closeTemplateModal}
          onSave={handleSaveTemplate}
        />
      ) : null}

      {isRolloverModalOpen ? (
        <CourseRolloverModal
          courses={courses}
          semesters={activeSemesters}
          selectedCourse={selectedSemesterCourses[0]}
          selectedSemesterId={selectedSemester?.id}
          onClose={() => setIsRolloverModalOpen(false)}
          onSave={handleRolloverCourse}
        />
      ) : null}
    </section>
  );
}
