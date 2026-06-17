import { resourceTypeLabel } from "./resourceUtils";
import type { TeachingResource } from "../types";

type TeachingResourceCardProps = {
  resource: TeachingResource;
  onEdit: (resource: TeachingResource) => void;
  onDelete: (resource: TeachingResource) => void;
  onAddToToday?: (resource: TeachingResource) => void;
  isOnToday?: boolean;
};

function preview(value: string) {
  return value.length > 170 ? `${value.slice(0, 170)}...` : value;
}

export function TeachingResourceCard({
  resource,
  onEdit,
  onDelete,
  onAddToToday,
  isOnToday,
}: TeachingResourceCardProps) {
  return (
    <article className="teaching-resource-card">
      <div className="teaching-note-card__header">
        <div>
          <span className="teaching-priority-badge">
            {resourceTypeLabel(resource.resourceType)}
          </span>
          <h3>{resource.title || resource.fileName || resource.url || "Untitled resource"}</h3>
          <p>Updated {new Date(resource.updatedAt).toLocaleDateString()}</p>
        </div>
        <div className="teaching-table-actions">
          {resource.url ? (
            <a
              className="teaching-chip-button"
              href={resource.url}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          ) : null}
          {onAddToToday ? (
            <button
              className="teaching-chip-button"
              type="button"
              onClick={() => onAddToToday(resource)}
              disabled={isOnToday}
            >
              {isOnToday ? "Added to Today" : "Add to Today"}
            </button>
          ) : null}
          <button className="teaching-chip-button" type="button" onClick={() => onEdit(resource)}>
            Edit
          </button>
          <button
            className="teaching-chip-button teaching-chip-button--danger"
            type="button"
            onClick={() => onDelete(resource)}
          >
            Delete
          </button>
        </div>
      </div>

      <p className="teaching-note-preview">
        {preview(resource.description) || "No description yet."}
      </p>

      <div className="teaching-resource-meta">
        {resource.faqCategory ? <span>{resource.faqCategory}</span> : null}
        {resource.reusable ? <span>Reusable</span> : null}
        {resource.dueDate ? <span>Action date {resource.dueDate}</span> : null}
        {resource.url ? <span>{resource.url}</span> : null}
        {resource.fileName ? <span>{resource.fileName}</span> : null}
      </div>

      {resource.shortAnswer ? (
        <p className="teaching-note-preview">{preview(resource.shortAnswer)}</p>
      ) : null}
    </article>
  );
}
