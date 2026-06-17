import type { TeachingOfficeHourVisit } from "../types";

type LowSpoonOfficeHoursCardProps = {
  visits: TeachingOfficeHourVisit[];
};

function smallestMove(visit: TeachingOfficeHourVisit) {
  if (visit.nextAction.trim()) {
    return visit.nextAction;
  }

  if ((visit.status ?? "open") === "waiting") {
    return "Send one check-in or clarify what you are waiting on.";
  }

  return "Send one follow-up email, mark one issue resolved, or clarify one next step.";
}

export function LowSpoonOfficeHoursCard({
  visits,
}: LowSpoonOfficeHoursCardProps) {
  return (
    <aside className="teaching-notebook-panel">
      <div className="teaching-panel-heading">
        <p className="eyebrow">Low-spoon follow-up move</p>
        <h3>Only the next small step</h3>
      </div>

      {visits.length > 0 ? (
        <div className="teaching-change-list">
          {visits.map((visit) => (
            <article key={visit.id}>
              <span>{visit.visitDate || visit.status || "Open visit"}</span>
              <strong>{visit.student || "Student follow-up"}</strong>
              <p>Smallest useful move: {smallestMove(visit)}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="teaching-muted-copy">No office-hour follow-ups need attention.</p>
      )}
    </aside>
  );
}
