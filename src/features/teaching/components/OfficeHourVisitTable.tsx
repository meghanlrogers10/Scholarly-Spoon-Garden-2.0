import {
  OfficeHourVisitRow,
  type OfficeHourStatus,
} from "./OfficeHourVisitRow";
import type { TeachingOfficeHourVisit } from "../types";

type OfficeHourVisitTableProps = {
  visits: TeachingOfficeHourVisit[];
  onAddVisit: () => void;
  onEditVisit: (visit: TeachingOfficeHourVisit) => void;
  onDeleteVisit: (visit: TeachingOfficeHourVisit) => void;
  onToggleFollowUp: (visit: TeachingOfficeHourVisit) => void;
  onStatusChange: (visit: TeachingOfficeHourVisit, status: OfficeHourStatus) => void;
  onAddToToday?: (visit: TeachingOfficeHourVisit) => void;
  isOnToday?: (visit: TeachingOfficeHourVisit) => boolean;
};

export function OfficeHourVisitTable({
  visits,
  onAddVisit,
  onEditVisit,
  onDeleteVisit,
  onToggleFollowUp,
  onStatusChange,
  onAddToToday,
  isOnToday,
}: OfficeHourVisitTableProps) {
  if (visits.length === 0) {
    return (
      <div className="teaching-empty-state">
        <p>
          No office-hour visits yet. Add student questions, follow-ups, or
          issues you want future-you to remember.
        </p>
        <button className="teaching-primary-button" type="button" onClick={onAddVisit}>
          Add Visit
        </button>
      </div>
    );
  }

  return (
    <div className="teaching-table-shell">
      <table className="teaching-meeting-table teaching-grading-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Visit date</th>
            <th>Concern</th>
            <th>Follow-up</th>
            <th>Next action</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <OfficeHourVisitRow
              key={visit.id}
              visit={visit}
              onEdit={onEditVisit}
              onDelete={onDeleteVisit}
              onToggleFollowUp={onToggleFollowUp}
              onStatusChange={onStatusChange}
              onAddToToday={onAddToToday}
              isOnToday={isOnToday?.(visit) ?? false}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
