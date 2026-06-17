type OfficeHoursSummaryCardsProps = {
  total: number;
  thisWeek: number;
  openFollowUps: number;
  waiting: number;
  resolved: number;
  uniqueStudents: number;
};

export function OfficeHoursSummaryCards({
  total,
  thisWeek,
  openFollowUps,
  waiting,
  resolved,
  uniqueStudents,
}: OfficeHoursSummaryCardsProps) {
  return (
    <div className="teaching-grading-summary-grid">
      <article>
        <span>Total visits</span>
        <strong>{total}</strong>
      </article>
      <article>
        <span>This week</span>
        <strong>{thisWeek}</strong>
      </article>
      <article>
        <span>Open follow-ups</span>
        <strong>{openFollowUps}</strong>
      </article>
      <article>
        <span>Waiting</span>
        <strong>{waiting}</strong>
      </article>
      <article>
        <span>Resolved</span>
        <strong>{resolved}</strong>
      </article>
      <article>
        <span>Unique students</span>
        <strong>{uniqueStudents}</strong>
      </article>
    </div>
  );
}
