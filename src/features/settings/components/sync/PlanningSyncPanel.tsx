import { useState } from "react";
import {
  batchUploadUserPlanningData,
  countUserPlanningData,
  listUserPlanningData,
  pushMergedUserPlanningData,
  type PlanningCloudCounts,
} from "../../../../shared/firebase/planningCloudService";
import {
  LAST_PLANNING_SYNC_AT_KEY,
  LAST_PLANNING_SYNC_ERROR_KEY,
  PLANNING_CLOUD_USER_ID_KEY,
  PLANNING_SYNC_ENABLED_KEY,
} from "../../../../shared/firebase/planningSyncMetadata";
import { formatTaskSyncDate } from "../../../../shared/firebase/taskSyncMetadata";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import { Button } from "../../../../shared/ui/Button";
import {
  DAILY_CHECK_IN_STORAGE_KEY,
  END_OF_DAY_REVIEW_STORAGE_KEY,
  getPlanningCounts,
  mergePlanningForSync,
  normalizeDailyCheckIns,
  normalizeEndOfDayReviews,
  normalizePlannedTaskBlocks,
  PLANNED_TASK_BLOCK_STORAGE_KEY,
} from "../../../dashboard/utils/planningStorage";
import { SyncBackupGate } from "./SyncBackupGate";
import { SyncPanel } from "./SyncPanel";
import { useBackupAwareStatus } from "./syncTypes";
import type { SyncAction, SyncPanelProps } from "./syncTypes";

export function PlanningSyncPanel({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  backupExportedAt,
}: SyncPanelProps) {
  const [storedCheckIns, setStoredCheckIns] = useLocalStorage<unknown[]>(
    DAILY_CHECK_IN_STORAGE_KEY,
    [],
  );
  const [storedPlannedBlocks, setStoredPlannedBlocks] = useLocalStorage<unknown[]>(
    PLANNED_TASK_BLOCK_STORAGE_KEY,
    [],
  );
  const [storedReviews, setStoredReviews] = useLocalStorage<unknown[]>(
    END_OF_DAY_REVIEW_STORAGE_KEY,
    [],
  );
  const [planningSyncEnabled, setPlanningSyncEnabled] = useLocalStorage<boolean>(
    PLANNING_SYNC_ENABLED_KEY,
    false,
  );
  const [lastPlanningSyncAt, setLastPlanningSyncAt] = useLocalStorage<string>(
    LAST_PLANNING_SYNC_AT_KEY,
    "",
  );
  const [lastPlanningSyncError, setLastPlanningSyncError] = useLocalStorage<string>(
    LAST_PLANNING_SYNC_ERROR_KEY,
    "",
  );
  const [planningCloudUserId, setPlanningCloudUserId] = useLocalStorage<string>(
    PLANNING_CLOUD_USER_ID_KEY,
    "",
  );
  const [planningSyncStatus, setPlanningSyncStatus] =
    useBackupAwareStatus({
      tone: "neutral",
      message: "Planning cloud sync has not run in this session.",
    }, backupExportedAt, "Backup exported. Manual planning sync controls are ready when you are.");
  const [planningSyncing, setPlanningSyncing] = useState(false);
  const [cloudPlanningCounts, setCloudPlanningCounts] =
    useState<PlanningCloudCounts | null>(null);

  const canUsePlanningSync = Boolean(isConfigured && user && planningSyncEnabled);
  const planningSyncDisabled =
    !canUsePlanningSync || planningSyncing || loading;
  const localPlanningSnapshot = {
    checkIns: normalizeDailyCheckIns(storedCheckIns),
    plannedBlocks: normalizePlannedTaskBlocks(storedPlannedBlocks),
    reviews: normalizeEndOfDayReviews(storedReviews),
  };
  const localPlanningCounts = getPlanningCounts(localPlanningSnapshot);

  function recordPlanningSyncSuccess(message: string) {
    const now = new Date().toISOString();

    setLastPlanningSyncAt(now);
    setLastPlanningSyncError("");
    setPlanningCloudUserId(user?.uid ?? "");
    setPlanningSyncStatus({
      tone: "success",
      message,
    });
  }

  function recordPlanningSyncError(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Planning cloud sync did not complete.";

    setLastPlanningSyncError(message);
    setPlanningSyncStatus({
      tone: "error",
      message,
    });
  }

  function saveLocalPlanningSnapshot(snapshot: typeof localPlanningSnapshot) {
    setStoredCheckIns(snapshot.checkIns);
    setStoredPlannedBlocks(snapshot.plannedBlocks);
    setStoredReviews(snapshot.reviews);
  }

  async function refreshCloudPlanningCount() {
    if (!user || !isConfigured) {
      return;
    }

    setPlanningSyncing(true);

    try {
      const counts = await countUserPlanningData(user.uid);
      setCloudPlanningCounts(counts);
      setPlanningSyncStatus({
        tone: "success",
        message: `Cloud has ${counts.dailyCheckIns} check-ins, ${counts.workingBlocks} working blocks, ${counts.plannedTaskBlocks} planned blocks, and ${counts.endOfDayReviews} reviews.`,
      });
    } catch (error) {
      recordPlanningSyncError(error);
    } finally {
      setPlanningSyncing(false);
    }
  }

  async function runPlanningSync(action: SyncAction) {
    if (!user || planningSyncDisabled) {
      return;
    }

    if (!backupConfirmed) {
      setPlanningSyncStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first planning sync.",
      });
      return;
    }

    setPlanningSyncing(true);

    try {
      const cloudSnapshot = await listUserPlanningData(user.uid);
      setCloudPlanningCounts({
        dailyCheckIns: cloudSnapshot.checkIns.length,
        workingBlocks: cloudSnapshot.workingBlocks.length,
        plannedTaskBlocks: cloudSnapshot.plannedBlocks.length,
        endOfDayReviews: cloudSnapshot.reviews.length,
      });

      if (action === "push") {
        const mergeResult = await pushMergedUserPlanningData(
          user.uid,
          localPlanningSnapshot,
          cloudSnapshot,
        );
        saveLocalPlanningSnapshot(mergeResult);
        setCloudPlanningCounts({
          dailyCheckIns: mergeResult.checkIns.length,
          workingBlocks: getPlanningCounts(mergeResult).workingBlocks,
          plannedTaskBlocks: mergeResult.plannedBlocks.length,
          endOfDayReviews: mergeResult.reviews.length,
        });
        recordPlanningSyncSuccess(
          `Pushed merged planning data to cloud. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
        );
        return;
      }

      const mergeResult = mergePlanningForSync(
        localPlanningSnapshot,
        cloudSnapshot,
      );
      saveLocalPlanningSnapshot(mergeResult);

      if (action === "merge") {
        await batchUploadUserPlanningData(user.uid, mergeResult);
        setCloudPlanningCounts({
          dailyCheckIns: mergeResult.checkIns.length,
          workingBlocks: getPlanningCounts(mergeResult).workingBlocks,
          plannedTaskBlocks: mergeResult.plannedBlocks.length,
          endOfDayReviews: mergeResult.reviews.length,
        });
      }

      recordPlanningSyncSuccess(
        action === "pull"
          ? `Pulled cloud planning data into local storage. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`
          : `Synced planning data both ways. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
      );
    } catch (error) {
      recordPlanningSyncError(error);
    } finally {
      setPlanningSyncing(false);
    }
  }

  return (
    <SyncPanel
      eyebrow="Dashboard Planning"
      title="Manual planning cloud sync"
      description="Only daily check-ins, working blocks, planned task blocks, and shutdown reviews use this path. Dashboard still reads and writes localStorage first."
      statusLabel={planningSyncEnabled ? "Planning sync enabled" : "Manual opt-in"}
    >
      <div className="settings-backup-summary">
        <span>{localPlanningCounts.checkIns} local check-ins</span>
        <span>{localPlanningCounts.workingBlocks} local working blocks</span>
        <span>{localPlanningCounts.plannedBlocks} local planned blocks</span>
        <span>{localPlanningCounts.reviews} local reviews</span>
        <span>
          {cloudPlanningCounts
            ? `${cloudPlanningCounts.dailyCheckIns}/${cloudPlanningCounts.workingBlocks}/${cloudPlanningCounts.plannedTaskBlocks}/${cloudPlanningCounts.endOfDayReviews} cloud`
            : "Cloud count not checked"}
        </span>
        <span>
          {lastPlanningSyncAt
            ? `Last sync ${formatTaskSyncDate(lastPlanningSyncAt)}`
            : "No planning sync yet"}
        </span>
      </div>

      <p className="settings-backup-status is-warning">
        Before first cloud push, clear old sample/demo data or confirm these
        are real records.
      </p>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable planning cloud sync</strong>
          <small>
            This unlocks manual Dashboard planning sync only. It does not sync
            Timer, Mindspace, Service, Teaching, Research, or all app data.
          </small>
        </span>
        <input
          type="checkbox"
          checked={planningSyncEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setPlanningSyncEnabled(event.target.checked);
            setPlanningCloudUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so planning sync controls stay unavailable
          and localStorage mode continues.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before Dashboard planning data can touch
          Firestore. Local planning still works while signed out.
        </p>
      ) : null}

      {planningCloudUserId && user && planningCloudUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Planning sync was last enabled for a different signed-in user. Review
          before merging local planning data with this account.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand this will merge local and cloud
        planning data without deleting missing local records.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          variant="soft"
          onClick={refreshCloudPlanningCount}
          disabled={!isConfigured || !user || planningSyncing}
        >
          Check cloud planning count
        </Button>
        <Button
          type="button"
          onClick={() => runPlanningSync("push")}
          disabled={planningSyncDisabled}
        >
          Push local planning to cloud
        </Button>
        <Button
          type="button"
          variant="soft"
          onClick={() => runPlanningSync("pull")}
          disabled={planningSyncDisabled}
        >
          Pull cloud planning to local
        </Button>
        <Button
          type="button"
          onClick={() => runPlanningSync("merge")}
          disabled={planningSyncDisabled}
        >
          Sync planning now / merge
        </Button>
      </div>

      <p className={`settings-backup-status is-${planningSyncStatus.tone}`}>
        {planningSyncStatus.message} Firestore paths:{" "}
        <code>users/{"{uid}"}/dailyCheckIns/{"{dateOrId}"}</code>,{" "}
        <code>users/{"{uid}"}/workingBlocks/{"{blockId}"}</code>,{" "}
        <code>users/{"{uid}"}/plannedTaskBlocks/{"{blockId}"}</code>,{" "}
        <code>users/{"{uid}"}/endOfDayReviews/{"{dateOrId}"}</code>.
      </p>

      {lastPlanningSyncError ? (
        <p className="settings-backup-status is-error">
          Last saved planning sync error: {lastPlanningSyncError}
        </p>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{PLANNING_SYNC_ENABLED_KEY}</code>,{" "}
        <code>{LAST_PLANNING_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_PLANNING_SYNC_ERROR_KEY}</code>,{" "}
        <code>{PLANNING_CLOUD_USER_ID_KEY}</code>. Local data remains in{" "}
        <code>{DAILY_CHECK_IN_STORAGE_KEY}</code>,{" "}
        <code>{PLANNED_TASK_BLOCK_STORAGE_KEY}</code>, and{" "}
        <code>{END_OF_DAY_REVIEW_STORAGE_KEY}</code>.
      </p>
    </SyncPanel>
  );
}
