import { Link } from "react-router-dom";
import type { ServiceBucket, ServiceItem } from "../types";
import { serviceBucketLabels } from "../utils/serviceFormat";

const bucketDescriptions: Record<ServiceBucket, string> = {
  committee: "Standing obligations, meetings, decisions, and follow-up work.",
  "review-letter": "Reviews, recommendation letters, external letters, and award notes.",
  advising: "Students, milestones, goals, and mentorship memory.",
  "admin-other": "Assessment, program review, faculty meeting asks, and admin miscellany.",
};

const bucketEmptyMessages: Record<ServiceBucket, string> = {
  committee: "No committees captured yet. Add one from Service when it starts taking up space.",
  "review-letter": "No reviews or letters captured yet.",
  advising: "No advising service items captured yet.",
  "admin-other": "No admin asks captured yet. A rare and delicate calm.",
};

type ServiceBucketCardProps = {
  bucket: ServiceBucket;
  title: string;
  href: string;
  items: ServiceItem[];
};

function isDueSoon(item: ServiceItem) {
  if (!item.dueDate || item.status === "done" || item.status === "archived") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${item.dueDate}T00:00:00`);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  return dueDate >= today && dueDate <= weekEnd;
}

export function ServiceBucketCard({ bucket, title, href, items }: ServiceBucketCardProps) {
  const activeItems = items.filter(
    (item) =>
      item.status !== "done" &&
      item.status !== "declined" &&
      item.status !== "archived"
  );
  const dueSoonItems = activeItems.filter(isDueSoon);
  const nextAction = activeItems.find((item) => item.nextAction)?.nextAction;

  return (
    <article className="service-bucket-card">
      <div>
        <p className="eyebrow">{serviceBucketLabels[bucket]}</p>
        <h3>{activeItems.length} active</h3>
        <p>{bucketDescriptions[bucket]}</p>
      </div>

      <div className="service-bucket-card__meta">
        <span>{dueSoonItems.length} due soon</span>
        <span>{items.length} total</span>
      </div>

      {nextAction ? (
        <p className="service-bucket-card__next">
          <strong>Next:</strong> {nextAction}
        </p>
      ) : null}

      {activeItems.length === 0 ? (
        <p className="service-bucket-card__empty">{bucketEmptyMessages[bucket]}</p>
      ) : null}

      <Link className="service-secondary-link" to={href}>
        Open {title}
      </Link>
    </article>
  );
}
