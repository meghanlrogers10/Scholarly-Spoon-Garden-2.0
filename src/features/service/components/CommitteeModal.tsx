import { useState } from "react";
import type {
  Committee,
  CommitteeLoadRating,
  CommitteeStatus,
  NewCommitteeInput,
} from "../types";

export type CommitteeModalSaveInput = NewCommitteeInput & {
  status?: CommitteeStatus;
};

type CommitteeModalProps = {
  committee?: Committee;
  onClose: () => void;
  onSave: (input: CommitteeModalSaveInput) => void;
};

export function CommitteeModal({ committee, onClose, onSave }: CommitteeModalProps) {
  const [name, setName] = useState(committee?.name ?? "");
  const [role, setRole] = useState(committee?.role ?? "");
  const [term, setTerm] = useState(committee?.term ?? "");
  const [status, setStatus] = useState<CommitteeStatus>(committee?.status ?? "active");
  const [nextMeeting, setNextMeeting] = useState(committee?.nextMeeting ?? "");
  const [nextAction, setNextAction] = useState(committee?.nextAction ?? "");
  const [loadRating, setLoadRating] = useState<CommitteeLoadRating>(
    committee?.loadRating ?? "moderate"
  );
  const [notes, setNotes] = useState(committee?.notes ?? "");
  const [boundaryNote, setBoundaryNote] = useState(committee?.boundaryNote ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    onSave({
      name,
      role,
      term,
      status,
      nextMeeting,
      nextAction,
      loadRating,
      notes,
      boundaryNote,
    });
    onClose();
  }

  return (
    <div className="service-modal-backdrop" role="presentation">
      <section className="service-modal" role="dialog" aria-modal="true">
        <div className="service-modal__header">
          <div>
            <p className="eyebrow">Committee</p>
            <h2>{committee ? "Edit committee shell." : "Add a committee shell."}</h2>
          </div>
          <button className="service-chip-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="service-modal__form" onSubmit={handleSubmit}>
          <label>
            Committee name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <div className="service-modal__row">
            <label>
              Role
              <input value={role} onChange={(event) => setRole(event.target.value)} />
            </label>
            <label>
              Term
              <input value={term} onChange={(event) => setTerm(event.target.value)} />
            </label>
          </div>

          <div className="service-modal__row">
            <label>
              Next meeting
              <input
                type="date"
                value={nextMeeting}
                onChange={(event) => setNextMeeting(event.target.value)}
              />
            </label>
            <label>
              Load rating
              <select
                value={loadRating}
                onChange={(event) => setLoadRating(event.target.value as CommitteeLoadRating)}
              >
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </label>
          </div>

          <label>
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as CommitteeStatus)}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label>
            Next action
            <textarea
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
            />
          </label>

          <label>
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>

          <label>
            Boundary note
            <textarea
              value={boundaryNote}
              onChange={(event) => setBoundaryNote(event.target.value)}
            />
          </label>

          <div className="service-modal__actions">
            <button className="service-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="service-primary-button" type="submit" disabled={!name.trim()}>
              {committee ? "Save Changes" : "Save Committee"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
