import { NavLink } from "react-router-dom";

type ResearchProjectSubnavProps = {
  projectId: string;
};

const navItems = [
  { label: "Overview", to: "" },
  { label: "Tasks", to: "tasks" },
  { label: "Stages", to: "stages" },
  { label: "Literature", to: "literature" },
  { label: "Research Log", to: "notes" },
  { label: "Drafts", to: "drafts" },
  { label: "Submissions", to: "journals" },
];

export function ResearchProjectSubnav({ projectId }: ResearchProjectSubnavProps) {
  return (
    <nav className="research-project-subnav" aria-label="Research project sections">
      {navItems.map((item) => {
        const to = item.to
          ? `/research/${projectId}/${item.to}`
          : `/research/${projectId}`;

        return (
          <NavLink key={item.label} to={to} end={!item.to}>
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
