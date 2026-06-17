import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdvisingStudentModal } from "../components/AdvisingStudentModal";
import { ServiceItemModal } from "../components/ServiceItemModal";
import { StudentGoalsCard } from "../components/StudentGoalsCard";
import { StudentMilestonesCard } from "../components/StudentMilestonesCard";
import { StudentNextActionsCard } from "../components/StudentNextActionsCard";
import { useService } from "../hooks/useService";
import type { AdvisingMilestone, ServiceItem } from "../types";
import { formatServiceDate } from "../utils/serviceFormat";
import "./service.css";

export function AdvisingStudentPage() {
  const { studentId } = useParams();
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isServiceItemModalOpen, setIsServiceItemModalOpen] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState<ServiceItem>();
  const {
    committees,
    advisingStudents,
    serviceItems,
    getAdvisingStudentById,
    updateAdvisingStudent,
    archiveAdvisingStudent,
    restoreAdvisingStudent,
    createServiceItem,
    updateServiceItem,
    markServiceItemDone,
    archiveServiceItem,
    restoreServiceItem,
  } = useService();
  const student = getAdvisingStudentById(studentId);

  if (!student) {
    return (
      <section className="service-page page-stack">
        <div className="service-hero-panel">
          <div>
            <p className="eyebrow">Advising</p>
            <h1>Student not found.</h1>
            <p>This student may be archived, deleted, or not yet created.</p>
          </div>
          <Link className="service-secondary-button" to="/service/advising">
            Back to Advising
          </Link>
        </div>
      </section>
    );
  }

  const currentStudent = student;
  const relatedServiceItems = serviceItems.filter(
    (item) => item.relatedStudentId === currentStudent.id
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

  function handleMilestoneChange(updatedMilestone: AdvisingMilestone) {
    const existingMilestones = currentStudent.milestones ?? [];
    const nextMilestones = existingMilestones.some(
      (milestone) => milestone.name === updatedMilestone.name
    )
      ? existingMilestones.map((milestone) =>
          milestone.name === updatedMilestone.name ? updatedMilestone : milestone
        )
      : [...existingMilestones, updatedMilestone];

    updateAdvisingStudent(currentStudent.id, { milestones: nextMilestones });
  }

  return (
    <section className="service-page page-stack">
      <div className="service-hero-panel">
        <div>
          <p className="eyebrow">{currentStudent.role}</p>
          <h1>{currentStudent.name}</h1>
          <p>
            {currentStudent.program ?? "Program not set"} ·{" "}
            {currentStudent.stage ?? "Stage not set"} · Last contact:{" "}
            {formatServiceDate(currentStudent.lastContactDate)}
          </p>
        </div>
        <div className="service-hero-panel__actions">
          <button
            className="service-primary-button"
            type="button"
            onClick={() => setIsStudentModalOpen(true)}
          >
            Edit Student
          </button>
          <button
            className="service-secondary-button"
            type="button"
            onClick={() => {
              setEditingServiceItem(undefined);
              setIsServiceItemModalOpen(true);
            }}
          >
            Add Related Service Item
          </button>
          <button
            className="service-secondary-button"
            type="button"
            onClick={() =>
              currentStudent.status === "archived"
                ? restoreAdvisingStudent(currentStudent.id)
                : archiveAdvisingStudent(currentStudent.id)
            }
          >
            {currentStudent.status === "archived" ? "Restore" : "Archive"}
          </button>
          <Link className="service-secondary-button" to="/service/advising">
            Back to Advising
          </Link>
        </div>
      </div>

      <StudentGoalsCard student={currentStudent} />
      <StudentMilestonesCard
        student={currentStudent}
        onMilestoneChange={handleMilestoneChange}
      />
      <StudentNextActionsCard
        student={currentStudent}
        serviceItems={relatedServiceItems}
        onEdit={(item) => {
          setEditingServiceItem(item);
          setIsServiceItemModalOpen(true);
        }}
        onDone={markServiceItemDone}
        onArchive={archiveServiceItem}
        onRestore={restoreServiceItem}
      />

      {isStudentModalOpen ? (
        <AdvisingStudentModal
          student={currentStudent}
          onClose={() => setIsStudentModalOpen(false)}
          onSave={(input) => {
            updateAdvisingStudent(currentStudent.id, input);
            setIsStudentModalOpen(false);
          }}
        />
      ) : null}

      {isServiceItemModalOpen ? (
        <ServiceItemModal
          item={editingServiceItem}
          initialValues={{
            bucket: "advising",
            status: "inbox",
            relatedStudentId: currentStudent.id,
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
