import { useTeaching } from "../hooks/useTeaching";

type TeachingCourseSummaryStripProps = {
  courseId: string;
};

function nextDate(values: Array<string | undefined>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return values
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const timestamp = new Date(`${value}T00:00:00`).getTime();
      return Number.isFinite(timestamp) && timestamp >= today.getTime();
    })
    .sort((a, b) => a.localeCompare(b))[0];
}

function isOverdue(value?: string) {
  if (!value) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(timestamp) && timestamp < today.getTime();
}

export function TeachingCourseSummaryStrip({
  courseId,
}: TeachingCourseSummaryStripProps) {
  const {
    getMeetingsForCourse,
    getPrepSessionsForCourse,
    getGradingItemsForCourse,
    getTaItemsForCourse,
    getOfficeHourVisitsForCourse,
    getCourseNotesForCourse,
    getResourcesForCourse,
    getAnnouncementRemindersForCourse,
    getTaReminderAlerts,
    getAnnouncementAlerts,
  } = useTeaching();

  const meetings = getMeetingsForCourse(courseId);
  const prepSessions = getPrepSessionsForCourse(courseId);
  const incompletePrepSessions = prepSessions.filter(
    (session) => !session.completed
  );
  const gradingItems = getGradingItemsForCourse(courseId);
  const taItems = getTaItemsForCourse(courseId);
  const officeHourVisits = getOfficeHourVisitsForCourse(courseId);
  const courseNotes = getCourseNotesForCourse(courseId);
  const changeNextTimeNotes = courseNotes.filter((note) => {
    const text = `${note.title} ${note.body} ${(note.tags ?? []).join(" ")}`.toLowerCase();
    return note.noteType === "change-next-time" || text.includes("change next time");
  });
  const resources = getResourcesForCourse(courseId);
  const announcementReminders = getAnnouncementRemindersForCourse(courseId);
  const taReminderAlerts = getTaReminderAlerts(courseId);
  const announcementAlerts = getAnnouncementAlerts(courseId);
  const keyResources = resources.filter((resource) =>
    ["syllabus", "icon", "slides", "assignment", "rubric"].includes(
      resource.resourceType
    )
  );
  const pendingGradingItems = gradingItems.filter(
    (item) => item.status === "pending" || item.status === "in-progress"
  );
  const overdueGradingItems = pendingGradingItems.filter((item) =>
    isOverdue(item.dueDate)
  );
  const openTaItems = taItems.filter((item) => !item.completed);
  const openOfficeHourFollowUps = officeHourVisits.filter(
    (visit) => !visit.followUpCompleted
  );
  const nextMeetingDate = nextDate(
    meetings.filter((meeting) => !meeting.canceled).map((meeting) => meeting.date)
  );

  return (
    <div className="teaching-course-summary-strip">
      <span>
        {meetings.length} meetings ·{" "}
        {nextMeetingDate ? `next ${nextMeetingDate}` : "no next class"}
      </span>
      <span>
        {prepSessions.length} prep · {incompletePrepSessions.length} open
      </span>
      <span>
        {pendingGradingItems.length} grading · {overdueGradingItems.length} overdue
      </span>
      <span>
        {openTaItems.length} TA open · {taReminderAlerts.length} reminders
      </span>
      <span>
        {officeHourVisits.length} office hours · {openOfficeHourFollowUps.length} follow-ups
      </span>
      <span>
        {announcementReminders.length} announcements · {announcementAlerts.length} alerts
      </span>
      <span>
        {courseNotes.length} notes · {changeNextTimeNotes.length} change-next-time
      </span>
      <span>
        {resources.length} resources · {keyResources.length} key
      </span>
    </div>
  );
}
