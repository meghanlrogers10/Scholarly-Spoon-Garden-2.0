import type { ServiceItem } from "../types";
import { ServiceItemCard } from "./ServiceItemCard";

type ServiceTriageCardProps = {
  items: ServiceItem[];
  onEdit: (item: ServiceItem) => void;
  onDone: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
};

export function ServiceTriageCard({
  items,
  onEdit,
  onDone,
  onArchive,
  onRestore,
}: ServiceTriageCardProps) {
  return (
    <section className="service-panel service-panel--attention">
      <div className="service-section-header">
        <div>
          <p className="eyebrow">Triage</p>
          <h2>Needs Attention</h2>
          <p>Overdue, due soon, high-stakes, or waiting on you.</p>
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
            Nothing is screaming right now. Protect that peace.
          </div>
        ) : null}
      </div>
    </section>
  );
}
