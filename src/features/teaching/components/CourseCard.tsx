import { Link } from "react-router-dom";
import type { TeachingCourse, TeachingSemester } from "../types";

type CourseCardProps = {
  course: TeachingCourse;
  semester?: TeachingSemester;
  pendingGradingCount?: number;
  incompletePrepCount?: number;
  pendingTaCount?: number;
  taReminderAlertCount?: number;
  openOfficeHourFollowUpCount?: number;
  announcementAlertCount?: number;
  noteCount?: number;
  resourceCount?: number;
  nextMeetingDate?: string;
  nextGradingDueDate?: string;
  onArchive: () => void;
  onRestore: () => void;
};

export function CourseCard({
  course,
  semester,
  pendingGradingCount = 0,
  incompletePrepCount = 0,
  pendingTaCount = 0,
  taReminderAlertCount = 0,
  openOfficeHourFollowUpCount = 0,
  announcementAlertCount = 0,
  noteCount = 0,
  resourceCount = 0,
  nextMeetingDate,
  nextGradingDueDate,
  onArchive,
  onRestore,
}: CourseCardProps) {
  return (
    <article className="teaching-course-card">
      <div>
        <p className="teaching-course-card__eyebrow">
          {course.code}
          {course.section ? ` · Section ${course.section}` : ""}
        </p>

        <h2>{course.title}</h2>

        <p>
          {semester ? `${semester.term} ${semester.year}` : "No semester linked"}
        </p>
      </div>

      <div className="teaching-course-card__meta">
        {course.meetingPattern ? <span>{course.meetingPattern}</span> : null}
        {course.location ? <span>{course.location}</span> : null}
        {nextMeetingDate ? <span>Next class {nextMeetingDate}</span> : null}
        {nextGradingDueDate ? <span>Grading due {nextGradingDueDate}</span> : null}
        {incompletePrepCount > 0 ? <span>{incompletePrepCount} prep open</span> : null}
        {pendingGradingCount > 0 ? (
          <span>{pendingGradingCount} grading pending</span>
        ) : null}
        {pendingTaCount > 0 ? <span>{pendingTaCount} TA open</span> : null}
        {taReminderAlertCount > 0 ? (
          <span>{taReminderAlertCount} TA reminders</span>
        ) : null}
        {openOfficeHourFollowUpCount > 0 ? (
          <span>{openOfficeHourFollowUpCount} office-hour follow-up</span>
        ) : null}
        {announcementAlertCount > 0 ? (
          <span>{announcementAlertCount} announcement alerts</span>
        ) : null}
        {noteCount > 0 ? <span>{noteCount} notes</span> : null}
        {resourceCount > 0 ? <span>{resourceCount} resources</span> : null}
        <span>{course.status}</span>
      </div>

      {course.notes ? (
        <p className="teaching-course-card__notes">{course.notes}</p>
      ) : null}

      <div className="teaching-course-card__actions">
        <Link className="teaching-chip-button" to={`/teaching/${course.id}`}>
          Open Course
        </Link>

        {course.status === "active" ? (
          <button className="teaching-chip-button" type="button" onClick={onArchive}>
            Archive
          </button>
        ) : (
          <button className="teaching-chip-button" type="button" onClick={onRestore}>
            Restore
          </button>
        )}
      </div>
    </article>
  );
}
