import type { TimerMood, TimerSession } from "../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../shared/types/workLog";
import { Card } from "../../../shared/ui/Card";

type WorkingSessionsCardProps = {
  sessions: TimerSession[];
  manualWorkLogs: ManualWorkLogEntry[];
};

type DashboardWorkEntry = {
  id: string;
  label: string;
  category: string;
  source: "timer" | "manual";
  timestamp: string;
  durationSeconds: number | null;
  mood?: TimerMood;
};

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds === null) {
    return "Manual";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function isToday(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getManualLogTimestamp(entry: ManualWorkLogEntry) {
  return `${entry.date}T${entry.startTime || "00:00"}`;
}

function getManualDurationSeconds(entry: ManualWorkLogEntry) {
  if (!entry.endTime) {
    return null;
  }

  const start = new Date(`${entry.date}T${entry.startTime}`);
  const end = new Date(`${entry.date}T${entry.endTime}`);

  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);

  if (seconds <= 0) {
    return null;
  }

  return seconds;
}

export function WorkingSessionsCard({
  sessions,
  manualWorkLogs,
}: WorkingSessionsCardProps) {
  const timerEntries: DashboardWorkEntry[] = sessions.map((session) => ({
    id: `timer-${session.id}`,
    label: session.label,
    category: session.category,
    source: "timer",
    timestamp: session.endedAt,
    durationSeconds: session.durationSeconds,
    mood: session.mood,
  }));

  const manualEntries: DashboardWorkEntry[] = manualWorkLogs.map((entry) => ({
    id: `manual-${entry.id}`,
    label: entry.title,
    category: entry.category,
    source: "manual",
    timestamp: getManualLogTimestamp(entry),
    durationSeconds: getManualDurationSeconds(entry),
    mood: entry.mood,
  }));

  const allEntries = [...timerEntries, ...manualEntries];
  const todayEntries = allEntries.filter((entry) => isToday(entry.timestamp));

  const totalTodaySeconds = todayEntries.reduce(
    (sum, entry) => sum + (entry.durationSeconds || 0),
    0,
  );

  return (
    <Card className="hint-card analytics-card" id="workingSessionsCard">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Focus</p>
          <h2>Working Sessions</h2>
        </div>

        <span className="pill">{todayEntries.length} today</span>
      </div>

      <div className="working-session-summary working-session-summary-compact">
        <div>
          <strong>{formatDuration(totalTodaySeconds)}</strong>
          <span>tracked today</span>
        </div>

        <div>
          <strong>{todayEntries.length}</strong>
          <span>logs today</span>
        </div>
      </div>

      <p className="muted-text">
        Full session history lives in Timer Log. Keep the dashboard light.
      </p>
    </Card>
  );
}