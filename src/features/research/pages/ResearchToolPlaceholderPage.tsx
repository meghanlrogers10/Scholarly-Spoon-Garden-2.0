import { Link, useParams } from "react-router-dom";
import { ResearchProjectSubnav } from "../components/ResearchProjectSubnav";
import { useResearchProjects } from "../hooks/useResearchProjects";

type ToolPlaceholderProps = {
  title: string;
  description: string;
};

function ResearchToolPlaceholder({ title, description }: ToolPlaceholderProps) {
  const { projectId } = useParams();
  const { projects } = useResearchProjects();

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

  return (
    <section className="research-page page-stack">
      <div className="research-hero-panel">
        <div>
          <Link className="research-secondary-link" to={`/research/${projectId}`}>
            ← Back to {project.shortName}
          </Link>

          <p className="eyebrow">{project.shortName}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <ResearchProjectSubnav projectId={projectId} />

      <div className="research-placeholder-panel">
        <h2>{title} shell is connected.</h2>
        <p>
          This route works. Next we make this section functional without dragging
          the whole old research module into one giant React file.
        </p>
      </div>
    </section>
  );
}


export function LiteratureWorkspacePage() {
  return (
    <ResearchToolPlaceholder
      title="Literature Workspace"
      description="This will eventually hold the literature queue, notes, themes, synthesis, mindmap, and outline builder."
    />
  );
}

export function JournalTrackingPage() {
  return (
    <ResearchToolPlaceholder
      title="Submission Tracking"
      description="This will track submissions, R&Rs, rejections, acceptances, and journal strategy."
    />
  );
}