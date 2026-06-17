import type { TeachingMeeting } from "../types";

type TeachingMeetingRowProps = {
  meeting: TeachingMeeting;
  onEdit: (meeting: TeachingMeeting) => void;
  onDelete: (meeting: TeachingMeeting) => void;
  onToggleCanceled: (meeting: TeachingMeeting) => void;
};

export function TeachingMeetingRow({
  meeting,
  onEdit,
  onDelete,
  onToggleCanceled,
}: TeachingMeetingRowProps) {
  return (
    <tr className={meeting.canceled ? "teaching-meeting-row--canceled" : ""}>
      <td>{meeting.week || "None"}</td>
      <td>{meeting.date || "Unscheduled"}</td>
      <td>
        <strong>{meeting.topic || "Untitled meeting"}</strong>
      </td>
      <td>{meeting.readings || "None"}</td>
      <td>{meeting.due || "None"}</td>
      <td>{meeting.notes || "None"}</td>
      <td>{meeting.changeNextTime || "None"}</td>
      <td>
        <button
          className="teaching-status-toggle"
          type="button"
          onClick={() => onToggleCanceled(meeting)}
          aria-pressed={meeting.canceled}
        >
          {meeting.canceled ? "Canceled" : "Active"}
        </button>
      </td>
      <td>
        <div className="teaching-table-actions">
          <button
            className="teaching-chip-button"
            type="button"
            onClick={() => onEdit(meeting)}
          >
            Edit
          </button>
          <button
            className="teaching-chip-button teaching-chip-button--danger"
            type="button"
            onClick={() => onDelete(meeting)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
