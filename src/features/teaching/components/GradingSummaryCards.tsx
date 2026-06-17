type GradingSummaryCardsProps = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  returned: number;
  overdue: number;
  dueSoon: number;
  missingNotes: number;
  estimatedMinutes: number;
  highSpoon: number;
  averageScore?: number;
  scoreCount: number;
};

export function GradingSummaryCards({
  total,
  pending,
  inProgress,
  completed,
  returned,
  overdue,
  dueSoon,
  missingNotes,
  estimatedMinutes,
  highSpoon,
  averageScore,
  scoreCount,
}: GradingSummaryCardsProps) {
  return (
    <div className="teaching-grading-summary-grid">
      <article>
        <span>Total</span>
        <strong>{total}</strong>
      </article>
      <article>
        <span>Pending</span>
        <strong>{pending}</strong>
      </article>
      <article>
        <span>In progress</span>
        <strong>{inProgress}</strong>
      </article>
      <article>
        <span>Completed</span>
        <strong>{completed}</strong>
      </article>
      <article>
        <span>Returned</span>
        <strong>{returned}</strong>
      </article>
      <article>
        <span>Overdue</span>
        <strong>{overdue}</strong>
      </article>
      <article>
        <span>Due next 7 days</span>
        <strong>{dueSoon}</strong>
      </article>
      <article>
        <span>Missing notes</span>
        <strong>{missingNotes}</strong>
      </article>
      <article>
        <span>Estimated load</span>
        <strong>{estimatedMinutes}m</strong>
      </article>
      <article>
        <span>High-spoon</span>
        <strong>{highSpoon}</strong>
      </article>
      {averageScore !== undefined ? (
        <article>
          <span>Average score</span>
          <strong>{averageScore.toFixed(1)}</strong>
          <small>{scoreCount} scores parsed</small>
        </article>
      ) : null}
    </div>
  );
}
