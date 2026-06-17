import { useState } from "react";
import { AdvisingStudentModal } from "../components/AdvisingStudentModal";
import { CommitteeModal } from "../components/CommitteeModal";
import { ServiceBucketGrid } from "../components/ServiceBucketGrid";
import { ServiceInboxCard } from "../components/ServiceInboxCard";
import { ServiceItemCard } from "../components/ServiceItemCard";
import { ServiceItemModal } from "../components/ServiceItemModal";
import { ServiceLoadSnapshot } from "../components/ServiceLoadSnapshot";
import { ServiceTriageCard } from "../components/ServiceTriageCard";
import { useService } from "../hooks/useService";
import type {
  NewServiceBoundaryLessonInput,
  ReviewLetter,
  ServiceAdminItem,
  ServiceBoundaryLesson,
  ServiceItem,
} from "../types";
import "./service.css";

function isActiveServiceItem(item: ServiceItem) {
  return item.status !== "done" && item.status !== "archived";
}

function isActiveReview(review: ReviewLetter) {
  return (
    review.status !== "submitted" &&
    review.status !== "declined" &&
    review.status !== "archived"
  );
}

function isActiveAdminItem(item: ServiceAdminItem) {
  return item.status !== "done" && item.status !== "archived";
}

function isDueWithinDays(dueDate: string | undefined, days: number) {
  if (!dueDate) {
    return false;
  }

  const date = new Date(`${dueDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowEnd = new Date(today);
  windowEnd.setDate(today.getDate() + days);

  return date >= today && date <= windowEnd;
}

function toSyntheticServiceItems(
  reviews: ReviewLetter[],
  adminItems: ServiceAdminItem[],
) {
  const reviewItems: ServiceItem[] = reviews.map((review) => ({
    id: review.id,
    title: review.title,
    bucket: "review-letter",
    status:
      review.status === "submitted"
        ? "done"
        : review.status === "archived"
          ? "archived"
          : review.status === "declined"
            ? "declined"
            : review.status === "waiting"
              ? "waiting-on-others"
              : "accepted",
    dueDate: review.dueDate,
    nextAction: review.nextAction ?? "",
    spoonCost: review.spoonCost,
    estimatedMinutes: review.estimatedMinutes,
    waitingOn: review.waitingOn,
    boundaryNote: review.boundaryNote,
    neverAgain: review.neverAgain,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }));
  const adminSyntheticItems: ServiceItem[] = adminItems.map((item) => ({
    id: item.id,
    title: item.title,
    bucket: "admin-other",
    status:
      item.status === "done"
        ? "done"
        : item.status === "archived"
          ? "archived"
          : item.status === "waiting"
            ? "waiting-on-others"
            : "accepted",
    dueDate: item.dueDate,
    nextAction: item.nextAction ?? "",
    spoonCost: item.spoonCost,
    estimatedMinutes: item.estimatedMinutes,
    waitingOn: item.waitingOn,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return { reviewItems, adminSyntheticItems };
}

type BoundaryLessonModalProps = {
  lesson?: ServiceBoundaryLesson;
  onClose: () => void;
  onSave: (input: NewServiceBoundaryLessonInput) => void;
};

function BoundaryLessonModal({
  lesson,
  onClose,
  onSave,
}: BoundaryLessonModalProps) {
  const [commitment, setCommitment] = useState(lesson?.commitment ?? "");
  const [whyCostly, setWhyCostly] = useState(lesson?.whyCostly ?? "");
  const [warningSign, setWarningSign] = useState(lesson?.warningSign ?? "");
  const [futureBoundary, setFutureBoundary] = useState(
    lesson?.futureBoundary ?? "",
  );
  const [status, setStatus] = useState<
    NewServiceBoundaryLessonInput["status"]
  >(lesson?.status ?? "active-lesson");
  const canSave = commitment.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    onSave({
      commitment,
      whyCostly,
      warningSign,
      futureBoundary,
      status,
    });
  }

  return (
    <div className="service-modal-backdrop" role="presentation">
      <section className="service-modal" role="dialog" aria-modal="true">
        <div className="service-modal__header">
          <div>
            <p className="eyebrow">Boundary Lesson</p>
            <h2>{lesson ? "Edit the protection note" : "Record future protection"}</h2>
          </div>
          <button className="service-chip-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="service-modal__form" onSubmit={handleSubmit}>
          <label>
            What was the commitment?
            <input
              value={commitment}
              onChange={(event) => setCommitment(event.target.value)}
              placeholder="The thing future-you should recognize sooner"
              autoFocus
            />
          </label>

          <label>
            Why was it costly?
            <textarea
              value={whyCostly}
              onChange={(event) => setWhyCostly(event.target.value)}
            />
          </label>

          <label>
            Warning sign
            <textarea
              value={warningSign}
              onChange={(event) => setWarningSign(event.target.value)}
            />
          </label>

          <label>
            Future boundary / never-again note
            <textarea
              value={futureBoundary}
              onChange={(event) => setFutureBoundary(event.target.value)}
            />
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as NewServiceBoundaryLessonInput["status"],
                )
              }
            >
              <option value="active-lesson">Active lesson</option>
              <option value="archived-lesson">Archived lesson</option>
            </select>
          </label>

          <div className="service-modal__actions">
            <button className="service-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="service-primary-button" type="submit" disabled={!canSave}>
              Save lesson
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function ServicePage() {
  const [isServiceItemModalOpen, setIsServiceItemModalOpen] = useState(false);
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isBoundaryModalOpen, setIsBoundaryModalOpen] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState<ServiceItem>();
  const [editingBoundaryLesson, setEditingBoundaryLesson] =
    useState<ServiceBoundaryLesson>();

  const {
    serviceItems,
    inboxItems,
    needsAttentionItems,
    doneServiceItems,
    archivedServiceItems,
    committees,
    advisingStudents,
    activeCommittees,
    activeAdvisingStudents,
    reviewLetters,
    activeReviewLetters,
    adminItems,
    activeAdminItems,
    activeBoundaryLessons,
    createServiceItem,
    updateServiceItem,
    markServiceItemDone,
    archiveServiceItem,
    restoreServiceItem,
    createCommittee,
    createAdvisingStudent,
    createBoundaryLesson,
    updateBoundaryLesson,
  } = useService();
  const { reviewItems, adminSyntheticItems } = toSyntheticServiceItems(
    reviewLetters,
    adminItems,
  );
  const activeAllItems = [
    ...serviceItems.filter(isActiveServiceItem),
    ...reviewItems.filter(isActiveServiceItem),
    ...adminSyntheticItems.filter(isActiveServiceItem),
  ];
  const waitingSignals = [
    ...serviceItems
      .filter(isActiveServiceItem)
      .filter((item) => item.status === "waiting-on-others" || item.waitingOn)
      .map((item) => ({
        id: item.id,
        label: item.title,
        detail: item.waitingOn ?? "Waiting on others",
      })),
    ...activeReviewLetters
      .filter((review) => review.status === "waiting" || review.waitingOn)
      .map((review) => ({
        id: review.id,
        label: review.title,
        detail: review.waitingOn ?? "Waiting on review/letter response",
      })),
    ...activeAdminItems
      .filter((item) => item.status === "waiting" || item.waitingOn)
      .map((item) => ({
        id: item.id,
        label: item.title,
        detail: item.waitingOn ?? "Waiting on admin response",
      })),
  ];
  const dueSoonCount = activeAllItems.filter((item) =>
    isDueWithinDays(item.dueDate, 7),
  ).length;
  const highSpoonCount = activeAllItems.filter(
    (item) => (item.spoonCost ?? 0) >= 4,
  ).length;
  const noNextActionCount =
    serviceItems.filter(isActiveServiceItem).filter((item) => !item.nextAction)
      .length +
    reviewLetters.filter(isActiveReview).filter((review) => !review.nextAction)
      .length +
    adminItems.filter(isActiveAdminItem).filter((item) => !item.nextAction).length;
  const serviceWarnings = [
    activeAllItems.length >= 10
      ? `${activeAllItems.length} active service commitments. This is a lot of invisible labor.`
      : undefined,
    highSpoonCount >= 3
      ? `${highSpoonCount} high-spoon service items. Protect recovery time.`
      : undefined,
    dueSoonCount >= 3
      ? `${dueSoonCount} service deadlines are due soon. Pick the next action, not the whole mountain.`
      : undefined,
    waitingSignals.length >= 4
      ? `${waitingSignals.length} items are waiting on others. Follow up or let them sit on purpose.`
      : undefined,
    noNextActionCount >= 3
      ? `${noNextActionCount} active items have no next action. That is how service becomes fog.`
      : undefined,
  ].filter(Boolean);

  function openAddServiceItemModal() {
    setEditingServiceItem(undefined);
    setIsServiceItemModalOpen(true);
  }

  function handleServiceItemSave(input: Parameters<typeof createServiceItem>[0]) {
    if (editingServiceItem) {
      updateServiceItem(editingServiceItem.id, input);
    } else {
      createServiceItem(input);
    }

    setEditingServiceItem(undefined);
    setIsServiceItemModalOpen(false);
  }

  function closeServiceItemModal() {
    setEditingServiceItem(undefined);
    setIsServiceItemModalOpen(false);
  }

  function closeBoundaryModal() {
    setEditingBoundaryLesson(undefined);
    setIsBoundaryModalOpen(false);
  }

  function handleBoundaryLessonSave(input: NewServiceBoundaryLessonInput) {
    if (editingBoundaryLesson) {
      updateBoundaryLesson(editingBoundaryLesson.id, input);
    } else {
      createBoundaryLesson(input);
    }

    closeBoundaryModal();
  }

  return (
    <section className="service-page page-stack">
      <div className="service-hero-panel">
        <div>
          <p className="eyebrow">Service</p>
          <h1>Contain the invisible labor before it eats the week.</h1>
          <p>
            Track committees, reviews, letters, advising, admin requests, and the
            obligations that quietly become emergencies.
          </p>
        </div>

        <div className="service-hero-panel__actions">
          <button
            className="service-primary-button"
            type="button"
            onClick={openAddServiceItemModal}
          >
            + Add Service Item
          </button>
          <button
            className="service-secondary-button"
            type="button"
            onClick={() => setIsCommitteeModalOpen(true)}
          >
            + Add Committee
          </button>
          <button
            className="service-secondary-button"
            type="button"
            onClick={() => setIsStudentModalOpen(true)}
          >
            + Add Student
          </button>
          <button
            className="service-secondary-button"
            type="button"
            onClick={() => setIsBoundaryModalOpen(true)}
          >
            + Boundary Lesson
          </button>
        </div>
      </div>

      <ServiceLoadSnapshot serviceItems={[...serviceItems, ...reviewItems, ...adminSyntheticItems]} />

      <section className="service-panel">
        <div className="service-section-header">
          <div>
            <p className="eyebrow">Load warnings</p>
            <h2>Service reality check</h2>
            <p>Direct signals, no shame spiral.</p>
          </div>
        </div>

        <div className="service-warning-list">
          {serviceWarnings.length > 0 ? (
            serviceWarnings.map((warning) => (
              <div key={warning} className="service-warning-card">
                {warning}
              </div>
            ))
          ) : (
            <div className="service-empty-state">
              No obvious service overload signals right now. Keep the boundary
              fence up anyway.
            </div>
          )}
        </div>
      </section>

      <section className="service-panel">
        <div className="service-section-header">
          <div>
            <p className="eyebrow">Waiting</p>
            <h2>Waiting on others</h2>
            <p>Things that are not yours to carry every minute.</p>
          </div>
          <span className="service-count-pill">{waitingSignals.length}</span>
        </div>

        <div className="service-mini-list">
          {waitingSignals.slice(0, 6).map((signal) => (
            <article key={signal.id}>
              <strong>{signal.label}</strong>
              <p>{signal.detail}</p>
            </article>
          ))}
          {waitingSignals.length === 0 ? (
            <div className="service-empty-state">
              Nothing is waiting on someone else. Tiny miracle, documented.
            </div>
          ) : null}
        </div>
      </section>

      <section className="service-panel">
        <div className="service-section-header">
          <div>
            <p className="eyebrow">Future protection</p>
            <h2>Never-again lessons</h2>
            <p>Not guilt. Pattern recognition for future boundaries.</p>
          </div>
          <button
            className="service-secondary-button"
            type="button"
            onClick={() => setIsBoundaryModalOpen(true)}
          >
            Add lesson
          </button>
        </div>

        <div className="service-card-grid">
          {activeBoundaryLessons.slice(0, 4).map((lesson) => (
            <article key={lesson.id} className="service-item-card">
              <div className="service-item-card__header">
                <div>
                  <p>Boundary lesson</p>
                  <h3>{lesson.commitment}</h3>
                </div>
                <span>Active</span>
              </div>
              {lesson.warningSign ? (
                <p className="service-item-card__note">
                  <strong>Warning sign:</strong> {lesson.warningSign}
                </p>
              ) : null}
              {lesson.futureBoundary ? (
                <p className="service-item-card__note">
                  <strong>Boundary:</strong> {lesson.futureBoundary}
                </p>
              ) : null}
              {lesson.whyCostly ? (
                <p className="service-item-card__note">
                  <strong>Cost:</strong> {lesson.whyCostly}
                </p>
              ) : null}
              <div className="service-item-card__actions">
                <button
                  className="service-chip-button"
                  type="button"
                  onClick={() => {
                    setEditingBoundaryLesson(lesson);
                    setIsBoundaryModalOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="service-chip-button"
                  type="button"
                  onClick={() =>
                    updateBoundaryLesson(lesson.id, {
                      status: "archived-lesson",
                    })
                  }
                >
                  Archive
                </button>
              </div>
            </article>
          ))}
          {activeBoundaryLessons.length === 0 ? (
            <div className="service-empty-state service-empty-state--wide">
              No boundary lessons yet. When a service ask teaches you something
              expensive, park the lesson here.
            </div>
          ) : null}
        </div>
      </section>

      {serviceItems.length === 0 ? (
        <div className="service-empty-state service-empty-state--wide">
          No service items captured yet. A suspiciously serene page, but it is
          ready when the invisible labor starts knocking.
        </div>
      ) : null}

      <div className="service-layout">
        <main className="service-main-grid">
          <ServiceTriageCard
            items={needsAttentionItems}
            onEdit={(item) => {
              setEditingServiceItem(item);
              setIsServiceItemModalOpen(true);
            }}
            onDone={markServiceItemDone}
            onArchive={archiveServiceItem}
            onRestore={restoreServiceItem}
          />

          <ServiceInboxCard
            items={inboxItems}
            onEdit={(item) => {
              setEditingServiceItem(item);
              setIsServiceItemModalOpen(true);
            }}
            onDone={markServiceItemDone}
            onArchive={archiveServiceItem}
            onRestore={restoreServiceItem}
          />

          {(doneServiceItems.length > 0 || archivedServiceItems.length > 0) ? (
            <section className="service-panel">
              <div className="service-section-header">
                <div>
                  <p className="eyebrow">Closed</p>
                  <h2>Done and archived</h2>
                  <p>Things you can restore if they come back around.</p>
                </div>
              </div>

              <div className="service-card-grid service-card-grid--single">
                {[...doneServiceItems, ...archivedServiceItems].map((item) => (
                  <ServiceItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => {
                      setEditingServiceItem(item);
                      setIsServiceItemModalOpen(true);
                    }}
                    onRestore={() => restoreServiceItem(item.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <ServiceBucketGrid
          serviceItems={serviceItems}
          activeCommittees={activeCommittees}
          activeAdvisingStudentCount={activeAdvisingStudents.length}
          reviewLetterItems={reviewItems}
          adminOtherItems={adminSyntheticItems}
        />
      </div>

      {isServiceItemModalOpen ? (
        <ServiceItemModal
          item={editingServiceItem}
          committees={committees}
          advisingStudents={advisingStudents}
          onClose={closeServiceItemModal}
          onSave={handleServiceItemSave}
        />
      ) : null}

      {isCommitteeModalOpen ? (
        <CommitteeModal
          onClose={() => setIsCommitteeModalOpen(false)}
          onSave={(input) => {
            createCommittee(input);
            setIsCommitteeModalOpen(false);
          }}
        />
      ) : null}

      {isStudentModalOpen ? (
        <AdvisingStudentModal
          onClose={() => setIsStudentModalOpen(false)}
          onSave={(input) => {
            createAdvisingStudent(input);
            setIsStudentModalOpen(false);
          }}
        />
      ) : null}

      {isBoundaryModalOpen ? (
        <BoundaryLessonModal
          lesson={editingBoundaryLesson}
          onClose={closeBoundaryModal}
          onSave={handleBoundaryLessonSave}
        />
      ) : null}
    </section>
  );
}
