import type { ManualWorkLogEntry } from "../../../shared/types/workLog";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";

type ManualWorkLogCardProps = {
  entries: ManualWorkLogEntry[];
  onOpenLogModal: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

function formatEntryDate(entry: ManualWorkLogEntry) {
  const date = new Date(`${entry.date}T${entry.startTime || "00:00"}`);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ManualWorkLogCard({
  entries,
  onOpenLogModal,
  onDelete,
  onClearAll,
}: ManualWorkLogCardProps) {
  const recentEntries = entries.slice(0, 4);

  return (
    <Card>
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Manual Log</p>
          <h2>Completed Work</h2>
        </div>

        <div className="manual-work-actions">
          <span className="pill">{entries.length}</span>
          <Button variant="soft" onClick={onOpenLogModal}>
            + Log work
          </Button>
        </div>
      </div>

      {recentEntries.length === 0 ? (
        <p className="muted-text">
          Nothing manually logged yet. Use this when you worked without the timer.
        </p>
      ) : (
        <div className="manual-work-list">
          {recentEntries.map((entry) => (
            <div key={entry.id} className="manual-work-item">
              <div>
                <strong>{entry.title}</strong>
                <p>
                  {entry.category} · {formatEntryDate(entry)}
                  {entry.mood ? ` · ${entry.mood}` : ""}
                </p>
              </div>

              <button
                className="text-button"
                onClick={() => onDelete(entry.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <div className="manual-work-footer">
          <button className="text-button" onClick={onClearAll}>
            Clear all manual logs
          </button>
        </div>
      )}
    </Card>
  );
}