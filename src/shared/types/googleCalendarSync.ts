export type GoogleCalendarSyncDirection =
  | "read-only"
  | "write-only"
  | "two-way";

export type GoogleCalendarSyncStatus =
  | "not-connected"
  | "connected"
  | "syncing"
  | "error";

export type GoogleCalendarLinkedType =
  | "working-block"
  | "planned-task-block"
  | "research-deadline"
  | "teaching-deadline"
  | "service-deadline"
  | "timer-session"
  | "manual-work-log";

export type GoogleCalendarAccount = {
  id: string;
  provider: "google";
  displayName: string;
  email?: string;
  status: GoogleCalendarSyncStatus;
  connectedAt?: string;
  lastSyncAt?: string;
  lastSyncError?: string;
};

export type GoogleCalendarSource = {
  id: string;
  accountId: string;
  provider: "google";
  name: string;
  color?: string;
  isPrimary?: boolean;
  isSelected: boolean;
  canWrite?: boolean;
};

export type GoogleCalendarEvent = {
  id: string;
  provider: "google";
  externalId: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  description?: string;
  status?: string;
  updatedAt?: string;
  sourceUrl?: string;
  importedAsBusyOnly?: boolean;
  ssgLinkedType?: GoogleCalendarLinkedType;
  ssgLinkedId?: string;
};

export type GoogleCalendarSyncMapping = {
  id: string;
  externalCalendarId: string;
  externalEventId: string;
  ssgType: GoogleCalendarLinkedType;
  ssgId: string;
  lastSyncedAt: string;
  lastExternalUpdatedAt?: string;
  lastLocalUpdatedAt?: string;
  conflictStatus:
    | "none"
    | "local-newer"
    | "external-newer"
    | "both-changed"
    | "deleted-externally"
    | "deleted-locally";
};

export type GoogleCalendarSyncSettings = {
  enabled: boolean;
  syncDirection: GoogleCalendarSyncDirection;
  importExternalEvents: boolean;
  importAsBusyOnly: boolean;
  selectedExternalCalendarIds: string[];
  targetExternalCalendarId?: string;
  exportWorkingBlocks: boolean;
  exportPlannedTaskBlocks: boolean;
  exportTimerSessions: boolean;
  exportManualWorkLogs: boolean;
  exportResearchDeadlines: boolean;
  exportTeachingDeadlines: boolean;
  exportServiceDeadlines: boolean;
  lastSyncAt?: string;
  lastSyncError?: string;
};

export const defaultGoogleCalendarSyncSettings: GoogleCalendarSyncSettings = {
  enabled: false,
  syncDirection: "read-only",
  importExternalEvents: true,
  importAsBusyOnly: true,
  selectedExternalCalendarIds: [],
  targetExternalCalendarId: undefined,
  exportWorkingBlocks: false,
  exportPlannedTaskBlocks: false,
  exportTimerSessions: false,
  exportManualWorkLogs: false,
  exportResearchDeadlines: true,
  exportTeachingDeadlines: true,
  exportServiceDeadlines: true,
};
