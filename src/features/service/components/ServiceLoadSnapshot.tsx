import type { ServiceItem } from "../types";

function parseDate(dateString?: string) {
  if (!dateString) {
    return undefined;
  }

  const date = new Date(`${dateString}T00:00:00`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isOverdue(item: ServiceItem) {
  const dueDate = parseDate(item.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Boolean(
    dueDate &&
      dueDate < today &&
      item.status !== "done" &&
      item.status !== "archived"
  );
}

function isDueThisWeek(item: ServiceItem) {
  const dueDate = parseDate(item.dueDate);

  if (!dueDate || item.status === "done" || item.status === "archived") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  return dueDate >= today && dueDate <= weekEnd;
}

type ServiceLoadSnapshotProps = {
  serviceItems: ServiceItem[];
};

export function ServiceLoadSnapshot({ serviceItems }: ServiceLoadSnapshotProps) {
  const activeItems = serviceItems.filter(
    (item) => item.status !== "done" && item.status !== "archived"
  );
  const dueThisWeek = activeItems.filter(isDueThisWeek);
  const overdue = activeItems.filter(isOverdue);
  const waitingOnOthers = activeItems.filter(
    (item) => item.status === "waiting-on-others"
  );
  const highSpoonItems = activeItems.filter(
    (item) => item.spoonCost !== undefined && item.spoonCost >= 4
  );
  const neverAgainItems = activeItems.filter((item) => item.neverAgain);

  return (
    <div className="service-status-strip" aria-label="Service load snapshot">
      <span>{activeItems.length} active obligations</span>
      <span>{dueThisWeek.length} due this week</span>
      <span>{overdue.length} overdue</span>
      <span>{waitingOnOthers.length} waiting on others</span>
      <span>{highSpoonItems.length} high-spoon items</span>
      <span>{neverAgainItems.length} never-again flags</span>
    </div>
  );
}
