import { TeachingMeetingRow } from "./TeachingMeetingRow";
import type { TeachingMeeting } from "../types";

type TeachingMeetingTableProps = {
  meetings: TeachingMeeting[];
  onAddMeeting: () => void;
  onEditMeeting: (meeting: TeachingMeeting) => void;
  onDeleteMeeting: (meeting: TeachingMeeting) => void;
  onToggleCanceled: (meeting: TeachingMeeting) => void;
};

export function TeachingMeetingTable({
  meetings,
  onAddMeeting,
  onEditMeeting,
  onDeleteMeeting,
  onToggleCanceled,
}: TeachingMeetingTableProps) {
  if (meetings.length === 0) {
    return (
      <div className="teaching-empty-state">
        <p>
          No class meetings planned yet. Generate a semester schedule or add the
          first meeting.
        </p>
        <button
          className="teaching-primary-button"
          type="button"
          onClick={onAddMeeting}
        >
          Add meeting
        </button>
      </div>
    );
  }

  return (
    <div className="teaching-table-shell">
      <table className="teaching-meeting-table">
        <thead>
          <tr>
            <th>Week</th>
            <th>Date</th>
            <th>Topic</th>
            <th>Readings</th>
            <th>Due</th>
            <th>Notes</th>
            <th>Change next time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting) => (
            <TeachingMeetingRow
              key={meeting.id}
              meeting={meeting}
              onEdit={onEditMeeting}
              onDelete={onDeleteMeeting}
              onToggleCanceled={onToggleCanceled}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
