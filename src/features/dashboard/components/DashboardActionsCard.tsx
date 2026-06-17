import { Link } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";

type DashboardActionsCardProps = {
  todayTaskCount: number;
  completedTaskCount: number;
  timerSessionCount: number;
  manualWorkLogCount: number;
  clarifyLaterCount: number;
  avoidanceRadarCount: number;
  onLogWork: () => void;
};

export function DashboardActionsCard({
  todayTaskCount,
  completedTaskCount,
  timerSessionCount,
  manualWorkLogCount,
  clarifyLaterCount,
  avoidanceRadarCount,
  onLogWork,
}: DashboardActionsCardProps) {
  return (
    <Card>
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Control Center</p>
          <h2>Dashboard Actions</h2>
        </div>
      </div>

      <div className="dashboard-action-grid">
        <Link className="dashboard-action-tile" to="/tasks">
          <strong>View all tasks</strong>
          <span>{todayTaskCount} on today’s plan</span>
        </Link>

        <Link className="dashboard-action-tile" to="/tasks">
          <strong>Completed tasks</strong>
          <span>{completedTaskCount} completed today</span>
        </Link>

        <Link className="dashboard-action-tile" to="/timer-log">
          <strong>Timer log</strong>
          <span>{timerSessionCount} timed sessions</span>
        </Link>

        <Link className="dashboard-action-tile" to="/mindspace">
          <strong>Mindspace</strong>
          <span>
            {clarifyLaterCount} parked · {avoidanceRadarCount} radar
          </span>
        </Link>

<Link className="dashboard-action-tile" to="/settings">
  <strong>Settings</strong>
  <span>Calendar hours and app options</span>
</Link>

        <button className="dashboard-action-tile" onClick={onLogWork}>
          <strong>Log completed work</strong>
          <span>{manualWorkLogCount} manual logs</span>
        </button>
      </div>

      <div className="dashboard-action-footer">
        <Button variant="soft" onClick={onLogWork}>
          + Log work without timer
        </Button>
      </div>
    </Card>
  );
}
