import { useState } from "react";
import {
  ADVISING_STUDENTS_STORAGE_KEY,
  SERVICE_ADMIN_ITEMS_STORAGE_KEY,
  SERVICE_BOUNDARY_LESSONS_STORAGE_KEY,
  SERVICE_COMMITTEES_STORAGE_KEY,
  SERVICE_ITEMS_STORAGE_KEY,
  SERVICE_REVIEW_LETTERS_STORAGE_KEY,
} from "../../../../shared/constants/serviceStorage";
import {
  batchUploadUserServiceData,
  countUserServiceData,
  getServiceCounts,
  listUserServiceData,
  mergeServiceDataForSync,
  normalizeAdvisingStudents,
  normalizeReviewLetters,
  normalizeServiceAdminItems,
  normalizeServiceBoundaryLessons,
  normalizeServiceCommittees,
  normalizeServiceItems,
  pushMergedUserServiceData,
  type ServiceCloudCounts,
} from "../../../../shared/firebase/serviceCloudService";
import {
  LAST_SERVICE_SYNC_AT_KEY,
  LAST_SERVICE_SYNC_ERROR_KEY,
  SERVICE_CLOUD_USER_ID_KEY,
  SERVICE_SYNC_ENABLED_KEY,
} from "../../../../shared/firebase/serviceSyncMetadata";
import { formatTaskSyncDate } from "../../../../shared/firebase/taskSyncMetadata";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import { Button } from "../../../../shared/ui/Button";
import { SyncBackupGate } from "./SyncBackupGate";
import { SyncPanel } from "./SyncPanel";
import { useBackupAwareStatus } from "./syncTypes";
import type { SyncAction, SyncPanelProps } from "./syncTypes";

export function ServiceSyncPanel({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  backupExportedAt,
}: SyncPanelProps) {
  const [storedServiceItems, setStoredServiceItems] = useLocalStorage<unknown[]>(
    SERVICE_ITEMS_STORAGE_KEY,
    [],
  );
  const [storedServiceCommittees, setStoredServiceCommittees] =
    useLocalStorage<unknown[]>(SERVICE_COMMITTEES_STORAGE_KEY, []);
  const [storedAdvisingStudents, setStoredAdvisingStudents] =
    useLocalStorage<unknown[]>(ADVISING_STUDENTS_STORAGE_KEY, []);
  const [storedReviewLetters, setStoredReviewLetters] =
    useLocalStorage<unknown[]>(SERVICE_REVIEW_LETTERS_STORAGE_KEY, []);
  const [storedAdminItems, setStoredAdminItems] = useLocalStorage<unknown[]>(
    SERVICE_ADMIN_ITEMS_STORAGE_KEY,
    [],
  );
  const [storedBoundaryLessons, setStoredBoundaryLessons] =
    useLocalStorage<unknown[]>(SERVICE_BOUNDARY_LESSONS_STORAGE_KEY, []);
  const [serviceSyncEnabled, setServiceSyncEnabled] = useLocalStorage<boolean>(
    SERVICE_SYNC_ENABLED_KEY,
    false,
  );
  const [lastServiceSyncAt, setLastServiceSyncAt] = useLocalStorage<string>(
    LAST_SERVICE_SYNC_AT_KEY,
    "",
  );
  const [lastServiceSyncError, setLastServiceSyncError] =
    useLocalStorage<string>(LAST_SERVICE_SYNC_ERROR_KEY, "");
  const [serviceCloudUserId, setServiceCloudUserId] =
    useLocalStorage<string>(SERVICE_CLOUD_USER_ID_KEY, "");
  const [serviceSyncStatus, setServiceSyncStatus] = useBackupAwareStatus({
    tone: "neutral",
    message: "Service cloud sync has not run in this session.",
  }, backupExportedAt, "Backup exported. Manual Service sync controls are ready when you are.");
  const [serviceSyncing, setServiceSyncing] = useState(false);
  const [cloudServiceCounts, setCloudServiceCounts] =
    useState<ServiceCloudCounts | null>(null);

  const canUseServiceSync = Boolean(isConfigured && user && serviceSyncEnabled);
  const serviceSyncDisabled = !canUseServiceSync || serviceSyncing || loading;
  const localServiceSnapshot = {
    serviceItems: normalizeServiceItems(storedServiceItems),
    committees: normalizeServiceCommittees(storedServiceCommittees),
    advisingStudents: normalizeAdvisingStudents(storedAdvisingStudents),
    reviewLetters: normalizeReviewLetters(storedReviewLetters),
    adminItems: normalizeServiceAdminItems(storedAdminItems),
    boundaryLessons: normalizeServiceBoundaryLessons(storedBoundaryLessons),
  };
  const localServiceCounts = getServiceCounts(localServiceSnapshot);

  function recordServiceSyncSuccess(message: string) {
    const now = new Date().toISOString();

    setLastServiceSyncAt(now);
    setLastServiceSyncError("");
    setServiceCloudUserId(user?.uid ?? "");
    setServiceSyncStatus({
      tone: "success",
      message,
    });
  }

  function recordServiceSyncError(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Service cloud sync did not complete.";

    setLastServiceSyncError(message);
    setServiceSyncStatus({
      tone: "error",
      message,
    });
  }

  function saveLocalServiceSnapshot(snapshot: typeof localServiceSnapshot) {
    setStoredServiceItems(snapshot.serviceItems);
    setStoredServiceCommittees(snapshot.committees);
    setStoredAdvisingStudents(snapshot.advisingStudents);
    setStoredReviewLetters(snapshot.reviewLetters);
    setStoredAdminItems(snapshot.adminItems);
    setStoredBoundaryLessons(snapshot.boundaryLessons);
  }

  async function refreshCloudServiceCount() {
    if (!user || !isConfigured) {
      return;
    }

    setServiceSyncing(true);

    try {
      const counts = await countUserServiceData(user.uid);
      setCloudServiceCounts(counts);
      setServiceSyncStatus({
        tone: "success",
        message: `Cloud has ${counts.serviceItems} service items, ${counts.committees} committees, ${counts.advisingStudents} advising students, ${counts.reviewLetters} reviews/letters, ${counts.adminItems} admin items, and ${counts.boundaryLessons} boundary lessons.`,
      });
    } catch (error) {
      recordServiceSyncError(error);
    } finally {
      setServiceSyncing(false);
    }
  }

  async function runServiceSync(action: SyncAction) {
    if (!user || serviceSyncDisabled) {
      return;
    }

    if (!backupConfirmed) {
      setServiceSyncStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first Service sync.",
      });
      return;
    }

    setServiceSyncing(true);

    try {
      const cloudSnapshot = await listUserServiceData(user.uid);
      setCloudServiceCounts(getServiceCounts(cloudSnapshot));

      if (action === "push") {
        const mergeResult = await pushMergedUserServiceData(
          user.uid,
          localServiceSnapshot,
          cloudSnapshot,
        );
        saveLocalServiceSnapshot(mergeResult);
        setCloudServiceCounts(getServiceCounts(mergeResult));
        recordServiceSyncSuccess(
          `Pushed merged Service data to cloud. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
        );
        return;
      }

      const mergeResult = mergeServiceDataForSync(
        localServiceSnapshot,
        cloudSnapshot,
      );
      saveLocalServiceSnapshot(mergeResult);

      if (action === "merge") {
        await batchUploadUserServiceData(user.uid, mergeResult);
        setCloudServiceCounts(getServiceCounts(mergeResult));
      }

      recordServiceSyncSuccess(
        action === "pull"
          ? `Pulled cloud Service data into local storage. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`
          : `Synced Service data both ways. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
      );
    } catch (error) {
      recordServiceSyncError(error);
    } finally {
      setServiceSyncing(false);
    }
  }

  return (
    <SyncPanel
      eyebrow="Service"
      title="Manual Service cloud sync"
      description="Only Service items, committees, advising students, reviews/letters, admin records, and boundary lessons use this path. Service pages still read and write localStorage first."
      statusLabel={serviceSyncEnabled ? "Service sync enabled" : "Manual opt-in"}
    >
      <div className="settings-backup-summary">
        <span>{localServiceCounts.serviceItems} local service items</span>
        <span>{localServiceCounts.committees} local committees</span>
        <span>{localServiceCounts.advisingStudents} local advisees</span>
        <span>{localServiceCounts.reviewLetters} local reviews/letters</span>
        <span>{localServiceCounts.adminItems} local admin records</span>
        <span>{localServiceCounts.boundaryLessons} local boundary lessons</span>
        <span>
          {cloudServiceCounts
            ? `${cloudServiceCounts.serviceItems}/${cloudServiceCounts.committees}/${cloudServiceCounts.advisingStudents}/${cloudServiceCounts.reviewLetters}/${cloudServiceCounts.adminItems}/${cloudServiceCounts.boundaryLessons} cloud`
            : "Cloud count not checked"}
        </span>
        <span>
          {lastServiceSyncAt
            ? `Last sync ${formatTaskSyncDate(lastServiceSyncAt)}`
            : "No Service sync yet"}
        </span>
      </div>

      <p className="settings-backup-status is-warning">
        Before first cloud push, clear old sample/demo data or confirm these
        are real records. Service sync will push the local Service stores that
        are currently in this browser.
      </p>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable Service cloud sync</strong>
          <small>
            This unlocks manual Service sync only. It does not sync Teaching,
            Research, Source, Mindspace, Timer, Dashboard planning, or all app data.
          </small>
        </span>
        <input
          type="checkbox"
          checked={serviceSyncEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setServiceSyncEnabled(event.target.checked);
            setServiceCloudUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so Service sync controls stay unavailable
          and local Service mode continues.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before Service data can touch Firestore. Local
          Service planning still works while signed out.
        </p>
      ) : null}

      {serviceCloudUserId && user && serviceCloudUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Service sync was last enabled for a different signed-in user. Review
          before merging local Service data with this account.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand this will merge local and cloud
        Service data without deleting missing local records.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          variant="soft"
          onClick={refreshCloudServiceCount}
          disabled={!isConfigured || !user || serviceSyncing}
        >
          Check cloud Service count
        </Button>
        <Button
          type="button"
          onClick={() => runServiceSync("push")}
          disabled={serviceSyncDisabled}
        >
          Push local Service to cloud
        </Button>
        <Button
          type="button"
          variant="soft"
          onClick={() => runServiceSync("pull")}
          disabled={serviceSyncDisabled}
        >
          Pull cloud Service to local
        </Button>
        <Button
          type="button"
          onClick={() => runServiceSync("merge")}
          disabled={serviceSyncDisabled}
        >
          Sync Service now / merge
        </Button>
      </div>

      <p className={`settings-backup-status is-${serviceSyncStatus.tone}`}>
        {serviceSyncStatus.message} Firestore paths:{" "}
        <code>users/{"{uid}"}/serviceItems/{"{itemId}"}</code>,{" "}
        <code>users/{"{uid}"}/serviceCommittees/{"{committeeId}"}</code>,{" "}
        <code>users/{"{uid}"}/advisingStudents/{"{studentId}"}</code>,{" "}
        <code>users/{"{uid}"}/serviceReviewLetters/{"{recordId}"}</code>,{" "}
        <code>users/{"{uid}"}/serviceAdminItems/{"{recordId}"}</code>,{" "}
        <code>users/{"{uid}"}/serviceBoundaryLessons/{"{lessonId}"}</code>.
      </p>

      {lastServiceSyncError ? (
        <p className="settings-backup-status is-error">
          Last saved Service sync error: {lastServiceSyncError}
        </p>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{SERVICE_SYNC_ENABLED_KEY}</code>,{" "}
        <code>{LAST_SERVICE_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_SERVICE_SYNC_ERROR_KEY}</code>,{" "}
        <code>{SERVICE_CLOUD_USER_ID_KEY}</code>. Local data remains in{" "}
        <code>{SERVICE_ITEMS_STORAGE_KEY}</code>,{" "}
        <code>{SERVICE_COMMITTEES_STORAGE_KEY}</code>,{" "}
        <code>{ADVISING_STUDENTS_STORAGE_KEY}</code>,{" "}
        <code>{SERVICE_REVIEW_LETTERS_STORAGE_KEY}</code>,{" "}
        <code>{SERVICE_ADMIN_ITEMS_STORAGE_KEY}</code>, and{" "}
        <code>{SERVICE_BOUNDARY_LESSONS_STORAGE_KEY}</code>.
      </p>

      <p className="muted-text">
        Pull and merge preserve local ids for matched records so Service
        routes and Add-to-Today links keep pointing at the same local records.
        Closed statuses stay closed, and local records missing from cloud are
        not deleted.
      </p>
    </SyncPanel>
  );
}
