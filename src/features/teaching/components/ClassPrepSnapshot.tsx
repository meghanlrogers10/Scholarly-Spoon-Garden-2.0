type ClassPrepSnapshotProps = {
  total: number;
  completed: number;
  incomplete: number;
  upcomingNeedingPrep: number;
  nextClassDate: string;
  nextPrepAction: string;
};

export function ClassPrepSnapshot({
  total,
  completed,
  incomplete,
  upcomingNeedingPrep,
  nextClassDate,
  nextPrepAction,
}: ClassPrepSnapshotProps) {
  return (
    <aside className="teaching-notebook-panel">
      <div className="teaching-panel-heading">
        <p className="eyebrow">Class Prep Snapshot</p>
        <h3>Before the next class</h3>
      </div>

      <div className="teaching-notebook-stats">
        <span>Total prep sessions</span>
        <strong>{total}</strong>
        <span>Completed</span>
        <strong>{completed}</strong>
        <span>Incomplete</span>
        <strong>{incomplete}</strong>
        <span>Upcoming needing prep</span>
        <strong>{upcomingNeedingPrep}</strong>
        <span>Next class date</span>
        <strong>{nextClassDate}</strong>
        <span>Next prep action</span>
        <strong>{nextPrepAction}</strong>
      </div>
    </aside>
  );
}
