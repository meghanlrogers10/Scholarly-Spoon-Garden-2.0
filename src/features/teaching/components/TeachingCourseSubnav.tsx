import { NavLink } from "react-router-dom";

type TeachingCourseSubnavProps = {
  courseId: string;
};

const navItems = [
  { label: "Overview", to: "" },
  { label: "Notebook", to: "notebook" },
  { label: "Prep", to: "class-prep" },
  { label: "Grading", to: "grading" },
  { label: "TA Follow-Up", to: "ta" },
  { label: "Office Hours", to: "office-hours" },
  { label: "Announcements", to: "announcements" },
  { label: "Notes", to: "notes" },
  { label: "Resources", to: "resources" },
];

export function TeachingCourseSubnav({ courseId }: TeachingCourseSubnavProps) {
  return (
    <nav className="teaching-course-subnav" aria-label="Teaching course sections">
      {navItems.map((item) => {
        const to = item.to ? `/teaching/${courseId}/${item.to}` : `/teaching/${courseId}`;

        return (
          <NavLink key={item.label} to={to} end={!item.to}>
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
