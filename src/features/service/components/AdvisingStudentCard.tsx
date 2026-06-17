import { Link } from "react-router-dom";
import type { AdvisingStudent, SemesterGoalStatus } from "../types";
import { formatServiceDate } from "../utils/serviceFormat";

const goalStatusLabels: Record<SemesterGoalStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  reached: "Reached",
  revised: "Revised",
  stalled: "Stalled",
};

type AdvisingStudentCardProps = {
  student: AdvisingStudent;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
};

export function AdvisingStudentCard({
  student,
  onEdit,
  onArchive,
  onRestore,
}: AdvisingStudentCardProps) {
  return (
    <article className="service-student-card">
      <div>
        <p className="eyebrow">{student.role}</p>
        <h3>{student.name}</h3>
        <p>{student.program ?? "Program not set"}</p>
      </div>

      <div className="service-student-card__meta">
        {student.stage ? <span>{student.stage}</span> : null}
        {student.ultimateGoal ? <span>{student.ultimateGoal}</span> : null}
        {student.semesterGoalStatus ? (
          <span>{goalStatusLabels[student.semesterGoalStatus]}</span>
        ) : null}
      </div>

      {student.semesterGoal ? (
        <p className="service-student-card__goal">
          <strong>Semester goal:</strong> {student.semesterGoal}
        </p>
      ) : null}

      <div className="service-student-card__dates">
        <span>Last contact: {formatServiceDate(student.lastContactDate)}</span>
        <span>Next meeting: {formatServiceDate(student.nextMeetingDate)}</span>
      </div>

      <Link className="service-secondary-link" to={`/service/advising/${student.id}`}>
        Open student
      </Link>

      {onEdit || onArchive || onRestore ? (
        <div className="service-item-card__actions">
          {onEdit ? (
            <button className="service-chip-button" type="button" onClick={onEdit}>
              Edit
            </button>
          ) : null}
          {student.status === "archived" && onRestore ? (
            <button className="service-chip-button" type="button" onClick={onRestore}>
              Restore
            </button>
          ) : null}
          {student.status !== "archived" && onArchive ? (
            <button className="service-chip-button" type="button" onClick={onArchive}>
              Archive
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
