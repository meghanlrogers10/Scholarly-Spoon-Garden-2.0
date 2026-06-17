import type { AdvisingStudent, SemesterGoalStatus } from "../types";

const semesterGoalStatusLabels: Record<SemesterGoalStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  reached: "Reached",
  revised: "Revised",
  stalled: "Stalled",
};

type StudentGoalsCardProps = {
  student: AdvisingStudent;
};

export function StudentGoalsCard({ student }: StudentGoalsCardProps) {
  return (
    <section className="service-panel">
      <div className="service-section-header">
        <div>
          <p className="eyebrow">Goals</p>
          <h2>What are we helping them become?</h2>
          <p>Semester goal plus long-game career direction.</p>
        </div>
      </div>

      <div className="service-detail-grid">
        <article className="service-detail-card">
          <span>Ultimate goal</span>
          <strong>{student.ultimateGoal ?? "Not set"}</strong>
          {student.alternateGoal ? <p>Alternate: {student.alternateGoal}</p> : null}
        </article>

        <article className="service-detail-card">
          <span>Current semester</span>
          <strong>{student.currentSemester ?? "Not set"}</strong>
          <p>{student.semesterGoal ?? "No semester goal recorded yet."}</p>
          {student.semesterGoalStatus ? (
            <em>{semesterGoalStatusLabels[student.semesterGoalStatus]}</em>
          ) : null}
        </article>

        <article className="service-detail-card service-detail-card--wide">
          <span>Advisor support plan</span>
          <p>{student.advisorSupportPlan ?? "No support plan recorded yet."}</p>
        </article>

        <article className="service-detail-card service-detail-card--wide">
          <span>Outcome / advising memory</span>
          {student.semesterGoalOutcome ? (
            <p>
              <strong>Outcome:</strong> {student.semesterGoalOutcome}
            </p>
          ) : null}
          <p>{student.advisingMemory ?? "No advising memory recorded yet."}</p>
        </article>
      </div>
    </section>
  );
}
