import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import type { ServiceItem } from "../types";
import {
  formatServiceDate,
  getServiceDateState,
  serviceBucketLabels,
  serviceStatusLabels,
} from "../utils/serviceFormat";

type ServiceItemCardProps = {
  item: ServiceItem;
  onEdit?: () => void;
  onDone?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
};

export function ServiceItemCard({
  item,
  onEdit,
  onDone,
  onArchive,
  onRestore,
}: ServiceItemCardProps) {
  const { addLinkedTaskToToday, isSourceOnToday } = useTaskBridge();
  const isClosed = item.status === "done" || item.status === "archived";
  const isOnToday = isSourceOnToday("service-item", item.id);
  const dueState = !isClosed ? getServiceDateState(item.dueDate) : "none";

  function handleAddToToday() {
    const notes = [
      `Source service item: ${item.title}`,
      item.boundaryNote ? `Boundary: ${item.boundaryNote}` : undefined,
      item.waitingOn ? `Waiting on: ${item.waitingOn}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    addLinkedTaskToToday({
      source: "service-item",
      sourceId: item.id,
      title: item.nextAction || item.title,
      area: "Service",
      spoonCost: item.spoonCost ?? 2,
      priority: item.highStakes ? "High" : "Medium",
      dueDate: item.dueDate,
      notes,
      serviceItemId: item.id,
      committeeId: item.relatedCommitteeId,
      studentId: item.relatedStudentId,
      nextAction: item.nextAction,
      taskType: item.relatedStudentId ? "advising" : "service",
      estimatedMinutes: item.estimatedMinutes,
      lowEnergyFriendly: (item.spoonCost ?? 2) <= 2,
    });
  }

  return (
    <article className="service-item-card">
      <div className="service-item-card__header">
        <div>
          <p>{serviceBucketLabels[item.bucket]}</p>
          <h3>{item.title}</h3>
        </div>

        <span>{serviceStatusLabels[item.status]}</span>
      </div>

      <div className="service-item-card__meta">
        <span className={`service-date-pill service-date-pill--${dueState}`}>
          Due: {formatServiceDate(item.dueDate, "No due date")}
        </span>
        {item.spoonCost ? <span>{item.spoonCost} spoons</span> : null}
        {item.estimatedMinutes ? <span>{item.estimatedMinutes} min</span> : null}
        {item.highStakes ? <span>High stakes</span> : null}
        {item.confidential ? <span>Confidential</span> : null}
        {item.neverAgain ? <span>Never again?</span> : null}
      </div>

      <p className="service-item-card__next-action">
        <strong>Next:</strong> {item.nextAction}
      </p>

      {item.waitingOn ? (
        <p className="service-item-card__note">
          <strong>Waiting on:</strong> {item.waitingOn}
        </p>
      ) : null}

      {item.boundaryNote ? (
        <p className="service-item-card__note">
          <strong>Boundary:</strong> {item.boundaryNote}
        </p>
      ) : null}

      {item.link ? (
        <p className="service-item-card__note">
          <strong>Link:</strong> <a href={item.link}>{item.link}</a>
        </p>
      ) : null}

      {onEdit || onDone || onArchive || onRestore || !isClosed ? (
        <div className="service-item-card__actions">
          {onEdit ? (
            <button className="service-chip-button" type="button" onClick={onEdit}>
              Edit
            </button>
          ) : null}
          {!isClosed ? (
            <button
              className="service-chip-button"
              type="button"
              onClick={handleAddToToday}
              disabled={isOnToday}
            >
              {isOnToday ? "Added to Today" : "Add to Today"}
            </button>
          ) : null}
          {onDone && !isClosed ? (
            <button className="service-chip-button" type="button" onClick={onDone}>
              Done
            </button>
          ) : null}
          {onArchive && !isClosed ? (
            <button className="service-chip-button" type="button" onClick={onArchive}>
              Archive
            </button>
          ) : null}
          {onRestore && isClosed ? (
            <button className="service-chip-button" type="button" onClick={onRestore}>
              Restore
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
