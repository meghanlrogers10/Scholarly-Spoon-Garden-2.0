import { Link } from "react-router-dom";

type ResearchWorkspaceTileProps = {
  title: string;
  description: string;
  meta: string;
  to: string;
};

export function ResearchWorkspaceTile({
  title,
  description,
  meta,
  to,
}: ResearchWorkspaceTileProps) {
  return (
    <Link className="research-workspace-tile" to={to}>
      <div>
        <span className="research-workspace-tile__meta">{meta}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <span className="research-workspace-tile__arrow">→</span>
    </Link>
  );
}