import { Link } from "react-router-dom";
import { Card } from "../../../shared/ui/Card";

type DashboardActionsCardProps = {
  todayTaskCount: number;
  completedTaskCount: number;
  timerSessionCount: number;
  manualWorkLogCount: number;
  clarifyLaterCount: number;
  avoidanceRadarCount: number;
  onStartCheckIn: () => void;
  onBuildToday: () => void;
  onLogWork: () => void;
  onShutdownReview: () => void;
};

export function DashboardActionsCard({
  todayTaskCount,
  completedTaskCount,
  timerSessionCount,
  manualWorkLogCount,
  clarifyLaterCount,
  avoidanceRadarCount,
  onStartCheckIn,
  onBuildToday,
  onLogWork,
  onShutdownReview,
}: DashboardActionsCardProps) {
  return (
    <Card className="dashboard-actions-card">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Control center</p>
          <h2>Quick Actions</h2>
          <p className="muted-text">Open the main daily planning tools.</p>
        </div>
      </div>

      <div className="dashboard-action-grid">
        <button
          className="dashboard-action-tile"
          type="button"
          onClick={onStartCheckIn}
        >
          <strong>Daily Check-In</strong>
          <span>Set spoons and work blocks</span>
        </button>

        <button
          className="dashboard-action-tile"
          type="button"
          onClick={onBuildToday}
        >
          <strong>Build Today</strong>
          <span>{todayTaskCount} tasks on today&apos;s plan</span>
        </button>

        <button className="dashboard-action-tile" type="button" onClick={onLogWork}>
          <strong>Log Work</strong>
          <span>{manualWorkLogCount} manual logs</span>
        </button>

        <button
          className="dashboard-action-tile"
          type="button"
          onClick={onShutdownReview}
        >
          <strong>Shutdown Review</strong>
          <span>{completedTaskCount} completed today</span>
        </button>

        <Link className="dashboard-action-tile" to="/timer-log">
          <strong>Timer Log</strong>
          <span>{timerSessionCount} timed sessions</span>
        </Link>

        <Link className="dashboard-action-tile" to="/mindspace">
          <strong>Mindspace Radar</strong>
          <span>
            {clarifyLaterCount} parked · {avoidanceRadarCount} radar
          </span>
        </Link>
      </div>
    </Card>
  );
}
