import { useState } from "react";
import {
  MINDSPACE_GOALS_STORAGE_KEY,
  MINDSPACE_ITEMS_STORAGE_KEY,
} from "../../../../shared/constants/mindspaceStorage";
import {
  batchUploadUserMindspaceData,
  countUserMindspaceData,
  listUserMindspaceData,
  mergeMindspaceDataForSync,
  normalizeMindspaceGoals,
  normalizeMindspaceItems,
  pushMergedUserMindspaceData,
  type MindspaceCloudCounts,
} from "../../../../shared/firebase/mindspaceCloudService";
import {
  LAST_MINDSPACE_SYNC_AT_KEY,
  LAST_MINDSPACE_SYNC_ERROR_KEY,
  MINDSPACE_CLOUD_USER_ID_KEY,
  MINDSPACE_SYNC_ENABLED_KEY,
} from "../../../../shared/firebase/mindspaceSyncMetadata";
import { formatTaskSyncDate } from "../../../../shared/firebase/taskSyncMetadata";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import { Button } from "../../../../shared/ui/Button";
import { SyncBackupGate } from "./SyncBackupGate";
import { SyncPanel } from "./SyncPanel";
import { useBackupAwareStatus } from "./syncTypes";
import type { SyncAction, SyncPanelProps } from "./syncTypes";

export function MindspaceSyncPanel({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  backupExportedAt,
}: SyncPanelProps) {
  const [storedMindspaceItems, setStoredMindspaceItems] = useLocalStorage<
    unknown[]
  >(MINDSPACE_ITEMS_STORAGE_KEY, []);
  const [storedMindspaceGoals, setStoredMindspaceGoals] = useLocalStorage<
    unknown[]
  >(MINDSPACE_GOALS_STORAGE_KEY, []);
  const [mindspaceSyncEnabled, setMindspaceSyncEnabled] =
    useLocalStorage<boolean>(MINDSPACE_SYNC_ENABLED_KEY, false);
  const [lastMindspaceSyncAt, setLastMindspaceSyncAt] = useLocalStorage<string>(
    LAST_MINDSPACE_SYNC_AT_KEY,
    "",
  );
  const [lastMindspaceSyncError, setLastMindspaceSyncError] =
    useLocalStorage<string>(LAST_MINDSPACE_SYNC_ERROR_KEY, "");
  const [mindspaceCloudUserId, setMindspaceCloudUserId] =
    useLocalStorage<string>(MINDSPACE_CLOUD_USER_ID_KEY, "");
  const [mindspaceSyncStatus, setMindspaceSyncStatus] =
    useBackupAwareStatus({
      tone: "neutral",
      message: "Mindspace cloud sync has not run in this session.",
    }, backupExportedAt, "Backup exported. Manual Mindspace sync controls are ready when you are.");
  const [mindspaceSyncing, setMindspaceSyncing] = useState(false);
  const [cloudMindspaceCounts, setCloudMindspaceCounts] =
    useState<MindspaceCloudCounts | null>(null);

  const canUseMindspaceSync = Boolean(
    isConfigured && user && mindspaceSyncEnabled,
  );
  const mindspaceSyncDisabled =
    !canUseMindspaceSync || mindspaceSyncing || loading;
  const localMindspaceSnapshot = {
    items: normalizeMindspaceItems(storedMindspaceItems),
    goals: normalizeMindspaceGoals(storedMindspaceGoals),
  };

  function recordMindspaceSyncSuccess(message: string) {
    const now = new Date().toISOString();

    setLastMindspaceSyncAt(now);
    setLastMindspaceSyncError("");
    setMindspaceCloudUserId(user?.uid ?? "");
    setMindspaceSyncStatus({
      tone: "success",
      message,
    });
  }

  function recordMindspaceSyncError(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Mindspace cloud sync did not complete.";

    setLastMindspaceSyncError(message);
    setMindspaceSyncStatus({
      tone: "error",
      message,
    });
  }

  function saveLocalMindspaceSnapshot(snapshot: typeof localMindspaceSnapshot) {
    setStoredMindspaceItems(snapshot.items);
    setStoredMindspaceGoals(snapshot.goals);
  }

  async function refreshCloudMindspaceCount() {
    if (!user || !isConfigured) {
      return;
    }

    setMindspaceSyncing(true);

    try {
      const counts = await countUserMindspaceData(user.uid);
      setCloudMindspaceCounts(counts);
      setMindspaceSyncStatus({
        tone: "success",
        message: `Cloud has ${counts.items} Mindspace items and ${counts.goals} goals.`,
      });
    } catch (error) {
      recordMindspaceSyncError(error);
    } finally {
      setMindspaceSyncing(false);
    }
  }

  async function runMindspaceSync(action: SyncAction) {
    if (!user || mindspaceSyncDisabled) {
      return;
    }

    if (!backupConfirmed) {
      setMindspaceSyncStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first Mindspace sync.",
      });
      return;
    }

    setMindspaceSyncing(true);

    try {
      const cloudSnapshot = await listUserMindspaceData(user.uid);
      setCloudMindspaceCounts({
        items: cloudSnapshot.items.length,
        goals: cloudSnapshot.goals.length,
      });

      if (action === "push") {
        const mergeResult = await pushMergedUserMindspaceData(
          user.uid,
          localMindspaceSnapshot,
          cloudSnapshot,
        );
        saveLocalMindspaceSnapshot(mergeResult);
        setCloudMindspaceCounts({
          items: mergeResult.items.length,
          goals: mergeResult.goals.length,
        });
        recordMindspaceSyncSuccess(
          `Pushed merged Mindspace data to cloud. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
        );
        return;
      }

      const mergeResult = mergeMindspaceDataForSync(
        localMindspaceSnapshot,
        cloudSnapshot,
      );
      saveLocalMindspaceSnapshot(mergeResult);

      if (action === "merge") {
        await batchUploadUserMindspaceData(user.uid, mergeResult);
        setCloudMindspaceCounts({
          items: mergeResult.items.length,
          goals: mergeResult.goals.length,
        });
      }

      recordMindspaceSyncSuccess(
        action === "pull"
          ? `Pulled cloud Mindspace data into local storage. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`
          : `Synced Mindspace data both ways. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
      );
    } catch (error) {
      recordMindspaceSyncError(error);
    } finally {
      setMindspaceSyncing(false);
    }
  }

  return (
    <SyncPanel
      eyebrow="Mindspace"
      title="Manual Mindspace cloud sync"
      description="Only Mindspace items and goals use this path. Brain Dump, Clarify Later, release, and convert-to-task flows still write localStorage first."
      statusLabel={mindspaceSyncEnabled ? "Mindspace sync enabled" : "Manual opt-in"}
    >
      <div className="settings-backup-summary">
        <span>{localMindspaceSnapshot.items.length} local items</span>
        <span>{localMindspaceSnapshot.goals.length} local goals</span>
        <span>
          {cloudMindspaceCounts
            ? `${cloudMindspaceCounts.items}/${cloudMindspaceCounts.goals} cloud`
            : "Cloud count not checked"}
        </span>
        <span>
          {lastMindspaceSyncAt
            ? `Last sync ${formatTaskSyncDate(lastMindspaceSyncAt)}`
            : "No Mindspace sync yet"}
        </span>
      </div>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable Mindspace cloud sync</strong>
          <small>
            This unlocks manual Mindspace sync only. It does not sync Service,
            Teaching, Research, Timer, Dashboard planning, or all app data.
          </small>
        </span>
        <input
          type="checkbox"
          checked={mindspaceSyncEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setMindspaceSyncEnabled(event.target.checked);
            setMindspaceCloudUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so Mindspace sync controls stay
          unavailable and local Mindspace mode continues.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before Mindspace items or goals can touch
          Firestore. Local Mindspace still works while signed out.
        </p>
      ) : null}

      {mindspaceCloudUserId && user && mindspaceCloudUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Mindspace sync was last enabled for a different signed-in user.
          Review before merging local Mindspace data with this account.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand this will merge local and cloud
        Mindspace data without deleting missing local records.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          variant="soft"
          onClick={refreshCloudMindspaceCount}
          disabled={!isConfigured || !user || mindspaceSyncing}
        >
          Check cloud Mindspace count
        </Button>
        <Button
          type="button"
          onClick={() => runMindspaceSync("push")}
          disabled={mindspaceSyncDisabled}
        >
          Push local Mindspace to cloud
        </Button>
        <Button
          type="button"
          variant="soft"
          onClick={() => runMindspaceSync("pull")}
          disabled={mindspaceSyncDisabled}
        >
          Pull cloud Mindspace to local
        </Button>
        <Button
          type="button"
          onClick={() => runMindspaceSync("merge")}
          disabled={mindspaceSyncDisabled}
        >
          Sync Mindspace now / merge
        </Button>
      </div>

      <p className={`settings-backup-status is-${mindspaceSyncStatus.tone}`}>
        {mindspaceSyncStatus.message} Firestore paths:{" "}
        <code>users/{"{uid}"}/mindspaceItems/{"{itemId}"}</code>,{" "}
        <code>users/{"{uid}"}/mindspaceGoals/{"{goalId}"}</code>.
      </p>

      {lastMindspaceSyncError ? (
        <p className="settings-backup-status is-error">
          Last saved Mindspace sync error: {lastMindspaceSyncError}
        </p>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{MINDSPACE_SYNC_ENABLED_KEY}</code>,{" "}
        <code>{LAST_MINDSPACE_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_MINDSPACE_SYNC_ERROR_KEY}</code>,{" "}
        <code>{MINDSPACE_CLOUD_USER_ID_KEY}</code>. Local data remains in{" "}
        <code>{MINDSPACE_ITEMS_STORAGE_KEY}</code> and{" "}
        <code>{MINDSPACE_GOALS_STORAGE_KEY}</code>.
      </p>

      <p className="muted-text">
        Pull and merge preserve local ids where records match, so existing
        task conversion references and goal parent links keep pointing at the
        same local records.
      </p>
    </SyncPanel>
  );
}
