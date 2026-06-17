import { advisingMilestoneOrder } from "../data/advisingMilestones";
import type {
  AdvisingMilestone,
  AdvisingMilestoneStatus,
  AdvisingStudent,
} from "../types";

const milestoneStatusLabels: Record<AdvisingMilestoneStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
  stalled: "Stalled",
  "not-applicable": "N/A",
};

function formatDate(dateString?: string) {
  if (!dateString) {
    return undefined;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

type StudentMilestonesCardProps = {
  student: AdvisingStudent;
  onMilestoneChange?: (milestone: AdvisingMilestone) => void;
};

const milestoneStatusOptions: AdvisingMilestoneStatus[] = [
  "not-started",
  "in-progress",
  "done",
  "stalled",
  "not-applicable",
];

export function StudentMilestonesCard({
  student,
  onMilestoneChange,
}: StudentMilestonesCardProps) {
  const milestones = advisingMilestoneOrder.map((name) =>
    student.milestones.find((milestone) => milestone.name === name) ?? {
      id: `missing-${name}`,
      name,
      status: "not-started" as const,
    }
  );

  return (
    <section className="service-panel">
      <div className="service-section-header">
        <div>
          <p className="eyebrow">Milestones</p>
          <h2>Program path</h2>
          <p>Stage tracking without pretending every student has the same path.</p>
        </div>
      </div>

      <div className="service-milestone-list">
        {milestones.map((milestone) => (
          <article
            className={`service-milestone service-milestone--${milestone.status}`}
            key={milestone.id}
          >
            <div>
              <h3>{milestone.name}</h3>
              {onMilestoneChange ? (
                <select
                  className="service-table-select"
                  value={milestone.status}
                  onChange={(event) =>
                    onMilestoneChange({
                      ...milestone,
                      status: event.target.value as AdvisingMilestoneStatus,
                    })
                  }
                >
                  {milestoneStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {milestoneStatusLabels[status]}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{milestoneStatusLabels[milestone.status]}</span>
              )}
            </div>

            <div className="service-milestone__dates">
              {onMilestoneChange ? (
                <>
                  <label>
                    Target
                    <input
                      type="date"
                      value={milestone.targetDate ?? ""}
                      onChange={(event) =>
                        onMilestoneChange({
                          ...milestone,
                          targetDate: event.target.value || undefined,
                        })
                      }
                    />
                  </label>
                  <label>
                    Completed
                    <input
                      type="date"
                      value={milestone.completedDate ?? ""}
                      onChange={(event) =>
                        onMilestoneChange({
                          ...milestone,
                          completedDate: event.target.value || undefined,
                        })
                      }
                    />
                  </label>
                </>
              ) : (
                <>
                  {formatDate(milestone.targetDate) ? (
                    <span>Target: {formatDate(milestone.targetDate)}</span>
                  ) : null}
                  {formatDate(milestone.completedDate) ? (
                    <span>Completed: {formatDate(milestone.completedDate)}</span>
                  ) : null}
                </>
              )}
            </div>

            {onMilestoneChange ? (
              <>
                <label>
                  Next action
                  <input
                    value={milestone.nextAction ?? ""}
                    onChange={(event) =>
                      onMilestoneChange({
                        ...milestone,
                        nextAction: event.target.value || undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    value={milestone.notes ?? ""}
                    onChange={(event) =>
                      onMilestoneChange({
                        ...milestone,
                        notes: event.target.value || undefined,
                      })
                    }
                  />
                </label>
              </>
            ) : (
              <>
                {milestone.nextAction ? (
                  <p>
                    <strong>Next:</strong> {milestone.nextAction}
                  </p>
                ) : null}
                {milestone.notes ? <p>{milestone.notes}</p> : null}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
