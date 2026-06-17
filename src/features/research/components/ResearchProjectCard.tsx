import { Link } from "react-router-dom";
import { researchStages } from "../data/researchStages";
import type { ResearchProject } from "../types";
import { ResearchFocusBadge } from "./ResearchFocusBadge";

type ResearchProjectCardProps = {
  project: ResearchProject;
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

export function ResearchProjectCard({
  project,
  onUpdateFocus,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
  onRestoreProject,
  onPermanentlyDeleteProject,
}: ResearchProjectCardProps) {
  const progress =
    project.taskCount === 0
      ? 0
      : Math.round((project.completedTaskCount / project.taskCount) * 100);

  const canChangeFocus = Boolean(onUpdateFocus && project.status === "active");

  return (
    <article className={`research-project-card research-project-card--${project.color}`}>
      <div className="research-project-card__topline">
        <span className="research-project-card__short-name">
          {project.shortName}
        </span>
        <ResearchFocusBadge focusLevel={project.focusLevel} />
      </div>

      <div className="research-project-card__body">
        <h2>{project.title}</h2>
        <p>{project.description}</p>
      </div>

      <div className="research-project-card__meta">
        <div>
          <span>Current stage</span>
          <strong>{researchStages[project.currentStage]}</strong>
        </div>

        <div>
          <span>Next action</span>
          <strong>{project.nextAction}</strong>
        </div>

        {project.targetJournal ? (
          <div>
            <span>Target journal</span>
            <strong>{project.targetJournal}</strong>
          </div>
        ) : null}
      </div>

      <div className="research-progress">
        <div className="research-progress__label">
          <span>Project tasks</span>
          <strong>{progress}%</strong>
        </div>

        <div className="research-progress__track">
          <div
            className="research-progress__bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="research-project-card__stats">
        <span>
          {project.completedTaskCount}/{project.taskCount} tasks done
        </span>
        <span>{project.literatureCount} sources</span>
        <span>{project.notesCount} notes</span>
      </div>

      {canChangeFocus ? (
        <div className="research-project-card__actions">
          {project.focusLevel !== "primary" ? (
            <button
              className="research-chip-button"
              type="button"
              onClick={() => onUpdateFocus?.(project.id, "primary")}
            >
              Make Primary
            </button>
          ) : null}

          {project.focusLevel !== "secondary" ? (
            <button
              className="research-chip-button"
              type="button"
              onClick={() => onUpdateFocus?.(project.id, "secondary")}
            >
              Make Secondary
            </button>
          ) : null}

          {project.focusLevel !== "paused" ? (
            <button
              className="research-chip-button research-chip-button--quiet"
              type="button"
              onClick={() => onUpdateFocus?.(project.id, "paused")}
            >
              Pause
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="research-project-card__actions">
        {project.status !== "deleted" ? (
          <button
            className="research-chip-button"
            type="button"
            onClick={() => onEditProject?.(project)}
          >
            Edit
          </button>
        ) : null}

        {project.status === "active" ? (
          <>
            <button
              className="research-chip-button research-chip-button--quiet"
              type="button"
              onClick={() => onArchiveProject?.(project.id)}
            >
              Archive
            </button>

            <button
              className="research-chip-button research-chip-button--danger"
              type="button"
              onClick={() => onDeleteProject?.(project.id)}
            >
              Delete
            </button>
          </>
        ) : null}

        {project.status === "archived" ? (
          <>
            <button
              className="research-chip-button"
              type="button"
              onClick={() => onRestoreProject?.(project.id)}
            >
              Restore
            </button>

            <button
              className="research-chip-button research-chip-button--danger"
              type="button"
              onClick={() => onDeleteProject?.(project.id)}
            >
              Delete
            </button>
          </>
        ) : null}

        {project.status === "deleted" ? (
          <>
            <button
              className="research-chip-button"
              type="button"
              onClick={() => onRestoreProject?.(project.id)}
            >
              Restore
            </button>

            <button
              className="research-chip-button research-chip-button--danger"
              type="button"
              onClick={() => onPermanentlyDeleteProject?.(project.id)}
            >
              Delete Forever
            </button>
          </>
        ) : null}
      </div>

      {project.status !== "deleted" ? (
        <Link className="research-open-button" to={`/research/${project.id}`}>
          Open project →
        </Link>
      ) : null}
    </article>
  );
}
