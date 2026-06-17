import { useState } from "react";
import { Link } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { useService } from "../hooks/useService";
import type {
  NewReviewLetterInput,
  NewServiceAdminItemInput,
  ReviewLetter,
  ReviewLetterStatus,
  ReviewLetterType,
  ServiceAdminItem,
  ServiceAdminStatus,
  ServiceAdminType,
  SpoonCost,
} from "../types";
import {
  formatServiceDate,
  getServiceDateState,
  reviewLetterStatusLabels,
  reviewLetterTypeLabels,
  serviceAdminStatusLabels,
  serviceAdminTypeLabels,
} from "../utils/serviceFormat";
import "./service.css";

const spoonOptions: SpoonCost[] = [1, 2, 3, 4, 5];
const reviewTypes = Object.keys(reviewLetterTypeLabels) as ReviewLetterType[];
const reviewStatuses = Object.keys(
  reviewLetterStatusLabels,
) as ReviewLetterStatus[];
const adminTypes = Object.keys(serviceAdminTypeLabels) as ServiceAdminType[];
const adminStatuses = Object.keys(
  serviceAdminStatusLabels,
) as ServiceAdminStatus[];

function asSpoonCost(value: string): SpoonCost | undefined {
  const parsed = Number(value);

  return spoonOptions.includes(parsed as SpoonCost)
    ? (parsed as SpoonCost)
    : undefined;
}

function asEstimatedMinutes(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
}

function getTrackerDateLabel(dueDate?: string) {
  return `Due: ${formatServiceDate(dueDate, "No due date")}`;
}

type ReviewFormProps = {
  review?: ReviewLetter;
  onClose: () => void;
  onSave: (input: NewReviewLetterInput) => void;
};

function ReviewLetterModal({ review, onClose, onSave }: ReviewFormProps) {
  const [title, setTitle] = useState(review?.title ?? "");
  const [type, setType] = useState<ReviewLetterType>(
    review?.type ?? "peer-review",
  );
  const [status, setStatus] = useState<ReviewLetterStatus>(
    review?.status ?? "not-started",
  );
  const [dueDate, setDueDate] = useState(review?.dueDate ?? "");
  const [requestedBy, setRequestedBy] = useState(review?.requestedBy ?? "");
  const [organization, setOrganization] = useState(review?.organization ?? "");
  const [nextAction, setNextAction] = useState(review?.nextAction ?? "");
  const [waitingOn, setWaitingOn] = useState(review?.waitingOn ?? "");
  const [spoonCost, setSpoonCost] = useState(String(review?.spoonCost ?? 2));
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    String(review?.estimatedMinutes ?? ""),
  );
  const [notes, setNotes] = useState(review?.notes ?? "");
  const [boundaryNote, setBoundaryNote] = useState(review?.boundaryNote ?? "");
  const [neverAgain, setNeverAgain] = useState(Boolean(review?.neverAgain));
  const canSave = title.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    onSave({
      title,
      type,
      status,
      dueDate,
      requestedBy,
      organization,
      nextAction,
      waitingOn,
      spoonCost: asSpoonCost(spoonCost),
      estimatedMinutes: asEstimatedMinutes(estimatedMinutes),
      notes,
      boundaryNote,
      neverAgain,
    });
  }

  return (
    <div className="service-modal-backdrop" role="presentation">
      <section className="service-modal" role="dialog" aria-modal="true">
        <div className="service-modal__header">
          <div>
            <p className="eyebrow">Reviews & Letters</p>
            <h2>{review ? "Edit request" : "Capture a request"}</h2>
          </div>
          <button className="service-chip-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="service-modal__form" onSubmit={handleSubmit}>
          <label>
            Title / person / item
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="External review for Dr. X"
              autoFocus
            />
          </label>

          <div className="service-modal__row">
            <label>
              Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ReviewLetterType)}
              >
                {reviewTypes.map((option) => (
                  <option key={option} value={option}>
                    {reviewLetterTypeLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ReviewLetterStatus)
                }
              >
                {reviewStatuses.map((option) => (
                  <option key={option} value={option}>
                    {reviewLetterStatusLabels[option]}
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
              Requested by
              <input
                value={requestedBy}
                onChange={(event) => setRequestedBy(event.target.value)}
              />
            </label>
            <label>
              Organization / journal
              <input
                value={organization}
                onChange={(event) => setOrganization(event.target.value)}
              />
            </label>
          </div>

          <div className="service-modal__row">
            <label>
              Next action
              <input
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                placeholder="Draft opening paragraph"
              />
            </label>
            <label>
              Waiting on
              <input
                value={waitingOn}
                onChange={(event) => setWaitingOn(event.target.value)}
              />
            </label>
          </div>

          <div className="service-modal__row">
            <label>
              Spoon cost
              <select
                value={spoonCost}
                onChange={(event) => setSpoonCost(event.target.value)}
              >
                {spoonOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estimated minutes
              <input
                type="number"
                min="0"
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
              />
            </label>
          </div>

          <label>
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>

          <label>
            Boundary / never-again note
            <textarea
              value={boundaryNote}
              onChange={(event) => setBoundaryNote(event.target.value)}
              placeholder="Future protection, not self-scolding."
            />
          </label>

          <div className="service-modal__checks">
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
              Save request
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type AdminFormProps = {
  item?: ServiceAdminItem;
  onClose: () => void;
  onSave: (input: NewServiceAdminItemInput) => void;
};

function AdminItemModal({ item, onClose, onSave }: AdminFormProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [type, setType] = useState<ServiceAdminType>(item?.type ?? "admin-task");
  const [status, setStatus] = useState<ServiceAdminStatus>(
    item?.status ?? "not-started",
  );
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [nextAction, setNextAction] = useState(item?.nextAction ?? "");
  const [waitingOn, setWaitingOn] = useState(item?.waitingOn ?? "");
  const [spoonCost, setSpoonCost] = useState(String(item?.spoonCost ?? 2));
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    String(item?.estimatedMinutes ?? ""),
  );
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [recurring, setRecurring] = useState(Boolean(item?.recurring));
  const canSave = title.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    onSave({
      title,
      type,
      status,
      dueDate,
      nextAction,
      waitingOn,
      spoonCost: asSpoonCost(spoonCost),
      estimatedMinutes: asEstimatedMinutes(estimatedMinutes),
      notes,
      recurring,
    });
  }

  return (
    <div className="service-modal-backdrop" role="presentation">
      <section className="service-modal" role="dialog" aria-modal="true">
        <div className="service-modal__header">
          <div>
            <p className="eyebrow">Admin / Other</p>
            <h2>{item ? "Edit admin item" : "Capture the miscellaneous ask"}</h2>
          </div>
          <button className="service-chip-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="service-modal__form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Policy comments, form, report, follow-up..."
              autoFocus
            />
          </label>

          <div className="service-modal__row">
            <label>
              Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ServiceAdminType)}
              >
                {adminTypes.map((option) => (
                  <option key={option} value={option}>
                    {serviceAdminTypeLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ServiceAdminStatus)
                }
              >
                {adminStatuses.map((option) => (
                  <option key={option} value={option}>
                    {serviceAdminStatusLabels[option]}
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
              Next action
              <input
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
              />
            </label>
            <label>
              Waiting on
              <input
                value={waitingOn}
                onChange={(event) => setWaitingOn(event.target.value)}
              />
            </label>
          </div>

          <div className="service-modal__row">
            <label>
              Spoon cost
              <select
                value={spoonCost}
                onChange={(event) => setSpoonCost(event.target.value)}
              >
                {spoonOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estimated minutes
              <input
                type="number"
                min="0"
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
              />
            </label>
          </div>

          <label>
            Notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>

          <div className="service-modal__checks">
            <label>
              <input
                type="checkbox"
                checked={recurring}
                onChange={(event) => setRecurring(event.target.checked)}
              />
              Recurring / likely to return
            </label>
          </div>

          <div className="service-modal__actions">
            <button className="service-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="service-primary-button" type="submit" disabled={!canSave}>
              Save admin item
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type TrackerCardProps = {
  eyebrow: string;
  title: string;
  status: string;
  dueDate?: string;
  nextAction?: string;
  waitingOn?: string;
  spoonCost?: SpoonCost;
  estimatedMinutes?: number;
  notes?: string;
  boundaryNote?: string;
  tags: string[];
  isClosed: boolean;
  isOnToday: boolean;
  onAddToToday: () => void;
  onEdit: () => void;
  onArchive: () => void;
};

function TrackerCard({
  eyebrow,
  title,
  status,
  dueDate,
  nextAction,
  waitingOn,
  spoonCost,
  estimatedMinutes,
  notes,
  boundaryNote,
  tags,
  isClosed,
  isOnToday,
  onAddToToday,
  onEdit,
  onArchive,
}: TrackerCardProps) {
  const dueState = !isClosed ? getServiceDateState(dueDate) : "none";

  return (
    <article className="service-item-card">
      <div className="service-item-card__header">
        <div>
          <p>{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <span>{status}</span>
      </div>

      <div className="service-item-card__meta">
        <span className={`service-date-pill service-date-pill--${dueState}`}>
          {getTrackerDateLabel(dueDate)}
        </span>
        {spoonCost ? <span>{spoonCost} spoons</span> : null}
        {estimatedMinutes ? <span>{estimatedMinutes} min</span> : null}
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <p className="service-item-card__next-action">
        <strong>Next:</strong> {nextAction || "No next action yet."}
      </p>

      {waitingOn ? (
        <p className="service-item-card__note">
          <strong>Waiting on:</strong> {waitingOn}
        </p>
      ) : null}

      {boundaryNote ? (
        <p className="service-item-card__note">
          <strong>Boundary:</strong> {boundaryNote}
        </p>
      ) : null}

      {notes ? <p className="service-item-card__note">{notes}</p> : null}

      <div className="service-item-card__actions">
        <button className="service-chip-button" type="button" onClick={onEdit}>
          Edit
        </button>
        {!isClosed ? (
          <button
            className="service-chip-button"
            type="button"
            onClick={onAddToToday}
            disabled={isOnToday || !nextAction}
          >
            {isOnToday ? "Added to Today" : "Add to Today"}
          </button>
        ) : null}
        {!isClosed ? (
          <button className="service-chip-button" type="button" onClick={onArchive}>
            Archive
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function ReviewsLettersPage() {
  const [editingReview, setEditingReview] = useState<ReviewLetter>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    reviewLetters,
    activeReviewLetters,
    createReviewLetter,
    updateReviewLetter,
    archiveReviewLetter,
  } = useService();
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();
  const closedReviews = reviewLetters.filter(
    (review) => !activeReviewLetters.some((active) => active.id === review.id),
  );

  function closeModal() {
    setEditingReview(undefined);
    setIsModalOpen(false);
  }

  function handleSave(input: NewReviewLetterInput) {
    if (editingReview) {
      updateReviewLetter(editingReview.id, input);
    } else {
      createReviewLetter(input);
    }

    closeModal();
  }

  function addReviewToToday(review: ReviewLetter) {
    addLinkedTaskToToday({
      source: "review-letter",
      sourceId: review.id,
      title: review.nextAction || review.title,
      area: "Service",
      spoonCost: review.spoonCost ?? 3,
      priority: review.neverAgain ? "High" : "Medium",
      dueDate: review.dueDate,
      notes: [
        `Review/letter: ${review.title}`,
        review.requestedBy ? `Requested by: ${review.requestedBy}` : undefined,
        review.organization ? `Organization: ${review.organization}` : undefined,
        review.waitingOn ? `Waiting on: ${review.waitingOn}` : undefined,
        review.boundaryNote ? `Boundary: ${review.boundaryNote}` : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
      nextAction: review.nextAction,
      taskType: "service",
      estimatedMinutes: review.estimatedMinutes,
      lowEnergyFriendly: (review.spoonCost ?? 3) <= 2,
    });
  }

  return (
    <section className="service-page page-stack">
      <div className="service-hero-panel">
        <div>
          <p className="eyebrow">Reviews & Letters</p>
          <h1>Track the favors that are actually labor.</h1>
          <p>
            Peer reviews, recommendation letters, tenure letters, external
            asks, and anything else that quietly becomes weekend work.
          </p>
        </div>
        <div className="service-hero-panel__actions">
          <button
            className="service-primary-button"
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Request
          </button>
          <Link className="service-secondary-button" to="/service">
            Back to Service
          </Link>
        </div>
      </div>

      <section className="service-panel">
        <div className="service-section-header">
          <div>
            <p className="eyebrow">Active</p>
            <h2>Open requests</h2>
            <p>What you agreed to, what is due, and what can wait.</p>
          </div>
        </div>

        <div className="service-card-grid">
          {activeReviewLetters.map((review) => (
            <TrackerCard
              key={review.id}
              eyebrow={reviewLetterTypeLabels[review.type]}
              title={review.title}
              status={reviewLetterStatusLabels[review.status]}
              dueDate={review.dueDate}
              nextAction={review.nextAction}
              waitingOn={review.waitingOn}
              spoonCost={review.spoonCost}
              estimatedMinutes={review.estimatedMinutes}
              notes={review.notes}
              boundaryNote={review.boundaryNote}
              tags={[
                review.requestedBy ? `By ${review.requestedBy}` : "",
                review.organization ?? "",
                review.neverAgain ? "Never again?" : "",
              ].filter(Boolean)}
              isClosed={false}
              isOnToday={isSourceOnToday("review-letter", review.id)}
              onAddToToday={() => addReviewToToday(review)}
              onEdit={() => {
                setEditingReview(review);
                setIsModalOpen(true);
              }}
              onArchive={() => archiveReviewLetter(review.id)}
            />
          ))}

          {activeReviewLetters.length === 0 ? (
            <div className="service-empty-state service-empty-state--wide">
              No active review or letter requests. May this silence hold.
            </div>
          ) : null}
        </div>
      </section>

      {closedReviews.length > 0 ? (
        <section className="service-panel">
          <div className="service-section-header">
            <div>
              <p className="eyebrow">Closed</p>
              <h2>Submitted, declined, archived</h2>
            </div>
          </div>
          <div className="service-card-grid">
            {closedReviews.map((review) => (
              <TrackerCard
                key={review.id}
                eyebrow={reviewLetterTypeLabels[review.type]}
                title={review.title}
                status={reviewLetterStatusLabels[review.status]}
                dueDate={review.dueDate}
                nextAction={review.nextAction}
                waitingOn={review.waitingOn}
                spoonCost={review.spoonCost}
                estimatedMinutes={review.estimatedMinutes}
                notes={review.notes}
                boundaryNote={review.boundaryNote}
                tags={review.neverAgain ? ["Never again?"] : []}
                isClosed
                isOnToday
                onAddToToday={() => addReviewToToday(review)}
                onEdit={() => {
                  setEditingReview(review);
                  setIsModalOpen(true);
                }}
                onArchive={() => archiveReviewLetter(review.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {isModalOpen ? (
        <ReviewLetterModal
          review={editingReview}
          onClose={closeModal}
          onSave={handleSave}
        />
      ) : null}
    </section>
  );
}

export function ServiceAdminPage() {
  const [editingItem, setEditingItem] = useState<ServiceAdminItem>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    adminItems,
    activeAdminItems,
    createAdminItem,
    updateAdminItem,
    archiveAdminItem,
  } = useService();
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();
  const closedItems = adminItems.filter(
    (item) => !activeAdminItems.some((active) => active.id === item.id),
  );

  function closeModal() {
    setEditingItem(undefined);
    setIsModalOpen(false);
  }

  function handleSave(input: NewServiceAdminItemInput) {
    if (editingItem) {
      updateAdminItem(editingItem.id, input);
    } else {
      createAdminItem(input);
    }

    closeModal();
  }

  function addAdminToToday(item: ServiceAdminItem) {
    addLinkedTaskToToday({
      source: "admin-other",
      sourceId: item.id,
      title: item.nextAction || item.title,
      area: "Service",
      spoonCost: item.spoonCost ?? 2,
      priority: item.recurring ? "Medium" : "Low",
      dueDate: item.dueDate,
      notes: [
        `Admin/other: ${item.title}`,
        item.waitingOn ? `Waiting on: ${item.waitingOn}` : undefined,
        item.recurring ? "Recurring / likely to return" : undefined,
        item.notes,
      ]
        .filter(Boolean)
        .join("\n"),
      nextAction: item.nextAction,
      taskType: "email-admin",
      estimatedMinutes: item.estimatedMinutes,
      lowEnergyFriendly: (item.spoonCost ?? 2) <= 2,
    });
  }

  return (
    <section className="service-page page-stack">
      <div className="service-hero-panel">
        <div>
          <p className="eyebrow">Admin / Other</p>
          <h1>Contain the miscellaneous service asks.</h1>
          <p>
            Forms, policy comments, reports, meeting follow-ups, event labor,
            and the stray tasks that should not get infinite access to your day.
          </p>
        </div>
        <div className="service-hero-panel__actions">
          <button
            className="service-primary-button"
            type="button"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Admin Item
          </button>
          <Link className="service-secondary-button" to="/service">
            Back to Service
          </Link>
        </div>
      </div>

      <section className="service-panel">
        <div className="service-section-header">
          <div>
            <p className="eyebrow">Active</p>
            <h2>Admin and other</h2>
            <p>Small asks count. Put them somewhere finite.</p>
          </div>
        </div>

        <div className="service-card-grid">
          {activeAdminItems.map((item) => (
            <TrackerCard
              key={item.id}
              eyebrow={serviceAdminTypeLabels[item.type]}
              title={item.title}
              status={serviceAdminStatusLabels[item.status]}
              dueDate={item.dueDate}
              nextAction={item.nextAction}
              waitingOn={item.waitingOn}
              spoonCost={item.spoonCost}
              estimatedMinutes={item.estimatedMinutes}
              notes={item.notes}
              tags={item.recurring ? ["Recurring"] : []}
              isClosed={false}
              isOnToday={isSourceOnToday("admin-other", item.id)}
              onAddToToday={() => addAdminToToday(item)}
              onEdit={() => {
                setEditingItem(item);
                setIsModalOpen(true);
              }}
              onArchive={() => archiveAdminItem(item.id)}
            />
          ))}

          {activeAdminItems.length === 0 ? (
            <div className="service-empty-state service-empty-state--wide">
              No admin miscellany captured. Suspicious, but lovely.
            </div>
          ) : null}
        </div>
      </section>

      {closedItems.length > 0 ? (
        <section className="service-panel">
          <div className="service-section-header">
            <div>
              <p className="eyebrow">Closed</p>
              <h2>Done and archived</h2>
            </div>
          </div>
          <div className="service-card-grid">
            {closedItems.map((item) => (
              <TrackerCard
                key={item.id}
                eyebrow={serviceAdminTypeLabels[item.type]}
                title={item.title}
                status={serviceAdminStatusLabels[item.status]}
                dueDate={item.dueDate}
                nextAction={item.nextAction}
                waitingOn={item.waitingOn}
                spoonCost={item.spoonCost}
                estimatedMinutes={item.estimatedMinutes}
                notes={item.notes}
                tags={item.recurring ? ["Recurring"] : []}
                isClosed
                isOnToday
                onAddToToday={() => addAdminToToday(item)}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onArchive={() => archiveAdminItem(item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {isModalOpen ? (
        <AdminItemModal item={editingItem} onClose={closeModal} onSave={handleSave} />
      ) : null}
    </section>
  );
}
