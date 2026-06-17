type TeachingResourcesSummaryCardsProps = {
  total: number;
  slides: number;
  assignmentRubric: number;
  reading: number;
  externalLinks: number;
  recentlyUpdated: number;
};

export function TeachingResourcesSummaryCards({
  total,
  slides,
  assignmentRubric,
  reading,
  externalLinks,
  recentlyUpdated,
}: TeachingResourcesSummaryCardsProps) {
  return (
    <div className="teaching-grading-summary-grid">
      <article>
        <span>Total resources</span>
        <strong>{total}</strong>
      </article>
      <article>
        <span>Slides</span>
        <strong>{slides}</strong>
      </article>
      <article>
        <span>Assignments / rubrics</span>
        <strong>{assignmentRubric}</strong>
      </article>
      <article>
        <span>Readings</span>
        <strong>{reading}</strong>
      </article>
      <article>
        <span>External links</span>
        <strong>{externalLinks}</strong>
      </article>
      <article>
        <span>Recently updated</span>
        <strong>{recentlyUpdated}</strong>
      </article>
    </div>
  );
}
