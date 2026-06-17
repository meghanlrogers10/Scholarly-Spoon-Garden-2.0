export type SyncStatus =
  | "local-only"
  | "signed-out"
  | "signed-in-not-synced"
  | "sync-ready"
  | "syncing"
  | "synced"
  | "error";

export const syncStatusLabels: Record<SyncStatus, string> = {
  "local-only": "Local-only",
  "signed-out": "Signed out",
  "signed-in-not-synced": "Signed in, not synced",
  "sync-ready": "Ready to test",
  syncing: "Testing connection",
  synced: "Cloud test passed",
  error: "Cloud test needs attention",
};

export function getSyncStatusDescription(status: SyncStatus) {
  switch (status) {
    case "local-only":
      return "Firebase is not configured, so SSG is staying fully local.";
    case "signed-out":
      return "Local mode still works. Sign in only when you are ready to test cloud setup.";
    case "signed-in-not-synced":
      return "You are signed in, but feature data is still local until sync is built and enabled.";
    case "sync-ready":
      return "Backup first, then use the connection test before any future sync work.";
    case "syncing":
      return "Writing and reading one tiny user-scoped profile document.";
    case "synced":
      return "The test document round-tripped. Full feature sync is still off.";
    case "error":
      return "The app stayed local, but the cloud connection test did not complete.";
  }
}
