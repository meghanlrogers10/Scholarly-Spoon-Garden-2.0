import { useState } from "react";
import { APP_SETTINGS_STORAGE_KEY } from "../../../../shared/constants/settingsStorage";
import {
  mergeAppSettingsForSync,
  normalizeLocalAppSettings,
  readUserAppSettings,
  saveUserAppSettings,
  type SettingsCloudSnapshot,
} from "../../../../shared/firebase/settingsCloudService";
import {
  LAST_SETTINGS_SYNC_AT_KEY,
  LAST_SETTINGS_SYNC_ERROR_KEY,
  SETTINGS_CLOUD_USER_ID_KEY,
  SETTINGS_SYNC_ENABLED_KEY,
} from "../../../../shared/firebase/settingsSyncMetadata";
import { formatTaskSyncDate } from "../../../../shared/firebase/taskSyncMetadata";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import { defaultAppSettings, type AppSettings } from "../../../../shared/types/settings";
import { Button } from "../../../../shared/ui/Button";
import { SyncBackupGate } from "./SyncBackupGate";
import { SyncPanel } from "./SyncPanel";
import { useBackupAwareStatus } from "./syncTypes";
import type { SyncAction, SyncPanelProps } from "./syncTypes";

export function OptionsSyncPanel({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  backupExportedAt,
}: SyncPanelProps) {
  const [storedAppSettings, setStoredAppSettings] = useLocalStorage<AppSettings>(
    APP_SETTINGS_STORAGE_KEY,
    defaultAppSettings,
  );
  const [settingsSyncEnabled, setSettingsSyncEnabled] =
    useLocalStorage<boolean>(SETTINGS_SYNC_ENABLED_KEY, false);
  const [lastSettingsSyncAt, setLastSettingsSyncAt] = useLocalStorage<string>(
    LAST_SETTINGS_SYNC_AT_KEY,
    "",
  );
  const [lastSettingsSyncError, setLastSettingsSyncError] =
    useLocalStorage<string>(LAST_SETTINGS_SYNC_ERROR_KEY, "");
  const [settingsCloudUserId, setSettingsCloudUserId] =
    useLocalStorage<string>(SETTINGS_CLOUD_USER_ID_KEY, "");
  const [settingsSyncStatus, setSettingsSyncStatus] =
    useBackupAwareStatus({
      tone: "neutral",
      message: "Options cloud sync has not run in this session.",
    }, backupExportedAt, "Backup exported. Manual Options sync controls are ready when you are.");
  const [settingsSyncing, setSettingsSyncing] = useState(false);
  const [cloudSettingsSnapshot, setCloudSettingsSnapshot] =
    useState<SettingsCloudSnapshot | null>(null);

  const localAppSettings = normalizeLocalAppSettings(storedAppSettings);
  const canUseSettingsSync = Boolean(isConfigured && user && settingsSyncEnabled);
  const settingsSyncDisabled =
    !canUseSettingsSync || settingsSyncing || loading;

  function recordSettingsSyncSuccess(message: string) {
    const now = new Date().toISOString();

    setLastSettingsSyncAt(now);
    setLastSettingsSyncError("");
    setSettingsCloudUserId(user?.uid ?? "");
    setSettingsSyncStatus({
      tone: "success",
      message,
    });
  }

  function recordSettingsSyncError(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Options cloud sync did not complete.";

    setLastSettingsSyncError(message);
    setSettingsSyncStatus({
      tone: "error",
      message,
    });
  }

  async function refreshCloudSettingsStatus() {
    if (!user || !isConfigured) {
      return;
    }

    setSettingsSyncing(true);

    try {
      const snapshot = await readUserAppSettings(user.uid);
      setCloudSettingsSnapshot(snapshot);
      setSettingsSyncStatus({
        tone: "success",
        message: snapshot.settings
          ? `Cloud options found${
              snapshot.settings.updatedAt
                ? `, updated ${formatTaskSyncDate(snapshot.settings.updatedAt)}`
                : ""
            }.`
          : "No cloud options document exists yet.",
      });
    } catch (error) {
      recordSettingsSyncError(error);
    } finally {
      setSettingsSyncing(false);
    }
  }

  async function runSettingsSync(action: SyncAction) {
    if (!user || settingsSyncDisabled) {
      return;
    }

    if (!backupConfirmed) {
      setSettingsSyncStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first Options sync.",
      });
      return;
    }

    setSettingsSyncing(true);

    try {
      const cloudSnapshot = await readUserAppSettings(user.uid);
      setCloudSettingsSnapshot(cloudSnapshot);

      if (action === "push") {
        const savedSettings = await saveUserAppSettings(user.uid, localAppSettings);
        setStoredAppSettings(savedSettings);
        setCloudSettingsSnapshot({ settings: savedSettings });
        recordSettingsSyncSuccess(
          "Pushed local options to cloud. Some display changes may require refresh on other open tabs.",
        );
        return;
      }

      const mergeResult = mergeAppSettingsForSync(
        localAppSettings,
        cloudSnapshot.settings,
      );
      setStoredAppSettings(mergeResult.settings);

      if (action === "merge") {
        await saveUserAppSettings(user.uid, mergeResult.settings);
        setCloudSettingsSnapshot({ settings: mergeResult.settings });
      }

      recordSettingsSyncSuccess(
        action === "pull"
          ? `Pulled cloud options into local settings. ${mergeResult.reason} Some display changes may require refresh.`
          : `Synced options both ways. ${mergeResult.reason} Some display changes may require refresh on other open tabs.`,
      );
    } catch (error) {
      recordSettingsSyncError(error);
    } finally {
      setSettingsSyncing(false);
    }
  }

  return (
    <SyncPanel
      eyebrow="Options / Settings"
      title="Manual Options cloud sync"
      description="Only app preferences use this path: timer defaults, calendar hours, planning warnings, sample calendar visibility, density, and calmer display options. App data stays local unless its own sync panel is used."
      statusLabel={settingsSyncEnabled ? "Options sync enabled" : "Manual opt-in"}
    >
      <div className="settings-backup-summary">
        <span>
          Local options{" "}
          {localAppSettings.updatedAt
            ? `updated ${formatTaskSyncDate(localAppSettings.updatedAt)}`
            : "have no timestamp yet"}
        </span>
        <span>
          {cloudSettingsSnapshot?.settings
            ? `Cloud options ${
                cloudSettingsSnapshot.settings.updatedAt
                  ? `updated ${formatTaskSyncDate(
                      cloudSettingsSnapshot.settings.updatedAt,
                    )}`
                  : "found"
              }`
            : "Cloud options not checked"}
        </span>
        <span>
          {lastSettingsSyncAt
            ? `Last sync ${formatTaskSyncDate(lastSettingsSyncAt)}`
            : "No Options sync yet"}
        </span>
      </div>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable Options cloud sync</strong>
          <small>
            This unlocks manual settings sync only. It does not sync Research,
            Teaching, Service, Mindspace, Timer logs, Dashboard planning, or
            shared tasks.
          </small>
        </span>
        <input
          type="checkbox"
          checked={settingsSyncEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setSettingsSyncEnabled(event.target.checked);
            setSettingsCloudUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so Options sync controls stay unavailable
          and local settings mode continues.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before app options can touch Firestore. Settings
          remain editable in this browser while signed out.
        </p>
      ) : null}

      {settingsCloudUserId && user && settingsCloudUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Options sync was last enabled for a different signed-in user. Review
          before merging local options with this account.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand this will merge local and cloud
        options without deleting app data.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          variant="soft"
          onClick={refreshCloudSettingsStatus}
          disabled={!isConfigured || !user || settingsSyncing}
        >
          Check cloud Options
        </Button>
        <Button
          type="button"
          onClick={() => runSettingsSync("push")}
          disabled={settingsSyncDisabled}
        >
          Push local options to cloud
        </Button>
        <Button
          type="button"
          variant="soft"
          onClick={() => runSettingsSync("pull")}
          disabled={settingsSyncDisabled}
        >
          Pull cloud options to local
        </Button>
        <Button
          type="button"
          onClick={() => runSettingsSync("merge")}
          disabled={settingsSyncDisabled}
        >
          Sync options now / merge
        </Button>
      </div>

      <p className={`settings-backup-status is-${settingsSyncStatus.tone}`}>
        {settingsSyncStatus.message} Firestore path:{" "}
        <code>users/{"{uid}"}/profile/appSettings</code>
      </p>

      {lastSettingsSyncError ? (
        <p className="settings-backup-status is-error">
          Last saved Options sync error: {lastSettingsSyncError}
        </p>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{SETTINGS_SYNC_ENABLED_KEY}</code>,{" "}
        <code>{LAST_SETTINGS_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_SETTINGS_SYNC_ERROR_KEY}</code>,{" "}
        <code>{SETTINGS_CLOUD_USER_ID_KEY}</code>. Local options remain in{" "}
        <code>{APP_SETTINGS_STORAGE_KEY}</code>.
      </p>
    </SyncPanel>
  );
}
