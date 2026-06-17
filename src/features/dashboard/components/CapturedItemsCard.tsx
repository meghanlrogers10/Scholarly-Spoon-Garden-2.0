import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";

type CapturedItem = {
  id: string;
  text: string;
  createdAt: string;
};

type CapturedItemsCardProps = {
  items: CapturedItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onCreateTask: (item: CapturedItem) => void;
};

export function CapturedItemsCard({
  items,
  onDelete,
  onClearAll,
  onCreateTask,
}: CapturedItemsCardProps) {
  return (
    <Card>
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Inbox</p>
          <h2>Captured Things</h2>
        </div>

        <div className="captured-actions">
          <span className="pill">{items.length}</span>
          {items.length > 0 && (
            <Button variant="soft" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="muted-text">
          Nothing captured yet. Your brain has been suspiciously quiet.
        </p>
      ) : (
        <div className="captured-list">
          {items.map((item) => (
            <div key={item.id} className="captured-item">
              <div>
                <p>{item.text}</p>
                <span>{item.createdAt}</span>
              </div>

              <div className="captured-item-actions">
                <button
                  className="text-button"
                  onClick={() => onCreateTask(item)}
                >
                  Make task
                </button>

                <button
                  className="text-button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete captured item: ${item.text}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}