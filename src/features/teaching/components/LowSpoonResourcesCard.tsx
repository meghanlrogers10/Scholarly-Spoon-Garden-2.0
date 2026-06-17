import { resourceTypeLabel } from "./resourceUtils";
import type { TeachingResource } from "../types";

type LowSpoonResourcesCardProps = {
  resources: TeachingResource[];
  hasSyllabusOrIcon: boolean;
};

export function LowSpoonResourcesCard({
  resources,
  hasSyllabusOrIcon,
}: LowSpoonResourcesCardProps) {
  const roughResources = resources.filter(
    (resource) => !resource.title.trim() || (!resource.url.trim() && !resource.fileName.trim())
  );
  const suggestedResources = !hasSyllabusOrIcon
    ? []
    : roughResources.length > 0
      ? roughResources
      : resources;

  return (
    <aside className="teaching-notebook-panel">
      <div className="teaching-panel-heading">
        <p className="eyebrow">Low-spoon resource move</p>
        <h3>Only one useful label</h3>
      </div>

      {!hasSyllabusOrIcon ? (
        <div className="teaching-change-list">
          <article>
            <span>Key resource</span>
            <strong>Add syllabus or ICON link</strong>
            <p>Smallest useful move: add one link or label one file so future-you can find it.</p>
          </article>
        </div>
      ) : suggestedResources.length > 0 ? (
        <div className="teaching-change-list">
          {suggestedResources.slice(0, 3).map((resource) => (
            <article key={resource.id}>
              <span>{resourceTypeLabel(resource.resourceType)}</span>
              <strong>{resource.title || resource.fileName || resource.url || "Rough resource"}</strong>
              <p>Smallest useful move: add one link or label one file so future-you can find it.</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="teaching-muted-copy">
          Smallest useful move: add one link or label one file so future-you can find it.
        </p>
      )}
    </aside>
  );
}
