import { useState } from "react";
import { Link } from "react-router-dom";
import { AdvisingStudentModal } from "../components/AdvisingStudentModal";
import { AdvisingStudentCard } from "../components/AdvisingStudentCard";
import { useService } from "../hooks/useService";
import type { AdvisingStudent } from "../types";
import "./service.css";

function isNotContactedRecently(lastContactDate?: string) {
  if (!lastContactDate) {
    return true;
  }

  const lastContact = new Date(`${lastContactDate}T00:00:00`);
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return lastContact < thirtyDaysAgo;
}

export function AdvisingPage() {
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdvisingStudent>();
  const {
    activeAdvisingStudents,
    archivedAdvisingStudents,
    createAdvisingStudent,
    updateAdvisingStudent,
    archiveAdvisingStudent,
    restoreAdvisingStudent,
  } = useService();
  const notContactedRecently = activeAdvisingStudents.filter((student) =>
    isNotContactedRecently(student.lastContactDate)
  );
  const semesterGoalsAtRisk = activeAdvisingStudents.filter(
    (student) => student.semesterGoalStatus === "stalled"
  );
  const jobMarketStudents = activeAdvisingStudents.filter(
    (student) => student.stage === "Job Market"
  );

  return (
    <section className="service-page page-stack">
      <div className="service-hero-panel">
        <div>
          <p className="eyebrow">Advising</p>
          <h1>Track students by goals, milestones, and memory.</h1>
          <p>
            Keep the long game visible: semester goals, ultimate goals, program
            milestones, and what Future You needs before meetings.
          </p>
        </div>
        <div className="service-hero-panel__actions">
          <button
            className="service-primary-button"
            type="button"
            onClick={() => {
              setEditingStudent(undefined);
              setIsStudentModalOpen(true);
            }}
          >
            Add Student
          </button>
          <Link className="service-secondary-button" to="/service">
            Back to Service
          </Link>
        </div>
      </div>

      <div className="service-status-strip">
        <span>{activeAdvisingStudents.length} active students</span>
        <span>{notContactedRecently.length} not contacted recently</span>
        <span>{semesterGoalsAtRisk.length} semester goals at risk</span>
        <span>{jobMarketStudents.length} job market stage</span>
      </div>

      <section className="service-panel">
        <div className="service-section-header">
          <div>
            <p className="eyebrow">Students</p>
            <h2>Who needs me this month?</h2>
            <p>Goal-centered advising cards, not just milestone bookkeeping.</p>
          </div>
        </div>

        <div className="service-card-grid">
          {activeAdvisingStudents.map((student) => (
            <AdvisingStudentCard
              key={student.id}
              student={student}
              onEdit={() => {
                setEditingStudent(student);
                setIsStudentModalOpen(true);
              }}
              onArchive={() => archiveAdvisingStudent(student.id)}
            />
          ))}
          {activeAdvisingStudents.length === 0 ? (
            <div className="service-empty-state service-empty-state--wide">
              No advising students yet. Add them from the main Service page.
            </div>
          ) : null}
        </div>
      </section>

      {archivedAdvisingStudents.length > 0 ? (
        <section className="service-panel">
          <div className="service-section-header">
            <div>
              <p className="eyebrow">Archived</p>
              <h2>Archived advising students</h2>
              <p>Restore students if advising labor becomes active again.</p>
            </div>
          </div>

          <div className="service-card-grid">
            {archivedAdvisingStudents.map((student) => (
              <AdvisingStudentCard
                key={student.id}
                student={student}
                onEdit={() => {
                  setEditingStudent(student);
                  setIsStudentModalOpen(true);
                }}
                onRestore={() => restoreAdvisingStudent(student.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {isStudentModalOpen ? (
        <AdvisingStudentModal
          student={editingStudent}
          onClose={() => {
            setEditingStudent(undefined);
            setIsStudentModalOpen(false);
          }}
          onSave={(input) => {
            if (editingStudent) {
              updateAdvisingStudent(editingStudent.id, input);
            } else {
              createAdvisingStudent(input);
            }

            setEditingStudent(undefined);
            setIsStudentModalOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}
