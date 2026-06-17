import type { ReactNode } from "react";

type SyncPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  children: ReactNode;
};

export function SyncPanel({
  eyebrow,
  title,
  description,
  statusLabel,
  children,
}: SyncPanelProps) {
  return (
    <section className="settings-task-sync-panel">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="muted-text">{description}</p>
        </div>
        <span className="pill">{statusLabel}</span>
      </div>
      {children}
    </section>
  );
}
