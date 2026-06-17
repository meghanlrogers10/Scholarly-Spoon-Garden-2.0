import type { ResearchProject } from "../types";
import { ResearchProjectCard } from "./ResearchProjectCard";

type ResearchProjectGridProps = {
  title: string;
  projects: ResearchProject[];
  emptyMessage: string;
  onUpdateFocus?: (
    projectId: string,
    focusLevel: ResearchProject["focusLevel"]
  ) => void;
  onEditProject?: (project: ResearchProject) => void;
  onArchiveProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onRestoreProject?: (projectId: string) => void;
  onPermanentlyDeleteProject?: (projectId: string) => void;
};

export function ResearchProjectGrid({
  title,
  projects,
  emptyMessage,
  onUpdateFocus,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
  onRestoreProject,
  onPermanentlyDeleteProject,
}: ResearchProjectGridProps) {
  return (
    <section className="research-section">
      <div className="research-section__header">
        <h2>{title}</h2>
        <span>{projects.length}</span>
      </div>

      {projects.length > 0 ? (
        <div className="research-project-grid">
          {projects.map((project) => (
            <ResearchProjectCard
              key={project.id}
              project={project}
              onUpdateFocus={onUpdateFocus}
              onEditProject={onEditProject}
              onArchiveProject={onArchiveProject}
              onDeleteProject={onDeleteProject}
              onRestoreProject={onRestoreProject}
              onPermanentlyDeleteProject={onPermanentlyDeleteProject}
            />
          ))}
        </div>
      ) : (
        <div className="research-empty-state">{emptyMessage}</div>
      )}
    </section>
  );
}