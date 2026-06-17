import { Link, useParams } from "react-router-dom";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { TeachingWorkspaceTile } from "../components/TeachingWorkspaceTile";
import { useTeaching } from "../hooks/useTeaching";
import "./teaching.css";

export function TeachingCoursePage() {
  const { courseId } = useParams();
  const {
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

  const course = getCourseById(courseId);
  const semester = course ? getSemesterById(course.semesterId) : undefined;

  if (!course) {
    return (
      <section className="teaching-page page-stack">
        <div className="teaching-hero-panel">
          <div>
            <p className="eyebrow">Teaching</p>
            <h1>Course not found.</h1>
            <p>This course may have been archived, deleted, or not created yet.</p>
          </div>

          <Link className="teaching-secondary-button" to="/teaching">
            ← Back to Teaching
          </Link>
        </div>
      </section>
    );
  }

  const basePath = `/teaching/${course.id}`;
  const meetings = getMeetingsForCourse(course.id);
  const prepSessions = getPrepSessionsForCourse(course.id);
  const gradingItems = getGradingItemsForCourse(course.id);
  const taItems = getTaItemsForCourse(course.id);
  const officeHourVisits = getOfficeHourVisitsForCourse(course.id);
  const courseNotes = getCourseNotesForCourse(course.id);
  const resources = getResourcesForCourse(course.id);
  const pendingGradingCount = gradingItems.filter(
    (item) => item.status === "pending" || item.status === "in-progress"
  ).length;
  const openTaCount = taItems.filter((item) => !item.completed).length;
  const openOfficeHourFollowUpCount = officeHourVisits.filter(
    (visit) => !visit.followUpCompleted
  ).length;

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to="/teaching">
            ← Back to Teaching
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"}
          </p>

          <h1>
            {course.code}: {course.title}
          </h1>

          <p>
            {course.section ? `Section ${course.section}. ` : ""}
            {course.meetingPattern ? `${course.meetingPattern}. ` : ""}
            {course.location ? `${course.location}.` : ""}
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Status</span>
          <strong>{course.status}</strong>

          <span>Semester</span>
          <strong>{semester?.name ?? "No semester"}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={course.id} />

      <TeachingCourseSummaryStrip courseId={course.id} />

      {course.notes ? (
        <div className="teaching-course-note-panel">
          <p className="eyebrow">Course notes</p>
          <p>{course.notes}</p>
        </div>
      ) : null}

      <div className="teaching-workspace-grid">
        <TeachingWorkspaceTile
          title="Class Notebook"
          description="Schedule, class meetings, readings, due items, and changes for next time."
          meta={`${meetings.length} meetings planned`}
          to={`${basePath}/notebook`}
        />

        <TeachingWorkspaceTile
          title="Class Prep"
          description="Prep notes, slides, class plans, reminders, and lecture flow."
          meta={`${prepSessions.length} prep sessions`}
          to={`${basePath}/class-prep`}
        />

        <TeachingWorkspaceTile
          title="Grading"
          description="Assignments, grading queues, rubric reminders, and return plans."
          meta={`${pendingGradingCount} grading items pending`}
          to={`${basePath}/grading`}
        />

        <TeachingWorkspaceTile
          title="Office Hours"
          description="Student meetings, follow-ups, patterns, and appointment notes."
          meta={`${openOfficeHourFollowUpCount} follow-ups waiting`}
          to={`${basePath}/office-hours`}
        />

        <TeachingWorkspaceTile
          title="TA Follow-Up"
          description="TA check-ins, delegation, grading calibration, and reminders."
          meta={`${openTaCount} TA follow-ups open`}
          to={`${basePath}/ta`}
        />

        <TeachingWorkspaceTile
          title="Course Notes"
          description="Loose course thoughts, what worked, what to change next time."
          meta={`${courseNotes.length} notes`}
          to={`${basePath}/notes`}
        />

        <TeachingWorkspaceTile
          title="Resources"
          description="Slides, rubrics, readings, assignments, examples, and links."
          meta={`${resources.length} resources`}
          to={`${basePath}/resources`}
        />
      </div>
    </section>
  );
}
