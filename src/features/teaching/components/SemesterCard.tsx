import type { TeachingSemester } from "../types";

type SemesterCardProps = {
  semester: TeachingSemester;
  courseCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onArchive: () => void;
  onRestore: () => void;
};

export function SemesterCard({
  semester,
  courseCount,
  isSelected,
  onSelect,
  onArchive,
  onRestore,
}: SemesterCardProps) {
  return (
    <article
      className={`teaching-semester-card ${
        isSelected ? "teaching-semester-card--selected" : ""
      }`}
    >
      <button type="button" onClick={onSelect}>
        <span>{semester.term} {semester.year}</span>
        <strong>{semester.name}</strong>
        <small>{courseCount} courses</small>
      </button>

      {semester.status === "active" ? (
        <button className="teaching-text-button" type="button" onClick={onArchive}>
          Archive
        </button>
      ) : (
        <button className="teaching-text-button" type="button" onClick={onRestore}>
          Restore
        </button>
      )}
    </article>
  );
}