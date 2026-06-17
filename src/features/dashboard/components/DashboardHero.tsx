export function DashboardHero() {
  return (
    <div className="dashboard-hero">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1>Your academic day, one spoon at a time.</h1>
        <p>
          Pick the work that matters, protect your energy, and keep the academic
          chaos from eating the whole day.
        </p>
      </div>

      <div className="hero-spoon-card">
        <span className="spoon-emoji">🥄</span>
        <div>
          <strong>Today’s mode</strong>
          <p>Gentle progress. No heroic nonsense.</p>
        </div>
      </div>
    </div>
  );
}