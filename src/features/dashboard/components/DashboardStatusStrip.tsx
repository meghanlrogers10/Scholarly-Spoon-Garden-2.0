export function DashboardStatusStrip() {
  return (
    <section className="dashboard-status-strip" aria-label="Dashboard status">
      <div>
        <strong>🌤 Today’s Mode</strong>
        <span>Gentle progress</span>
      </div>

      <div>
        <strong>🌱 Garden Focus</strong>
        <span>Protect the main task</span>
      </div>

      <div>
        <strong>🧠 ADHD Rule</strong>
        <span>Visible beats remembered</span>
      </div>
    </section>
  );
}