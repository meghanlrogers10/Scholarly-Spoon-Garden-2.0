import { useState } from "react";
import type {
  AdvisingStudent,
  Committee,
  NewServiceItemInput,
  ServiceBucket,
  ServiceItem,
  ServiceStatus,
  SpoonCost,
} from "../types";

const bucketOptions: { value: ServiceBucket; label: string }[] = [
  { value: "committee", label: "Committee" },
  { value: "review-letter", label: "Reviews & Letters" },
  { value: "advising", label: "Advising" },
  { value: "admin-other", label: "Admin / Other" },
];

const statusOptions: { value: ServiceStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "requested", label: "Requested" },
  { value: "accepted", label: "Accepted" },
  { value: "in-progress", label: "In progress" },
  { value: "waiting-on-me", label: "Waiting on me" },
  { value: "waiting-on-others", label: "Waiting on others" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
  { value: "archived", label: "Archived" },
];

type ServiceItemModalProps = {
  item?: ServiceItem;
  initialValues?: Partial<NewServiceItemInput>;
  committees?: Committee[];
  advisingStudents?: AdvisingStudent[];
  onClose: () => void;
  onSave: (input: NewServiceItemInput) => void;
};

function parseSpoonCost(value: string) {
  if (!value) {
    return undefined;
  }

  return Number(value) as SpoonCost;
}

function parseMinutes(value: string) {
  if (!value) {
    return undefined;
  }

  const minutes = Number(value);

  return Number.isFinite(minutes) && minutes > 0 ? minutes : undefined;
}

export function ServiceItemModal({
  item,
  initialValues,
  committees = [],
  advisingStudents = [],
  onClose,
  onSave,
}: ServiceItemModalProps) {
  const defaults = { ...initialValues, ...item };
  const [title, setTitle] = useState(defaults.title ?? "");
  const [bucket, setBucket] = useState<ServiceBucket>(defaults.bucket ?? "admin-other");
  const [status, setStatus] = useState<ServiceStatus>(defaults.status ?? "inbox");
  const [dueDate, setDueDate] = useState(defaults.dueDate ?? "");
  const [nextAction, setNextAction] = useState(defaults.nextAction ?? "");
  const [spoonCost, setSpoonCost] = useState(String(defaults.spoonCost ?? 2));
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    defaults.estimatedMinutes ? String(defaults.estimatedMinutes) : ""
  );
  const [waitingOn, setWaitingOn] = useState(defaults.waitingOn ?? "");
  const [link, setLink] = useState(defaults.link ?? "");
  const [boundaryNote, setBoundaryNote] = useState(defaults.boundaryNote ?? "");
  const [relatedCommitteeId, setRelatedCommitteeId] = useState(
    defaults.relatedCommitteeId ?? ""
  );
  const [relatedStudentId, setRelatedStudentId] = useState(defaults.relatedStudentId ?? "");
  const [highStakes, setHighStakes] = useState(Boolean(defaults.highStakes));
  const [confidential, setConfidential] = useState(Boolean(defaults.confidential));
  const [neverAgain, setNeverAgain] = useState(Boolean(defaults.neverAgain));

  const canSave = title.trim().length > 0 && nextAction.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    onSave({
      title,
      bucket,
      status,
      dueDate,
      nextAction,
      spoonCost: parseSpoonCost(spoonCost),
      estimatedMinutes: parseMinutes(estimatedMinutes),
      waitingOn,
      link,
      boundaryNote,
      relatedCommitteeId: bucket === "committee" ? relatedCommitteeId : undefined,
      relatedStudentId: bucket === "advising" ? relatedStudentId : undefined,
      highStakes,
      confidential,
      neverAgain,
    });

    onClose();
  }

  return (
    <div className="service-modal-backdrop" role="presentation">
      <section className="service-modal" role="dialog" aria-modal="true">
        <div className="service-modal__header">
          <div>
            <p className="eyebrow">Service Item</p>
            <h2>{item ? "Edit the service record." : "Capture the invisible labor."}</h2>
          </div>
          <button className="service-chip-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="service-modal__form" onSubmit={handleSubmit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <div className="service-modal__row">
            <label>
              Bucket
              <select
                value={bucket}
                onChange={(event) => setBucket(event.target.value as ServiceBucket)}
              >
                {bucketOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ServiceStatus)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="service-modal__row">
            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>

            <label>
              Spoon cost
              <select
                value={spoonCost}
                onChange={(event) => setSpoonCost(event.target.value)}
              >
                <option value="">Not set</option>
                <option value="1">1 spoon</option>
                <option value="2">2 spoons</option>
                <option value="3">3 spoons</option>
                <option value="4">4 spoons</option>
                <option value="5">5 spoons</option>
              </select>
            </label>

            <label>
              Minutes
              <input
                min="1"
                type="number"
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
              />
            </label>
          </div>

          <label>
            Next action
            <textarea
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
            />
          </label>

          <label>
            Waiting on
            <input value={waitingOn} onChange={(event) => setWaitingOn(event.target.value)} />
          </label>

          <label>
            Link
            <input value={link} onChange={(event) => setLink(event.target.value)} />
          </label>

          {bucket === "committee" ? (
            <label>
              Related committee
              <select
                value={relatedCommitteeId}
                onChange={(event) => setRelatedCommitteeId(event.target.value)}
              >
                <option value="">None</option>
                {committees.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {committee.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {bucket === "advising" ? (
            <label>
              Related student
              <select
                value={relatedStudentId}
                onChange={(event) => setRelatedStudentId(event.target.value)}
              >
                <option value="">None</option>
                {advisingStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label>
            Boundary note
            <textarea
              value={boundaryNote}
              onChange={(event) => setBoundaryNote(event.target.value)}
            />
          </label>

          <div className="service-modal__checks">
            <label>
              <input
                type="checkbox"
                checked={highStakes}
                onChange={(event) => setHighStakes(event.target.checked)}
              />
              High stakes
            </label>
            <label>
              <input
                type="checkbox"
                checked={confidential}
                onChange={(event) => setConfidential(event.target.checked)}
              />
              Confidential
            </label>
            <label>
              <input
                type="checkbox"
                checked={neverAgain}
                onChange={(event) => setNeverAgain(event.target.checked)}
              />
              Maybe never again
            </label>
          </div>

          <div className="service-modal__actions">
            <button className="service-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="service-primary-button" type="submit" disabled={!canSave}>
              {item ? "Save Changes" : "Save Service Item"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
