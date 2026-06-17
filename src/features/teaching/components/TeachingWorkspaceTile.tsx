import { Link } from "react-router-dom";

type TeachingWorkspaceTileProps = {
  title: string;
  description: string;
  meta: string;
  to: string;
};

export function TeachingWorkspaceTile({
  title,
  description,
  meta,
  to,
}: TeachingWorkspaceTileProps) {
  return (
    <Link className="teaching-workspace-tile" to={to}>
      <div>
        <p>{meta}</p>
        <h2>{title}</h2>
        <span>{description}</span>
      </div>
    </Link>
  );
}