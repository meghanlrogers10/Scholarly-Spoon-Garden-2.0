import { TeachingResourceCard } from "./TeachingResourceCard";
import type { TeachingResource } from "../types";

type TeachingResourceGridProps = {
  resources: TeachingResource[];
  onAddResource: () => void;
  onEditResource: (resource: TeachingResource) => void;
  onDeleteResource: (resource: TeachingResource) => void;
  onAddToToday?: (resource: TeachingResource) => void;
  isOnToday?: (resource: TeachingResource) => boolean;
};

export function TeachingResourceGrid({
  resources,
  onAddResource,
  onEditResource,
  onDeleteResource,
  onAddToToday,
  isOnToday,
}: TeachingResourceGridProps) {
  if (resources.length === 0) {
    return (
      <div className="teaching-empty-state">
        <p>
          No course resources yet. Add syllabi, slides, rubrics, readings, ICON
          links, or anything future-you should not have to hunt for.
        </p>
        <button
          className="teaching-primary-button"
          type="button"
          onClick={onAddResource}
        >
          Add Resource
        </button>
      </div>
    );
  }

  return (
    <div className="teaching-resource-grid">
      {resources.map((resource) => (
        <TeachingResourceCard
          key={resource.id}
          resource={resource}
          onEdit={onEditResource}
          onDelete={onDeleteResource}
          onAddToToday={onAddToToday}
          isOnToday={isOnToday?.(resource) ?? false}
        />
      ))}
    </div>
  );
}
