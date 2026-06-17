import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ResearchProjectSubnav } from "../components/ResearchProjectSubnav";
import { researchStages } from "../data/researchStages";
import { useResearchProjects } from "../hooks/useResearchProjects";
import { useResearchTasks } from "../hooks/useResearchTasks";
import type { ResearchStageKey } from "../types";

const stageEntries = Object.entries(researchStages) as Array<
  [ResearchStageKey, string]
>;

export function ResearchStagesPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const { projects } = useResearchProjects();
  const { getTasksForProject, refreshTasks } = useResearchTasks();

  useEffect(() => {
    refreshTasks();
  // Refresh localStorage-backed stage tasks only when navigating between research routes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const project = projects.find((item) => item.id === projectId);

  if (!project || !projectId) {
    return (
      <section className="research-page page-stack">
        <div className="research-hero-panel">
          <div>
            <p className="eyebrow">Research</p>
            <h1>Project not found.</h1>
            <p>Go back to the Research page and choose a project.</p>
          </div>

          <Link className="research-secondary-link" to="/research">
            ← Back to Research
          </Link>
        </div>
      </section>
    );
  }

  const projectTasks = getTasksForProject(projectId);

  const stageSummaries = stageEntries.map(([stageKey, stageLabel]) => {
    const stageTasks = projectTasks.filter((task) => task.stageKey === stageKey);
    const doneTasks = stageTasks.filter((task) => task.status === "done");
    const doingTasks = stageTasks.filter((task) => task.status === "doing");
    const openTasks = stageTasks.filter((task) => task.status !== "done");
    const nextTask = openTasks[0];

    const progress =
      stageTasks.length === 0
        ? 0
        : Math.round((doneTasks.length / stageTasks.length) * 100);

    return {
      stageKey,
      stageLabel,
      stageTasks,
      doneTasks,
      doingTasks,
      openTasks,
      nextTask,
      progress,
    };
  });

  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((task) => task.status === "done");
  const overallProgress =
    totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);

  return (
    <section className="research-page page-stack">
      <div className="research-hero-panel">
        <div>
          <Link className="research-secondary-link" to={`/research/${projectId}`}>
            ← Back to {project.shortName}
          </Link>

          <p className="eyebrow">{project.shortName}</p>
          <h1>Stages</h1>
          <p>
            See where the manuscript is moving and where it is quietly getting
            stuck. The goal is not guilt. The goal is visibility.
          </p>
        </div>

        <div className="research-project-hero__status">
          <span>Overall progress</span>
          <strong>{overallProgress}%</strong>
        </div>
      </div>

      <ResearchProjectSubnav projectId={projectId} />

      <div className="research-task-summary">
        <span>{completedTasks.length}/{totalTasks} tasks done</span>
        <span>{stageSummaries.filter((stage) => stage.openTasks.length > 0).length} active stages</span>
        <span>{researchStages[project.currentStage]}</span>
      </div>

      <section className="research-stage-grid">
        {stageSummaries.map((stage) => (
          <article
            key={stage.stageKey}
            className={`research-stage-card ${
              project.currentStage === stage.stageKey
                ? "research-stage-card--current"
                : ""
            }`}
          >
            <div className="research-stage-card__header">
              <div>
                <p className="research-stage-card__eyebrow">
                  {project.currentStage === stage.stageKey
                    ? "Current stage"
                    : "Manuscript stage"}
                </p>
                <h2>{stage.stageLabel}</h2>
              </div>

              <strong>{stage.progress}%</strong>
            </div>

            <div className="research-progress">
              <div className="research-progress__track">
                <div
                  className="research-progress__bar"
                  style={{ width: `${stage.progress}%` }}
                />
              </div>
            </div>

            <div className="research-stage-card__stats">
              <span>{stage.doneTasks.length} done</span>
              <span>{stage.doingTasks.length} doing</span>
              <span>{stage.openTasks.length} open</span>
              <span>{stage.stageTasks.length} total</span>
            </div>

            <div className="research-stage-card__next">
              <span>Next task</span>
              <p>
                {stage.nextTask?.title ??
                  (stage.stageTasks.length === 0
                    ? "No tasks assigned to this stage yet."
                    : "This stage is complete.")}
              </p>
            </div>

            <Link
              className="research-open-button"
              to={`/research/${projectId}/tasks`}
            >
              View tasks →
            </Link>
          </article>
        ))}
      </section>
    </section>
  );
}
