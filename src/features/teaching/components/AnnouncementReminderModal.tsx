import { useState } from "react";
import type { FormEvent } from "react";
import type {
  NewTeachingAnnouncementReminderInput,
  TeachingAnnouncementAudience,
  TeachingAnnouncementChannel,
  TeachingAnnouncementItemType,
  TeachingAnnouncementReminder,
  TeachingAnnouncementStatus,
} from "../types";

type AnnouncementReminderModalProps = {
  courseId: string;
  reminder?: TeachingAnnouncementReminder;
  onClose: () => void;
  onSave: (input: NewTeachingAnnouncementReminderInput) => void;
};

const itemTypes: TeachingAnnouncementItemType[] = [
  "assignment",
  "quiz",
  "exam",
  "reading",
  "class",
  "other",
];

const audiences: TeachingAnnouncementAudience[] = ["students", "ta", "both"];
const channels: TeachingAnnouncementChannel[] = ["icon", "email", "ta-email", "other"];
const statuses: TeachingAnnouncementStatus[] = ["planned", "drafted", "posted", "skipped"];

export function AnnouncementReminderModal({
  courseId,
  reminder,
  onClose,
  onSave,
}: AnnouncementReminderModalProps) {
  const [formState, setFormState] = useState<NewTeachingAnnouncementReminderInput>({
    courseId,
    title: reminder?.title ?? "",
    itemName: reminder?.itemName ?? "",
    itemType: reminder?.itemType ?? "assignment",
    dueDate: reminder?.dueDate ?? "",
    announcementDate: reminder?.announcementDate ?? "",
    audience: reminder?.audience ?? "students",
    channel: reminder?.channel ?? "icon",
    status: reminder?.status ?? "planned",
    announcementSubject: reminder?.announcementSubject ?? "",
    announcementBody: reminder?.announcementBody ?? "",
    taEmailSubject: reminder?.taEmailSubject ?? "",
    taEmailBody: reminder?.taEmailBody ?? "",
    notes: reminder?.notes ?? "",
  });

  function updateField<Key extends keyof NewTeachingAnnouncementReminderInput>(
    key: Key,
    value: NewTeachingAnnouncementReminderInput[Key]
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemName = formState.itemName.trim();
    const title = formState.title.trim() || itemName;

    if (!itemName && !title) {
      return;
    }

    onSave({
      ...formState,
      title,
      itemName: itemName || title,
      notes: formState.notes.trim(),
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal teaching-modal--wide" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">Announcement reminder</p>
            <h2>{reminder ? "Edit reminder" : "Add reminder"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Title</span>
            <input
              value={formState.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Homework 5 reminder"
            />
          </label>

          <label>
            <span>Item name</span>
            <input
              required
              value={formState.itemName}
              onChange={(event) => updateField("itemName", event.target.value)}
              placeholder="Homework 5"
            />
          </label>

          <label>
            <span>Item type</span>
            <select
              value={formState.itemType}
              onChange={(event) =>
                updateField(
                  "itemType",
                  event.target.value as TeachingAnnouncementItemType
                )
              }
            >
              {itemTypes.map((itemType) => (
                <option key={itemType} value={itemType}>
                  {itemType}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Due date</span>
            <input
              type="date"
              value={formState.dueDate}
              onChange={(event) => updateField("dueDate", event.target.value)}
            />
          </label>

          <label>
            <span>Announcement date</span>
            <input
              type="date"
              value={formState.announcementDate}
              onChange={(event) => updateField("announcementDate", event.target.value)}
            />
          </label>

          <label>
            <span>Audience</span>
            <select
              value={formState.audience}
              onChange={(event) =>
                updateField(
                  "audience",
                  event.target.value as TeachingAnnouncementAudience
                )
              }
            >
              {audiences.map((audience) => (
                <option key={audience} value={audience}>
                  {audience}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Channel</span>
            <select
              value={formState.channel}
              onChange={(event) =>
                updateField("channel", event.target.value as TeachingAnnouncementChannel)
              }
            >
              {channels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select
              value={formState.status}
              onChange={(event) =>
                updateField("status", event.target.value as TeachingAnnouncementStatus)
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="teaching-form-grid__full">
            <span>Notes</span>
            <textarea
              rows={4}
              value={formState.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="What students need reminded about, where it lives, or what TAs should emphasize."
            />
          </label>

          <div className="teaching-modal__actions teaching-form-grid__full">
            <button className="teaching-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="teaching-primary-button" type="submit">
              Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
