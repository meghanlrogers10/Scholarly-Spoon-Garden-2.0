type TaFollowUpSummaryCardsProps = {
  total: number;
  open: number;
  waiting: number;
  completed: number;
  overdue: number;
  dueSoon: number;
  uniqueTas: number;
};

export function TaFollowUpSummaryCards({
  total,
  open,
  waiting,
  completed,
  overdue,
  dueSoon,
  uniqueTas,
}: TaFollowUpSummaryCardsProps) {
  return (
    <div className="teaching-grading-summary-grid">
      <article>
        <span>Total</span>
        <strong>{total}</strong>
      </article>
      <article>
        <span>Open</span>
        <strong>{open}</strong>
      </article>
      <article>
        <span>Waiting</span>
        <strong>{waiting}</strong>
      </article>
      <article>
        <span>Completed</span>
        <strong>{completed}</strong>
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
        <span>Unique TAs</span>
        <strong>{uniqueTas}</strong>
      </article>
    </div>
  );
}
