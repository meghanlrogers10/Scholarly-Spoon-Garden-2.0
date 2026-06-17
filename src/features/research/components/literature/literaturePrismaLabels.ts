import type { ResearchPrismaStatus } from "../../types";

export const prismaStatusLabels: Record<ResearchPrismaStatus, string> = {
  identified: "Identified",
  screened: "Screened",
  eligible: "Eligible",
  included: "Included",
  excluded: "Excluded",
};
