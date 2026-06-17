import type { ServiceItem } from "../types";
import { ServiceItemCard } from "./ServiceItemCard";

type ServiceInboxCardProps = {
  items: ServiceItem[];
  onEdit: (item: ServiceItem) => void;
  onDone: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
};

export function ServiceInboxCard({
  items,
  onEdit,
  onDone,
  onArchive,
  onRestore,
}: ServiceInboxCardProps) {
  return (
    <section className="service-panel">
      <div className="service-section-header">
        <div>
          <p className="eyebrow">Capture</p>
          <h2>Service Inbox</h2>
          <p>Loose asks that need a decision, due date, or bucket.</p>
        </div>
      </div>

      <div className="service-card-grid service-card-grid--single">
        {items.map((item) => (
          <ServiceItemCard
            key={item.id}
            item={item}
            onEdit={() => onEdit(item)}
            onDone={() => onDone(item.id)}
            onArchive={() => onArchive(item.id)}
            onRestore={() => onRestore(item.id)}
          />
        ))}

        {items.length === 0 ? (
          <div className="service-empty-state">
            No loose service asks captured. Suspicious, but beautiful.
          </div>
        ) : null}
      </div>
    </section>
  );
}
