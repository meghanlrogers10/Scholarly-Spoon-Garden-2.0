import { PrepChecklist } from "./PrepChecklist";
import { getChecklistCompletion } from "./prepChecklistUtils";
import type { TeachingMeeting, TeachingPrepSession } from "../types";

type PrepSessionCardProps = {
  session: TeachingPrepSession;
  linkedMeeting?: TeachingMeeting;
  changeNextTime?: string;
  onEdit: (session: TeachingPrepSession) => void;
  onDelete: (session: TeachingPrepSession) => void;
  onToggleCompleted: (session: TeachingPrepSession) => void;
  onAddToToday?: (session: TeachingPrepSession) => void;
  isOnToday?: boolean;
};

export function PrepSessionCard({
  session,
  linkedMeeting,
  changeNextTime,
  onEdit,
  onDelete,
  onToggleCompleted,
  onAddToToday,
  isOnToday,
}: PrepSessionCardProps) {
  const completion = getChecklistCompletion(session.prepChecklist);

  return (
    <article
      className={`teaching-prep-card ${
        session.completed ? "teaching-prep-card--completed" : ""
      }`}
    >
      <div className="teaching-prep-card__header">
        <div>
          <p className="eyebrow">Week {session.week || "unsorted"}</p>
          <h3>{session.topic || linkedMeeting?.topic || "Untitled prep"}</h3>
          {linkedMeeting ? (
            <p>
              Linked class: {linkedMeeting.date || "No date"} ·{" "}
              {linkedMeeting.topic || "Untitled meeting"}
            </p>
          ) : (
            <p>No linked class meeting.</p>
          )}
        </div>

        <button
          className="teaching-status-toggle"
          type="button"
          aria-pressed={session.completed}
          onClick={() => onToggleCompleted(session)}
        >
          {session.completed ? "Completed" : "Needs prep"}
        </button>
      </div>

      <div className="teaching-prep-card__grid">
        <div>
          <span>Slides / link</span>
          <p>{session.slides || "None yet"}</p>
        </div>
        <div>
          <span>Next action</span>
          <p>{session.nextAction || "No next action captured yet"}</p>
        </div>
      </div>

      <div className="teaching-prep-card__block">
        <span>Teaching plan / notes</span>
        <p>{session.plan || "No plan yet"}</p>
      </div>

      {changeNextTime ? (
        <div className="teaching-prep-card__note">
          <span>Last time note</span>
          <p>{changeNextTime}</p>
        </div>
      ) : null}

      <div className="teaching-prep-card__footer">
        <span>
          Checklist {completion.completed}/{completion.total}
        </span>
        <div className="teaching-table-actions">
          {onAddToToday ? (
            <button
              className="teaching-chip-button"
              type="button"
              onClick={() => onAddToToday(session)}
              disabled={isOnToday}
            >
              {isOnToday ? "Added to Today" : "Add to Today"}
            </button>
          ) : null}
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onEdit(session)}
          >
            Edit
          </button>
          <button
            className="teaching-chip-button teaching-chip-button--danger"
            type="button"
            onClick={() => onDelete(session)}
          >
            Delete
          </button>
        </div>
      </div>

      <PrepChecklist value={session.prepChecklist} readOnly />
    </article>
  );
}
