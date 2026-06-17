import { useState } from "react";
import type {
  AdvisingMilestoneName,
  AdvisingRole,
  AdvisingStudent,
  AdvisingStudentStatus,
  CareerGoal,
  NewAdvisingStudentInput,
  SemesterGoalStatus,
} from "../types";

const roleOptions: AdvisingRole[] = ["chair", "committee", "mentor", "informal"];
const stageOptions: AdvisingMilestoneName[] = [
  "Coursework",
  "MA",
  "Comps",
  "Prospectus",
  "Prospectus Defense",
  "Dissertation Drafts",
  "Defense",
  "Job Market",
];
const careerOptions: CareerGoal[] = [
  "R1 faculty",
  "R2 / regional university faculty",
  "SLAC / teaching-focused faculty",
  "Community college",
  "Research institute",
  "Government",
  "Nonprofit",
  "Industry",
  "Policy work",
  "Non-academic",
  "Unsure / exploring",
];
const goalStatusOptions: SemesterGoalStatus[] = [
  "not-started",
  "in-progress",
  "reached",
  "revised",
  "stalled",
];
const studentStatusOptions: AdvisingStudentStatus[] = ["active", "archived"];

export type AdvisingStudentModalSaveInput = NewAdvisingStudentInput & {
  status?: AdvisingStudentStatus;
};

type AdvisingStudentModalProps = {
  student?: AdvisingStudent;
  onClose: () => void;
  onSave: (input: AdvisingStudentModalSaveInput) => void;
};

export function AdvisingStudentModal({
  student,
  onClose,
  onSave,
}: AdvisingStudentModalProps) {
  const [name, setName] = useState(student?.name ?? "");
  const [program, setProgram] = useState(student?.program ?? "");
  const [role, setRole] = useState<AdvisingRole>(student?.role ?? "mentor");
  const [status, setStatus] = useState<AdvisingStudentStatus>(student?.status ?? "active");
  const [stage, setStage] = useState<AdvisingMilestoneName>(
    student?.stage ?? "Coursework"
  );
  const [lastContactDate, setLastContactDate] = useState(
    student?.lastContactDate ?? ""
  );
  const [nextMeetingDate, setNextMeetingDate] = useState(
    student?.nextMeetingDate ?? ""
  );
  const [currentSemester, setCurrentSemester] = useState(
    student?.currentSemester ?? ""
  );
  const [semesterGoal, setSemesterGoal] = useState(student?.semesterGoal ?? "");
  const [semesterGoalStatus, setSemesterGoalStatus] =
    useState<SemesterGoalStatus>(student?.semesterGoalStatus ?? "not-started");
  const [semesterGoalOutcome, setSemesterGoalOutcome] = useState(
    student?.semesterGoalOutcome ?? ""
  );
  const [advisorSupportPlan, setAdvisorSupportPlan] = useState(
    student?.advisorSupportPlan ?? ""
  );
  const [ultimateGoal, setUltimateGoal] = useState<CareerGoal>(
    student?.ultimateGoal ?? "Unsure / exploring"
  );
  const [alternateGoal, setAlternateGoal] = useState(student?.alternateGoal ?? "");
  const [advisingMemory, setAdvisingMemory] = useState(
    student?.advisingMemory ?? ""
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    onSave({
      name,
      program,
      role,
      status,
      stage,
      lastContactDate,
      nextMeetingDate,
      currentSemester,
      semesterGoal,
      semesterGoalStatus,
      semesterGoalOutcome,
      advisorSupportPlan,
      ultimateGoal,
      alternateGoal,
      advisingMemory,
      milestones: student?.milestones,
    });
    onClose();
  }

  return (
    <div className="service-modal-backdrop" role="presentation">
      <section className="service-modal service-modal--wide" role="dialog" aria-modal="true">
        <div className="service-modal__header">
          <div>
            <p className="eyebrow">Advising</p>
            <h2>{student ? "Edit the student shell." : "Add a student goal shell."}</h2>
          </div>
          <button className="service-chip-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="service-modal__form" onSubmit={handleSubmit}>
          <div className="service-modal__row">
            <label>
              Student name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Program
              <input value={program} onChange={(event) => setProgram(event.target.value)} />
            </label>
          </div>

          <div className="service-modal__row">
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as AdvisingRole)}>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as AdvisingStudentStatus)}
              >
                {studentStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="service-modal__row">
            <label>
              Stage
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value as AdvisingMilestoneName)}
              >
                {stageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Last contact
              <input
                type="date"
                value={lastContactDate}
                onChange={(event) => setLastContactDate(event.target.value)}
              />
            </label>
            <label>
              Next meeting
              <input
                type="date"
                value={nextMeetingDate}
                onChange={(event) => setNextMeetingDate(event.target.value)}
              />
            </label>
          </div>

          <div className="service-modal__row">
            <label>
              Current semester
              <input
                value={currentSemester}
                onChange={(event) => setCurrentSemester(event.target.value)}
              />
            </label>
            <label>
              Semester goal status
              <select
                value={semesterGoalStatus}
                onChange={(event) =>
                  setSemesterGoalStatus(event.target.value as SemesterGoalStatus)
                }
              >
                {goalStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Semester goal
            <textarea
              value={semesterGoal}
              onChange={(event) => setSemesterGoal(event.target.value)}
            />
          </label>

          <label>
            Semester goal outcome
            <textarea
              value={semesterGoalOutcome}
              onChange={(event) => setSemesterGoalOutcome(event.target.value)}
            />
          </label>

          <label>
            Advisor support plan
            <textarea
              value={advisorSupportPlan}
              onChange={(event) => setAdvisorSupportPlan(event.target.value)}
            />
          </label>

          <div className="service-modal__row">
            <label>
              Ultimate goal
              <select
                value={ultimateGoal}
                onChange={(event) => setUltimateGoal(event.target.value as CareerGoal)}
              >
                {careerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Alternate goal
              <input
                value={alternateGoal}
                onChange={(event) => setAlternateGoal(event.target.value)}
              />
            </label>
          </div>

          <label>
            Advising memory
            <textarea
              value={advisingMemory}
              onChange={(event) => setAdvisingMemory(event.target.value)}
            />
          </label>

          <div className="service-modal__actions">
            <button className="service-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="service-primary-button" type="submit" disabled={!name.trim()}>
              {student ? "Save Changes" : "Save Student"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
