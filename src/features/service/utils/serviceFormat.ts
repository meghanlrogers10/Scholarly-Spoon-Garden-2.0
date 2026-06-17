import type {
  ReviewLetterStatus,
  ReviewLetterType,
  ServiceAdminStatus,
  ServiceAdminType,
  ServiceBoundaryStatus,
  ServiceBucket,
  ServiceStatus,
} from "../types";

export const serviceBucketLabels: Record<ServiceBucket, string> = {
  committee: "Committees",
  "review-letter": "Reviews & Letters",
  advising: "Advising",
  "admin-other": "Admin / Other",
};

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  inbox: "Inbox",
  requested: "Requested",
  accepted: "Accepted",
  "in-progress": "In progress",
  "waiting-on-me": "Waiting on me",
  "waiting-on-others": "Waiting on others",
  done: "Done",
  declined: "Declined",
  archived: "Archived",
};

export const reviewLetterTypeLabels: Record<ReviewLetterType, string> = {
  "peer-review": "Peer review",
  "tenure-promotion-letter": "Tenure / promotion letter",
  "recommendation-letter": "Recommendation letter",
  "manuscript-review": "Manuscript review",
  "grant-review": "Grant review",
  other: "Other",
};

export const reviewLetterStatusLabels: Record<ReviewLetterStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  waiting: "Waiting",
  submitted: "Submitted",
  declined: "Declined",
  archived: "Archived",
};

export const serviceAdminTypeLabels: Record<ServiceAdminType, string> = {
  "admin-task": "Admin task",
  form: "Form",
  "meeting-follow-up": "Meeting follow-up",
  report: "Report",
  email: "Email",
  policy: "Policy",
  event: "Event",
  other: "Other",
};

export const serviceAdminStatusLabels: Record<ServiceAdminStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  waiting: "Waiting",
  done: "Done",
  archived: "Archived",
};

export const serviceBoundaryStatusLabels: Record<ServiceBoundaryStatus, string> = {
  "active-lesson": "Active lesson",
  "archived-lesson": "Archived lesson",
};

export function formatServiceDate(dateString?: string, fallback = "Not set") {
  if (!dateString) {
    return fallback;
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (!Number.isFinite(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getServiceDateState(dateString?: string) {
  if (!dateString) {
    return "none";
  }

  const dueDate = new Date(`${dateString}T00:00:00`);

  if (!Number.isFinite(dueDate.getTime())) {
    return "none";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  if (dueDate < today) {
    return "overdue";
  }

  if (dueDate <= sevenDaysFromNow) {
    return "due-soon";
  }

  return "none";
}
