import { useState } from "react";
import {
  batchUploadUserTasks,
  listUserTasks,
  mergeTasksForSync,
  pushMergedUserTasks,
} from "../../../../shared/firebase/taskCloudService";
import {
  LAST_TASK_SYNC_AT_KEY,
  LAST_TASK_SYNC_ERROR_KEY,
  TASK_CLOUD_USER_ID_KEY,
  TASK_SYNC_ENABLED_KEY,
  formatTaskSyncDate,
} from "../../../../shared/firebase/taskSyncMetadata";
import { TASK_STORAGE_KEY, useTaskBridge } from "../../../../shared/hooks/useTaskBridge";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import { Button } from "../../../../shared/ui/Button";
import { SyncBackupGate } from "./SyncBackupGate";
import { SyncPanel } from "./SyncPanel";
import { useBackupAwareStatus } from "./syncTypes";
import type { SyncAction, SyncPanelProps } from "./syncTypes";

export function TaskSyncPanel({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  backupExportedAt,
}: SyncPanelProps) {
  const { tasks, setTasks } = useTaskBridge();
  const [taskSyncEnabled, setTaskSyncEnabled] = useLocalStorage<boolean>(
    TASK_SYNC_ENABLED_KEY,
    false,
  );
  const [lastTaskSyncAt, setLastTaskSyncAt] = useLocalStorage<string>(
    LAST_TASK_SYNC_AT_KEY,
    "",
  );
  const [lastTaskSyncError, setLastTaskSyncError] = useLocalStorage<string>(
    LAST_TASK_SYNC_ERROR_KEY,
    "",
  );
  const [taskCloudUserId, setTaskCloudUserId] = useLocalStorage<string>(
    TASK_CLOUD_USER_ID_KEY,
    "",
  );
  const [taskSyncStatus, setTaskSyncStatus] = useBackupAwareStatus({
    tone: "neutral",
    message: "Task cloud sync has not run in this session.",
  }, backupExportedAt, "Backup exported. Manual task sync controls are ready when you are.");
  const [taskSyncing, setTaskSyncing] = useState(false);
  const [cloudTaskCount, setCloudTaskCount] = useState<number | null>(null);

  const canUseTaskSync = Boolean(isConfigured && user && taskSyncEnabled);
  const taskSyncDisabled = !canUseTaskSync || taskSyncing || loading;

  function recordTaskSyncSuccess(message: string) {
    const now = new Date().toISOString();

    setLastTaskSyncAt(now);
    setLastTaskSyncError("");
    setTaskCloudUserId(user?.uid ?? "");
    setTaskSyncStatus({
      tone: "success",
      message,
    });
  }

  function recordTaskSyncError(error: unknown) {
    const message =
      error instanceof Error ? error.message : "Task cloud sync did not complete.";

    setLastTaskSyncError(message);
    setTaskSyncStatus({
      tone: "error",
      message,
    });
  }

  async function refreshCloudTaskCount() {
    if (!user || !isConfigured) {
      return;
    }

    setTaskSyncing(true);

    try {
      const cloudTasks = await listUserTasks(user.uid);
      setCloudTaskCount(cloudTasks.length);
      setTaskSyncStatus({
        tone: "success",
        message: `Cloud has ${cloudTasks.length} shared task docs.`,
      });
    } catch (error) {
      recordTaskSyncError(error);
    } finally {
      setTaskSyncing(false);
    }
  }

  async function runTaskSync(action: SyncAction) {
    if (!user || taskSyncDisabled) {
      return;
    }

    if (!backupConfirmed) {
      setTaskSyncStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first task cloud sync.",
      });
      return;
    }

    setTaskSyncing(true);

    try {
      const cloudTasks = await listUserTasks(user.uid);
      setCloudTaskCount(cloudTasks.length);

      if (action === "push") {
        const mergeResult = await pushMergedUserTasks(user.uid, tasks, cloudTasks);
        setTasks(mergeResult.tasks);
        setCloudTaskCount(mergeResult.tasks.length);
        recordTaskSyncSuccess(
          `Pushed ${mergeResult.tasks.length} merged tasks to cloud. Added ${mergeResult.addedCount}, deduped ${mergeResult.dedupedCount}.`,
        );
        return;
      }

      const mergeResult = mergeTasksForSync(tasks, cloudTasks);
      setTasks(mergeResult.tasks);

      if (action === "merge") {
        await batchUploadUserTasks(user.uid, mergeResult.tasks);
        setCloudTaskCount(mergeResult.tasks.length);
      }

      recordTaskSyncSuccess(
        action === "pull"
          ? `Pulled cloud tasks into local storage. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`
          : `Synced ${mergeResult.tasks.length} merged tasks both ways. Added ${mergeResult.addedCount}, deduped ${mergeResult.dedupedCount}.`,
      );
    } catch (error) {
      recordTaskSyncError(error);
    } finally {
      setTaskSyncing(false);
    }
  }

  return (
    <SyncPanel
      eyebrow="Shared Tasks"
      title="Manual task cloud sync"
      description="Only shared tasks use this path. Dashboard, Timer, Today Builder, and feature Add-to-Today flows still read local task state."
      statusLabel={taskSyncEnabled ? "Task sync enabled" : "Manual opt-in"}
    >
      <div className="settings-backup-summary">
        <span>{tasks.length} local tasks</span>
        <span>
          {cloudTaskCount === null ? "Cloud count not checked" : `${cloudTaskCount} cloud tasks`}
        </span>
        <span>
          {lastTaskSyncAt
            ? `Last sync ${formatTaskSyncDate(lastTaskSyncAt)}`
            : "No task sync yet"}
        </span>
      </div>

      <p className="settings-backup-status is-warning">
        Before first cloud push, clear old sample/demo data or confirm these
        are real records.
      </p>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable task cloud sync</strong>
          <small>
            This unlocks manual shared-task sync only. It does not sync
            Research, Teaching, Service, Timer, Mindspace, or planning data.
          </small>
        </span>
        <input
          type="checkbox"
          checked={taskSyncEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setTaskSyncEnabled(event.target.checked);
            setTaskCloudUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so task sync controls stay unavailable
          and localStorage mode continues.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before shared tasks can touch Firestore. Local
          tasks remain editable while signed out.
        </p>
      ) : null}

      {taskCloudUserId && user && taskCloudUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Task sync was last enabled for a different signed-in user. Review
          before merging local tasks with this account.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand this will merge local and cloud shared
        tasks without deleting missing local tasks.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          variant="soft"
          onClick={refreshCloudTaskCount}
          disabled={!isConfigured || !user || taskSyncing}
        >
          Check cloud count
        </Button>
        <Button
          type="button"
          onClick={() => runTaskSync("push")}
          disabled={taskSyncDisabled}
        >
          Push local tasks to cloud
        </Button>
        <Button
          type="button"
          variant="soft"
          onClick={() => runTaskSync("pull")}
          disabled={taskSyncDisabled}
        >
          Pull cloud tasks to local
        </Button>
        <Button
          type="button"
          onClick={() => runTaskSync("merge")}
          disabled={taskSyncDisabled}
        >
          Sync now / merge
        </Button>
      </div>

      <p className={`settings-backup-status is-${taskSyncStatus.tone}`}>
        {taskSyncStatus.message} Firestore path:{" "}
        <code>users/{"{uid}"}/tasks/{"{taskId}"}</code>
      </p>

      {lastTaskSyncError ? (
        <p className="settings-backup-status is-error">
          Last saved task sync error: {lastTaskSyncError}
        </p>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{TASK_SYNC_ENABLED_KEY}</code>,{" "}
        <code>{LAST_TASK_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_TASK_SYNC_ERROR_KEY}</code>,{" "}
        <code>{TASK_CLOUD_USER_ID_KEY}</code>. Task data remains in{" "}
        <code>{TASK_STORAGE_KEY}</code>.
      </p>
    </SyncPanel>
  );
}
