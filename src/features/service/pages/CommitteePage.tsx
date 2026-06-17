import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import { CommitteeModal } from "../components/CommitteeModal";
import { ServiceItemCard } from "../components/ServiceItemCard";
import { ServiceItemModal } from "../components/ServiceItemModal";
import { useService } from "../hooks/useService";
import type { ServiceItem } from "../types";
import { formatServiceDate } from "../utils/serviceFormat";
import "./service.css";

export function CommitteePage() {
  const { committeeId } = useParams();
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [isServiceItemModalOpen, setIsServiceItemModalOpen] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState<ServiceItem>();
  const {
    committees,
    advisingStudents,
    serviceItems,
    getCommitteeById,
    updateCommittee,
    archiveCommittee,
    restoreCommittee,
    createServiceItem,
    updateServiceItem,
    markServiceItemDone,
    archiveServiceItem,
    restoreServiceItem,
  } = useService();
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();
  const committee = getCommitteeById(committeeId);

  if (!committee) {
    return (
      <section className="service-page page-stack">
        <div className="service-hero-panel">
          <div>
            <p className="eyebrow">Committee</p>
            <h1>Committee not found.</h1>
            <p>This may be archived, deleted, or not yet created.</p>
          </div>
          <Link className="service-secondary-button" to="/service">
            Back to Service
          </Link>
        </div>
      </section>
    );
  }

  const currentCommittee = committee;
  const relatedItems = serviceItems.filter(
    (item) => item.relatedCommitteeId === currentCommittee.id
  );

  function closeServiceItemModal() {
    setEditingServiceItem(undefined);
    setIsServiceItemModalOpen(false);
  }

  function handleServiceItemSave(input: Parameters<typeof createServiceItem>[0]) {
    if (editingServiceItem) {
      updateServiceItem(editingServiceItem.id, input);
    } else {
      createServiceItem(input);
    }

    closeServiceItemModal();
  }

  function handleAddCommitteeToToday() {
    if (!currentCommittee.nextAction) {
      return;
    }

    addLinkedTaskToToday({
      source: "committee-item",
      sourceId: currentCommittee.id,
      title: currentCommittee.nextAction,
      area: "Service",
      spoonCost: currentCommittee.loadRating === "heavy" ? 3 : 2,
      priority: currentCommittee.loadRating === "heavy" ? "High" : "Medium",
      dueDate: currentCommittee.nextMeeting,
      notes: [
        `Committee: ${currentCommittee.name}`,
        currentCommittee.role ? `Role: ${currentCommittee.role}` : undefined,
        currentCommittee.boundaryNote
          ? `Boundary: ${currentCommittee.boundaryNote}`
          : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
      committeeId: currentCommittee.id,
      nextAction: currentCommittee.nextAction,
      taskType: "meeting-prep",
      estimatedMinutes: currentCommittee.loadRating === "heavy" ? 45 : 30,
      lowEnergyFriendly: currentCommittee.loadRating !== "heavy",
    });
  }

  return (
    <section className="service-page page-stack">
      <div className="service-hero-panel">
        <div>
          <p className="eyebrow">Committee</p>
          <h1>{currentCommittee.name}</h1>
          <p>
            {currentCommittee.role ?? "Role not set"} · {currentCommittee.term ?? "Term not set"} ·{" "}
            {currentCommittee.loadRating ?? "load not set"} load
          </p>
        </div>
        <div className="service-hero-panel__actions">
          <button
            className="service-primary-button"
            type="button"
            onClick={() => setIsCommitteeModalOpen(true)}
          >
            Edit Committee
          </button>
          <button
            className="service-secondary-button"
            type="button"
            onClick={() =>
              currentCommittee.status === "archived"
                ? restoreCommittee(currentCommittee.id)
                : archiveCommittee(currentCommittee.id)
            }
          >
            {currentCommittee.status === "archived" ? "Restore" : "Archive"}
          </button>
          {currentCommittee.nextAction && currentCommittee.status !== "archived" ? (
            <button
              className="service-secondary-button"
              type="button"
              onClick={handleAddCommitteeToToday}
              disabled={isSourceOnToday("committee-item", currentCommittee.id)}
            >
              {isSourceOnToday("committee-item", currentCommittee.id)
                ? "Added to Today"
                : "Add to Today"}
            </button>
          ) : null}
          <Link className="service-secondary-button" to="/service">
            Back to Service
          </Link>
        </div>
      </div>

      <div className="service-detail-grid">
        <article className="service-detail-card">
          <span>Next action</span>
          <p>{currentCommittee.nextAction ?? "No next action recorded."}</p>
        </article>
        <article className="service-detail-card">
          <span>Next meeting</span>
          <strong>{formatServiceDate(currentCommittee.nextMeeting)}</strong>
        </article>
        <article className="service-detail-card service-detail-card--wide">
          <span>Boundary note</span>
          <p>{currentCommittee.boundaryNote ?? "No boundary note recorded yet."}</p>
        </article>
      </div>

      <section className="service-panel">
        <div className="service-section-header">
          <div>
            <p className="eyebrow">Committee labor</p>
            <h2>Related service items</h2>
            <p>Tasks tied to this committee shell.</p>
          </div>
          <button
            className="service-primary-button"
            type="button"
            onClick={() => {
              setEditingServiceItem(undefined);
              setIsServiceItemModalOpen(true);
            }}
          >
            Add Related Service Item
          </button>
        </div>

        <div className="service-card-grid">
          {relatedItems.map((item) => (
            <ServiceItemCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditingServiceItem(item);
                setIsServiceItemModalOpen(true);
              }}
              onDone={() => markServiceItemDone(item.id)}
              onArchive={() => archiveServiceItem(item.id)}
              onRestore={() => restoreServiceItem(item.id)}
            />
          ))}
          {relatedItems.length === 0 ? (
            <div className="service-empty-state service-empty-state--wide">
              No committee service items yet. Blessed silence, but you can add the
              next tiny obligation when it appears.
            </div>
          ) : null}
        </div>
      </section>

      {isCommitteeModalOpen ? (
        <CommitteeModal
          committee={currentCommittee}
          onClose={() => setIsCommitteeModalOpen(false)}
          onSave={(input) => {
            updateCommittee(currentCommittee.id, input);
            setIsCommitteeModalOpen(false);
          }}
        />
      ) : null}

      {isServiceItemModalOpen ? (
        <ServiceItemModal
          item={editingServiceItem}
          initialValues={{
            bucket: "committee",
            status: "inbox",
            relatedCommitteeId: currentCommittee.id,
          }}
          committees={committees}
          advisingStudents={advisingStudents}
          onClose={closeServiceItemModal}
          onSave={handleServiceItemSave}
        />
      ) : null}
    </section>
  );
}
