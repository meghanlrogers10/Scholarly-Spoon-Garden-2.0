import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import type { AdvisingStudent, ServiceItem } from "../types";
import { ServiceItemCard } from "./ServiceItemCard";

type StudentNextActionsCardProps = {
  student: AdvisingStudent;
  serviceItems: ServiceItem[];
  onEdit?: (item: ServiceItem) => void;
  onDone: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore?: (id: string) => void;
};

export function StudentNextActionsCard({
  student,
  serviceItems,
  onEdit,
  onDone,
  onArchive,
  onRestore,
}: StudentNextActionsCardProps) {
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();
  const relatedItems = serviceItems.filter((item) => item.relatedStudentId === student.id);
  const milestoneActions = student.milestones.filter(
    (milestone) => milestone.nextAction && milestone.status !== "done"
  );

  function addMilestoneToToday(milestoneId: string, title: string, dueDate?: string) {
    addLinkedTaskToToday({
      source: "advising-item",
      sourceId: `${student.id}:${milestoneId}`,
      title,
      area: "Service",
      spoonCost: 1,
      priority: "Medium",
      dueDate,
      notes: `Source advising student: ${student.name}`,
      studentId: student.id,
      nextAction: title,
      taskType: "advising",
      lowEnergyFriendly: true,
    });
  }

  return (
    <section className="service-panel">
      <div className="service-section-header">
        <div>
          <p className="eyebrow">Next actions</p>
          <h2>What needs to move?</h2>
          <p>Advisor follow-up, student follow-up, and milestone action cues.</p>
        </div>
      </div>

      <div className="service-action-columns">
        <div>
          <h3>Things I owe / service items</h3>
          <div className="service-card-grid service-card-grid--single">
            {relatedItems.map((item) => (
              <ServiceItemCard
                key={item.id}
                item={item}
                onEdit={onEdit ? () => onEdit(item) : undefined}
                onDone={() => onDone(item.id)}
                onArchive={() => onArchive(item.id)}
                onRestore={onRestore ? () => onRestore(item.id) : undefined}
              />
            ))}
            {relatedItems.length === 0 ? (
              <div className="service-empty-state">No advising service items linked yet.</div>
            ) : null}
          </div>
        </div>

        <div>
          <h3>Milestone next actions</h3>
          <div className="service-mini-list">
            {milestoneActions.map((milestone) => (
              <article key={milestone.id}>
                <span>{milestone.name}</span>
                <p>{milestone.nextAction}</p>
                <button
                  className="service-chip-button"
                  type="button"
                  onClick={() =>
                    addMilestoneToToday(
                      milestone.id,
                      milestone.nextAction || `${student.name}: ${milestone.name}`,
                      milestone.targetDate
                    )
                  }
                  disabled={isSourceOnToday(
                    "advising-item",
                    `${student.id}:${milestone.id}`
                  )}
                >
                  {isSourceOnToday("advising-item", `${student.id}:${milestone.id}`)
                    ? "Added to Today"
                    : "Add to Today"}
                </button>
              </article>
            ))}
            {milestoneActions.length === 0 ? (
              <div className="service-empty-state">No milestone next actions recorded.</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
