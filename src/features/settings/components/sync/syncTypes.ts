import type { User } from "firebase/auth";
import { useCallback, useState } from "react";

export type SyncAction = "push" | "pull" | "merge";

export type SyncStatusMessage =
  | { tone: "neutral"; message: string }
  | { tone: "success"; message: string }
  | { tone: "warning"; message: string }
  | { tone: "error"; message: string };

export type SyncPanelProps = {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  backupConfirmed: boolean;
  setBackupConfirmed: (checked: boolean) => void;
  onExportBackup: () => void;
  backupExportedAt: number;
};

export type SyncOverviewItem = {
  label: string;
  enabled: boolean;
  lastSyncAt: string;
  lastError: string;
};

export function useBackupAwareStatus(
  initialStatus: SyncStatusMessage,
  backupExportedAt: number,
  backupMessage: string,
) {
  const [status, setStatusState] = useState<SyncStatusMessage>(initialStatus);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(0);

  const setStatus = useCallback((nextStatus: SyncStatusMessage) => {
    setStatusUpdatedAt(Date.now());
    setStatusState(nextStatus);
  }, []);

  const displayStatus =
    backupExportedAt > statusUpdatedAt
      ? ({
          tone: "success",
          message: backupMessage,
        } satisfies SyncStatusMessage)
      : status;

  return [displayStatus, setStatus] as const;
}
