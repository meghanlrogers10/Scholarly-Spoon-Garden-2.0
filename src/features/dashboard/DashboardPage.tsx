export function DashboardPage() {
  return (
    <section className="page-stack">
      <div className="hero-card">
        <p className="eyebrow">Dashboard</p>
        <h1>Your academic day, one spoon at a time.</h1>
        <p>
          This will become the home base: energy, must-wins, tasks, working
          sessions, and calendar.
        </p>
      </div>

      <div className="card-grid">
        <article className="garden-card">
          <h2>Today’s Anchor</h2>
          <p>Pick one thing that makes today count.</p>
        </article>

        <article className="garden-card">
          <h2>Spoons</h2>
          <p>Energy tracking will live here.</p>
        </article>

        <article className="garden-card">
          <h2>Working Sessions</h2>
          <p>Timer history and focus blocks will live here.</p>
        </article>
      </div>
    </section>
  );
}