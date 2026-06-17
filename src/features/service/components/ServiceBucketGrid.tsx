import type { Committee, ServiceItem } from "../types";
import { ServiceBucketCard } from "./ServiceBucketCard";

type ServiceBucketGridProps = {
  serviceItems: ServiceItem[];
  activeCommittees: Committee[];
  activeAdvisingStudentCount: number;
  reviewLetterItems?: ServiceItem[];
  adminOtherItems?: ServiceItem[];
};

export function ServiceBucketGrid({
  serviceItems,
  activeCommittees,
  activeAdvisingStudentCount,
  reviewLetterItems = serviceItems.filter((item) => item.bucket === "review-letter"),
  adminOtherItems = serviceItems.filter((item) => item.bucket === "admin-other"),
}: ServiceBucketGridProps) {
  const firstCommitteeHref = activeCommittees[0]
    ? `/service/committees/${activeCommittees[0].id}`
    : "/service";

  const advisingItems = serviceItems.filter((item) => item.bucket === "advising");
  const advisingSyntheticItems =
    advisingItems.length > 0 || activeAdvisingStudentCount === 0
      ? advisingItems
      : [
          {
            id: "advising-students-summary",
            title: "Active advising students",
            bucket: "advising" as const,
            status: "accepted" as const,
            nextAction: `${activeAdvisingStudentCount} students need goal and milestone tracking.`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

  return (
    <section className="service-panel">
      <div className="service-section-header">
        <div>
          <p className="eyebrow">Buckets</p>
          <h2>Where the labor lives</h2>
          <p>Keep service contained instead of letting it leak into everything.</p>
        </div>
      </div>

      <div className="service-card-grid">
        <ServiceBucketCard
          bucket="committee"
          title="Committees"
          href={firstCommitteeHref}
          items={serviceItems.filter((item) => item.bucket === "committee")}
        />
        <ServiceBucketCard
          bucket="review-letter"
          title="Reviews & Letters"
          href="/service/reviews"
          items={reviewLetterItems}
        />
        <ServiceBucketCard
          bucket="advising"
          title="Advising"
          href="/service/advising"
          items={advisingSyntheticItems}
        />
        <ServiceBucketCard
          bucket="admin-other"
          title="Admin / Other"
          href="/service/admin"
          items={adminOtherItems}
        />
      </div>
    </section>
  );
}
