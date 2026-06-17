import { useState } from "react";
import {
  MANUAL_WORK_LOGS_STORAGE_KEY,
  TIMER_SESSIONS_STORAGE_KEY,
} from "../../../../shared/constants/timerStorage";
import {
  batchUploadUserTimerData,
  countUserTimerData,
  listUserTimerData,
  mergeTimerDataForSync,
  pushMergedUserTimerData,
  type TimerCloudCounts,
} from "../../../../shared/firebase/timerCloudService";
import {
  LAST_TIMER_SYNC_AT_KEY,
  LAST_TIMER_SYNC_ERROR_KEY,
  TIMER_CLOUD_USER_ID_KEY,
  TIMER_SYNC_ENABLED_KEY,
} from "../../../../shared/firebase/timerSyncMetadata";
import { formatTaskSyncDate } from "../../../../shared/firebase/taskSyncMetadata";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import type { TimerSession } from "../../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../../shared/types/workLog";
import { Button } from "../../../../shared/ui/Button";
import { SyncBackupGate } from "./SyncBackupGate";
import { SyncPanel } from "./SyncPanel";
import { useBackupAwareStatus } from "./syncTypes";
import type { SyncAction, SyncPanelProps } from "./syncTypes";

export function TimerSyncPanel({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  backupExportedAt,
}: SyncPanelProps) {
  const [timerSessions, setTimerSessions] = useLocalStorage<TimerSession[]>(
    TIMER_SESSIONS_STORAGE_KEY,
    [],
  );
  const [manualWorkLogs, setManualWorkLogs] = useLocalStorage<
    ManualWorkLogEntry[]
  >(MANUAL_WORK_LOGS_STORAGE_KEY, []);
  const [timerSyncEnabled, setTimerSyncEnabled] = useLocalStorage<boolean>(
    TIMER_SYNC_ENABLED_KEY,
    false,
  );
  const [lastTimerSyncAt, setLastTimerSyncAt] = useLocalStorage<string>(
    LAST_TIMER_SYNC_AT_KEY,
    "",
  );
  const [lastTimerSyncError, setLastTimerSyncError] = useLocalStorage<string>(
    LAST_TIMER_SYNC_ERROR_KEY,
    "",
  );
  const [timerCloudUserId, setTimerCloudUserId] = useLocalStorage<string>(
    TIMER_CLOUD_USER_ID_KEY,
    "",
  );
  const [timerSyncStatus, setTimerSyncStatus] = useBackupAwareStatus({
    tone: "neutral",
    message: "Timer cloud sync has not run in this session.",
  }, backupExportedAt, "Backup exported. Manual timer sync controls are ready when you are.");
  const [timerSyncing, setTimerSyncing] = useState(false);
  const [cloudTimerCounts, setCloudTimerCounts] =
    useState<TimerCloudCounts | null>(null);

  const canUseTimerSync = Boolean(isConfigured && user && timerSyncEnabled);
  const timerSyncDisabled = !canUseTimerSync || timerSyncing || loading;
  const localTimerSnapshot = {
    timerSessions,
    manualWorkLogs,
  };

  function recordTimerSyncSuccess(message: string) {
    const now = new Date().toISOString();

    setLastTimerSyncAt(now);
    setLastTimerSyncError("");
    setTimerCloudUserId(user?.uid ?? "");
    setTimerSyncStatus({
      tone: "success",
      message,
    });
  }

  function recordTimerSyncError(error: unknown) {
    const message =
      error instanceof Error ? error.message : "Timer cloud sync did not complete.";

    setLastTimerSyncError(message);
    setTimerSyncStatus({
      tone: "error",
      message,
    });
  }

  function saveLocalTimerSnapshot(snapshot: typeof localTimerSnapshot) {
    setTimerSessions(snapshot.timerSessions);
    setManualWorkLogs(snapshot.manualWorkLogs);
  }

  async function refreshCloudTimerCount() {
    if (!user || !isConfigured) {
      return;
    }

    setTimerSyncing(true);

    try {
      const counts = await countUserTimerData(user.uid);
      setCloudTimerCounts(counts);
      setTimerSyncStatus({
        tone: "success",
        message: `Cloud has ${counts.timerSessions} timer sessions and ${counts.manualWorkLogs} manual work logs.`,
      });
    } catch (error) {
      recordTimerSyncError(error);
    } finally {
      setTimerSyncing(false);
    }
  }

  async function runTimerSync(action: SyncAction) {
    if (!user || timerSyncDisabled) {
      return;
    }

    if (!backupConfirmed) {
      setTimerSyncStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first timer sync.",
      });
      return;
    }

    setTimerSyncing(true);

    try {
      const cloudSnapshot = await listUserTimerData(user.uid);
      setCloudTimerCounts({
        timerSessions: cloudSnapshot.timerSessions.length,
        manualWorkLogs: cloudSnapshot.manualWorkLogs.length,
      });

      if (action === "push") {
        const mergeResult = await pushMergedUserTimerData(
          user.uid,
          localTimerSnapshot,
          cloudSnapshot,
        );
        saveLocalTimerSnapshot(mergeResult);
        setCloudTimerCounts({
          timerSessions: mergeResult.timerSessions.length,
          manualWorkLogs: mergeResult.manualWorkLogs.length,
        });
        recordTimerSyncSuccess(
          `Pushed merged timer data to cloud. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
        );
        return;
      }

      const mergeResult = mergeTimerDataForSync(
        localTimerSnapshot,
        cloudSnapshot,
      );
      saveLocalTimerSnapshot(mergeResult);

      if (action === "merge") {
        await batchUploadUserTimerData(user.uid, mergeResult);
        setCloudTimerCounts({
          timerSessions: mergeResult.timerSessions.length,
          manualWorkLogs: mergeResult.manualWorkLogs.length,
        });
      }

      recordTimerSyncSuccess(
        action === "pull"
          ? `Pulled cloud timer data into local storage. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`
          : `Synced timer data both ways. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
      );
    } catch (error) {
      recordTimerSyncError(error);
    } finally {
      setTimerSyncing(false);
    }
  }

  return (
    <SyncPanel
      eyebrow="Timer / Work Logs"
      title="Manual timer cloud sync"
      description="Only completed timer sessions and manual work logs use this path. Active timer state stays local."
      statusLabel={timerSyncEnabled ? "Timer sync enabled" : "Manual opt-in"}
    >
      <div className="settings-backup-summary">
        <span>{timerSessions.length} local timer sessions</span>
        <span>{manualWorkLogs.length} local manual logs</span>
        <span>
          {cloudTimerCounts
            ? `${cloudTimerCounts.timerSessions}/${cloudTimerCounts.manualWorkLogs} cloud`
            : "Cloud count not checked"}
        </span>
        <span>
          {lastTimerSyncAt
            ? `Last sync ${formatTaskSyncDate(lastTimerSyncAt)}`
            : "No timer sync yet"}
        </span>
      </div>

      <p className="settings-backup-status is-warning">
        Before first cloud push, clear old sample/demo data or confirm these
        are real records.
      </p>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable timer cloud sync</strong>
          <small>
            This unlocks manual timer/work-log sync only. It does not sync
            active timer state, Mindspace, Service, Teaching, Research, or all
            app data.
          </small>
        </span>
        <input
          type="checkbox"
          checked={timerSyncEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setTimerSyncEnabled(event.target.checked);
            setTimerCloudUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so timer sync controls stay unavailable
          and local timer/work-log mode continues.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before timer sessions or manual work logs can
          touch Firestore. Local logs still work while signed out.
        </p>
      ) : null}

      {timerCloudUserId && user && timerCloudUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Timer sync was last enabled for a different signed-in user. Review
          before merging local timer data with this account.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand this will merge local and cloud timer
        data without deleting missing local records.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          variant="soft"
          onClick={refreshCloudTimerCount}
          disabled={!isConfigured || !user || timerSyncing}
        >
          Check cloud timer/manual count
        </Button>
        <Button
          type="button"
          onClick={() => runTimerSync("push")}
          disabled={timerSyncDisabled}
        >
          Push local timer/manual logs to cloud
        </Button>
        <Button
          type="button"
          variant="soft"
          onClick={() => runTimerSync("pull")}
          disabled={timerSyncDisabled}
        >
          Pull cloud timer/manual logs to local
        </Button>
        <Button
          type="button"
          onClick={() => runTimerSync("merge")}
          disabled={timerSyncDisabled}
        >
          Sync timer logs now / merge
        </Button>
      </div>

      <p className={`settings-backup-status is-${timerSyncStatus.tone}`}>
        {timerSyncStatus.message} Firestore paths:{" "}
        <code>users/{"{uid}"}/timerSessions/{"{sessionId}"}</code>,{" "}
        <code>users/{"{uid}"}/manualWorkLogs/{"{logId}"}</code>.
      </p>

      {lastTimerSyncError ? (
        <p className="settings-backup-status is-error">
          Last saved timer sync error: {lastTimerSyncError}
        </p>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{TIMER_SYNC_ENABLED_KEY}</code>,{" "}
        <code>{LAST_TIMER_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_TIMER_SYNC_ERROR_KEY}</code>,{" "}
        <code>{TIMER_CLOUD_USER_ID_KEY}</code>. Local data remains in{" "}
        <code>{TIMER_SESSIONS_STORAGE_KEY}</code> and{" "}
        <code>{MANUAL_WORK_LOGS_STORAGE_KEY}</code>; active timer state remains in{" "}
        <code>ssg2.activeTimer</code> only.
      </p>

      <p className="muted-text">
        Pull and merge write the merged log arrays directly. They do not replay
        timer completion or manual-log creation handlers, so linked task actual
        totals are not incremented a second time during sync.
      </p>
    </SyncPanel>
  );
}
