import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { AnnouncementReminderModal } from "../components/AnnouncementReminderModal";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingCourseSummaryStrip } from "../components/TeachingCourseSummaryStrip";
import { TeachingEmailDraftModal } from "../components/TeachingEmailDraftModal";
import { useTeaching } from "../hooks/useTeaching";
import type {
  NewTeachingAnnouncementReminderInput,
  TeachingAnnouncementReminder,
  TeachingAnnouncementStatus,
} from "../types";
import type { TeachingEmailDraft } from "../utils/teachingEmailTemplates";
import {
  generateStudentAnnouncementTemplate,
  generateTaPostAnnouncementEmail,
} from "../utils/teachingEmailTemplates";
import { announcementTaskInput } from "../utils/teachingTaskBridge";
import "./teaching.css";

const statusFilters: Array<{ label: string; value: TeachingAnnouncementStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Planned", value: "planned" },
  { label: "Drafted", value: "drafted" },
  { label: "Posted", value: "posted" },
  { label: "Skipped", value: "skipped" },
];

function dateTimestamp(value?: string) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function sortAnnouncements(reminders: TeachingAnnouncementReminder[]) {
  return [...reminders].sort((a, b) => {
    const announcementCompare =
      dateTimestamp(a.announcementDate) - dateTimestamp(b.announcementDate);

    if (announcementCompare !== 0) {
      return announcementCompare;
    }

    return dateTimestamp(a.dueDate) - dateTimestamp(b.dueDate);
  });
}

export function TeachingAnnouncementsPage() {
  const { courseId } = useParams();
  const {
    getCourseById,
    getSemesterById,
    getTeachingAssistantsForCourse,
    getAnnouncementRemindersForCourse,
    getAnnouncementAlerts,
    createAnnouncementReminder,
    updateAnnouncementReminder,
    deleteAnnouncementReminder,
  } = useTeaching();
  const [statusFilter, setStatusFilter] = useState<TeachingAnnouncementStatus | "all">(
    "all"
  );
  const [editingReminder, setEditingReminder] =
    useState<TeachingAnnouncementReminder>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState<TeachingEmailDraft>();
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();

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
            Back to Teaching
          </Link>
        </div>
      </section>
    );
  }

  const currentCourse = course;
  const reminders = sortAnnouncements(
    getAnnouncementRemindersForCourse(currentCourse.id)
  );
  const filteredReminders = reminders.filter(
    (reminder) => statusFilter === "all" || reminder.status === statusFilter
  );
  const alerts = getAnnouncementAlerts(currentCourse.id);
  const assistants = getTeachingAssistantsForCourse(currentCourse.id).filter(
    (assistant) => assistant.active
  );
  const summary = {
    planned: reminders.filter((reminder) => reminder.status === "planned").length,
    drafted: reminders.filter((reminder) => reminder.status === "drafted").length,
    posted: reminders.filter((reminder) => reminder.status === "posted").length,
    skipped: reminders.filter((reminder) => reminder.status === "skipped").length,
  };

  function openAddModal() {
    setEditingReminder(undefined);
    setIsModalOpen(true);
  }

  function handleSave(input: NewTeachingAnnouncementReminderInput) {
    if (editingReminder) {
      updateAnnouncementReminder(editingReminder.id, input);
    } else {
      createAnnouncementReminder(input);
    }

    setEditingReminder(undefined);
    setIsModalOpen(false);
  }

  function handleDelete(reminder: TeachingAnnouncementReminder) {
    if (window.confirm(`Delete reminder for ${reminder.itemName}?`)) {
      deleteAnnouncementReminder(reminder.id);
    }
  }

  function updateStatus(
    reminder: TeachingAnnouncementReminder,
    status: TeachingAnnouncementStatus
  ) {
    updateAnnouncementReminder(reminder.id, { status });
  }

  function draftStudentAnnouncement(reminder: TeachingAnnouncementReminder) {
    const draft = generateStudentAnnouncementTemplate({ course: currentCourse, reminder });

    updateAnnouncementReminder(reminder.id, {
      announcementSubject: draft.subject,
      announcementBody: draft.body,
      status: reminder.status === "planned" ? "drafted" : reminder.status,
    });
    setEmailDraft(draft);
  }

  function draftTaEmail(reminder: TeachingAnnouncementReminder) {
    const announcementDraft = reminder.announcementBody
      ? {
          subject: reminder.announcementSubject || `Reminder: ${reminder.itemName}`,
          body: reminder.announcementBody,
        }
      : generateStudentAnnouncementTemplate({ course: currentCourse, reminder });
    const draft = generateTaPostAnnouncementEmail({
      course: currentCourse,
      reminder,
      announcement: announcementDraft,
      ta: assistants[0],
    });

    updateAnnouncementReminder(reminder.id, {
      taEmailSubject: draft.subject,
      taEmailBody: draft.body,
      status: reminder.status === "planned" ? "drafted" : reminder.status,
    });
    setEmailDraft(draft);
  }

  function handleAddAnnouncementToToday(reminder: TeachingAnnouncementReminder) {
    addLinkedTaskToToday(announcementTaskInput(currentCourse, reminder));
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${currentCourse.id}`}>
            Back to {currentCourse.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} ·
            Announcements
          </p>

          <h1>{currentCourse.code}: Announcement Reminders</h1>

          <p>
            Track student-facing reminders, draft copy for ICON or email, and
            keep TA nudges ready without auto-posting anything.
          </p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Planned</span>
          <strong>{summary.planned}</strong>

          <span>Drafted</span>
          <strong>{summary.drafted}</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={currentCourse.id} />
      <TeachingCourseSummaryStrip courseId={currentCourse.id} />

      <div className="teaching-notebook-toolbar">
        <div>
          <p className="eyebrow">Announcement Queue</p>
          <h2>Student reminders</h2>
        </div>
        <button className="teaching-primary-button" type="button" onClick={openAddModal}>
          Add Announcement Reminder
        </button>
      </div>

      <div className="teaching-notebook-grid">
        <div className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Status</p>
            <h3>Reminder shape</h3>
          </div>
          <div className="teaching-summary-card-grid">
            <article>
              <span>Planned</span>
              <strong>{summary.planned}</strong>
            </article>
            <article>
              <span>Drafted</span>
              <strong>{summary.drafted}</strong>
            </article>
            <article>
              <span>Posted</span>
              <strong>{summary.posted}</strong>
            </article>
            <article>
              <span>Skipped</span>
              <strong>{summary.skipped}</strong>
            </article>
          </div>
        </div>

        <div className="teaching-notebook-panel">
          <div className="teaching-panel-heading">
            <p className="eyebrow">Alerts</p>
            <h3>Needs attention</h3>
          </div>
          {alerts.length === 0 ? (
            <div className="teaching-empty-state">
              <p>No announcement reminders are due right now.</p>
            </div>
          ) : (
            <div className="teaching-alert-list">
              {alerts.map((alert) => {
                const reminder = reminders.find(
                  (candidate) => candidate.id === alert.reminderId
                );

                return (
                  <article className="teaching-alert-card" key={alert.id}>
                    <div>
                      <p className="eyebrow">
                        {alert.priority} priority · announce{" "}
                        {alert.announcementDate || "no date"}
                      </p>
                      <h4>{alert.title}</h4>
                      <p>{alert.nextAction}</p>
                    </div>
                    {reminder ? (
                      <div className="teaching-table-actions">
                        <button
                          className="teaching-chip-button"
                          type="button"
                          onClick={() => draftStudentAnnouncement(reminder)}
                        >
                          Draft announcement
                        </button>
                        <button
                          className="teaching-chip-button"
                          type="button"
                          onClick={() => handleAddAnnouncementToToday(reminder)}
                          disabled={isSourceOnToday("announcement", reminder.id)}
                        >
                          {isSourceOnToday("announcement", reminder.id)
                            ? "Added to Today"
                            : "Add to Today"}
                        </button>
                        <button
                          className="teaching-chip-button"
                          type="button"
                          onClick={() => updateStatus(reminder, "posted")}
                        >
                          Mark posted
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="teaching-prep-controls">
        <div className="teaching-filter-group">
          {statusFilters.map((option) => (
            <button
              key={option.value}
              className="teaching-chip-button"
              type="button"
              aria-pressed={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredReminders.length === 0 ? (
        <div className="teaching-empty-state">
          <p>
            No announcement reminders yet. Add one for assignments, quizzes,
            readings, exams, or class logistics that students should see before
            the due date.
          </p>
          <button className="teaching-primary-button" type="button" onClick={openAddModal}>
            Add Announcement Reminder
          </button>
        </div>
      ) : (
        <div className="teaching-announcement-grid">
          {filteredReminders.map((reminder) => (
            <article className="teaching-announcement-card" key={reminder.id}>
              <div>
                <p className="eyebrow">
                  {reminder.status} · {reminder.audience} · {reminder.channel}
                </p>
                <h3>{reminder.title || reminder.itemName}</h3>
                <p>
                  {reminder.itemType} due {reminder.dueDate || "no due date"} ·
                  announce {reminder.announcementDate || "no announcement date"}
                </p>
                {reminder.notes ? <p>{reminder.notes}</p> : null}
                {reminder.announcementSubject ? (
                  <p>
                    <strong>Student draft:</strong> {reminder.announcementSubject}
                  </p>
                ) : null}
                {reminder.taEmailSubject ? (
                  <p>
                    <strong>TA draft:</strong> {reminder.taEmailSubject}
                  </p>
                ) : null}
              </div>

              <div className="teaching-table-actions">
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => draftStudentAnnouncement(reminder)}
                >
                  Generate student announcement
                </button>
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => draftTaEmail(reminder)}
                >
                  Generate TA email
                </button>
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => handleAddAnnouncementToToday(reminder)}
                  disabled={isSourceOnToday("announcement", reminder.id)}
                >
                  {isSourceOnToday("announcement", reminder.id)
                    ? "Added to Today"
                    : "Add to Today"}
                </button>
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => updateStatus(reminder, "drafted")}
                >
                  Mark drafted
                </button>
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => updateStatus(reminder, "posted")}
                >
                  Mark posted
                </button>
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => updateStatus(reminder, "skipped")}
                >
                  Skip
                </button>
                <button
                  className="teaching-chip-button"
                  type="button"
                  onClick={() => {
                    setEditingReminder(reminder);
                    setIsModalOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="teaching-chip-button teaching-chip-button--danger"
                  type="button"
                  onClick={() => handleDelete(reminder)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <AnnouncementReminderModal
          courseId={currentCourse.id}
          reminder={editingReminder}
          onClose={() => {
            setEditingReminder(undefined);
            setIsModalOpen(false);
          }}
          onSave={handleSave}
        />
      ) : null}

      {emailDraft ? (
        <TeachingEmailDraftModal
          draft={emailDraft}
          onClose={() => setEmailDraft(undefined)}
        />
      ) : null}
    </section>
  );
}
