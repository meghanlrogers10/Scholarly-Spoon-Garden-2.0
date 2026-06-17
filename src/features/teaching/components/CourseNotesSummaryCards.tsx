type CourseNotesSummaryCardsProps = {
  total: number;
  lecture: number;
  studentConfusion: number;
  changeNextTime: number;
  policy: number;
  recentlyUpdated: number;
};

export function CourseNotesSummaryCards({
  total,
  lecture,
  studentConfusion,
  changeNextTime,
  policy,
  recentlyUpdated,
}: CourseNotesSummaryCardsProps) {
  return (
    <div className="teaching-grading-summary-grid">
      <article>
        <span>Total notes</span>
        <strong>{total}</strong>
      </article>
      <article>
        <span>Lecture</span>
        <strong>{lecture}</strong>
      </article>
      <article>
        <span>Student confusion</span>
        <strong>{studentConfusion}</strong>
      </article>
      <article>
        <span>Change next time</span>
        <strong>{changeNextTime}</strong>
      </article>
      <article>
        <span>Policy</span>
        <strong>{policy}</strong>
      </article>
      <article>
        <span>Recently updated</span>
        <strong>{recentlyUpdated}</strong>
      </article>
    </div>
  );
}
