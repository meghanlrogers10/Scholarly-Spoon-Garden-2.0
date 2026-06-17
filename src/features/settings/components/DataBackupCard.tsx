import { useRef, useState, type ChangeEvent } from "react";
import {
  APP_STORAGE_KEYS,
  APP_STORAGE_PREFIXES,
  collectAppBackup,
  createBackupFilename,
  downloadBackup,
  parseBackupText,
  previewBackupRestore,
  restoreBackupEntries,
  summarizeBackupCategories,
  type BackupPreview,
  type RestoreResult,
} from "../../../shared/utils/appBackup";
import {
  clearLocalDashboardTasksData,
  clearLocalResearchTeachingServiceData,
  collectDashboardTasksCleanupSummary,
  collectSampleDataCleanupSummary,
  type DashboardTasksCleanupSummary,
  type SampleDataCleanupSummary,
} from "../../../shared/utils/sampleDataCleanup";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";

type ImportStatus =
  | { tone: "neutral"; message: string }
  | { tone: "success"; message: string }
  | { tone: "warning"; message: string }
  | { tone: "error"; message: string };

const categoryLabels: Record<string, string> = {
  settings: "Settings",
  "shared-tasks": "Shared tasks",
  dashboard: "Dashboard planning",
  timer: "Timer and actuals",
  research: "Research",
  teaching: "Teaching",
  service: "Service",
  mindspace: "Mindspace",
};

function formatDate(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "Unknown export date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatCategorySummary(preview: BackupPreview) {
  const summary = summarizeBackupCategories(preview.restorableEntries);

  return Object.entries(summary)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => `${categoryLabels[category] ?? category}: ${count}`)
    .join(" · ");
}

export function DataBackupCard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<ImportStatus>({
    tone: "neutral",
    message: "No backup imported in this session.",
  });
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [lastRestore, setLastRestore] = useState<RestoreResult | null>(null);
  const [cleanupConfirmed, setCleanupConfirmed] = useState(false);
  const [cleanupSummary, setCleanupSummary] =
    useState<SampleDataCleanupSummary>(() => collectSampleDataCleanupSummary());
  const [dashboardCleanupConfirmed, setDashboardCleanupConfirmed] =
    useState(false);
  const [dashboardCleanupSummary, setDashboardCleanupSummary] =
    useState<DashboardTasksCleanupSummary>(() =>
      collectDashboardTasksCleanupSummary()
    );

  function refreshCleanupSummary() {
    setCleanupSummary(collectSampleDataCleanupSummary());
    setDashboardCleanupSummary(collectDashboardTasksCleanupSummary());
  }

  function handleExportBackup() {
    const backup = collectAppBackup();
    downloadBackup(backup);
    setStatus({
      tone: "success",
      message: `Backup exported with ${backup.keyCount} local app keys.`,
    });
    setLastRestore(null);
    refreshCleanupSummary();
  }

  function handleChooseImportFile() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setRestoreConfirmed(false);
    setLastRestore(null);

    if (!file) {
      return;
    }

    try {
      const backup = parseBackupText(await file.text());
      const nextPreview = previewBackupRestore(backup);

      if (nextPreview.restorableEntries.length === 0) {
        setPreview(null);
        setStatus({
          tone: "warning",
          message: "That backup did not contain any recognized SSG data keys.",
        });
        return;
      }

      setPreview(nextPreview);
      setStatus({
        tone: "success",
        message: `Backup loaded. Review ${nextPreview.restorableEntries.length} restorable keys before restoring.`,
      });
    } catch (error) {
      setPreview(null);
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not read that backup file.",
      });
    }
  }

  function handleRestoreBackup() {
    if (!preview || !restoreConfirmed) {
      return;
    }

    const safetyBackup = collectAppBackup();
    downloadBackup(
      safetyBackup,
      createBackupFilename("scholarly-spoon-garden-pre-restore-backup")
    );

    const result = restoreBackupEntries(preview);
    setLastRestore(result);
    setStatus({
      tone: "success",
      message: `Restored ${result.restoredKeyCount} keys. Reload the app when you are ready to use the restored data.`,
    });
    setPreview(null);
    setRestoreConfirmed(false);
    refreshCleanupSummary();
  }

  function handleClearSampleData() {
    if (!cleanupConfirmed) {
      return;
    }

    const safetyBackup = collectAppBackup();
    downloadBackup(
      safetyBackup,
      createBackupFilename("scholarly-spoon-garden-pre-sample-cleanup-backup")
    );

    const result = clearLocalResearchTeachingServiceData();

    setCleanupConfirmed(false);
    refreshCleanupSummary();
    setPreview(null);
    setLastRestore(null);
    setStatus({
      tone: "success",
      message: `Cleared ${result.recordCount} Research, Teaching, and Service local records across ${result.keyCount} keys. Tasks, Planning, Timer/manual logs, Mindspace, Settings, account state, sync metadata, and backups were not cleared.`,
    });
  }

  function handleClearDashboardTasksData() {
    if (!dashboardCleanupConfirmed) {
      return;
    }

    const safetyBackup = collectAppBackup();
    downloadBackup(
      safetyBackup,
      createBackupFilename("scholarly-spoon-garden-pre-dashboard-cleanup-backup")
    );

    const result = clearLocalDashboardTasksData();

    setDashboardCleanupConfirmed(false);
    refreshCleanupSummary();
    setPreview(null);
    setLastRestore(null);
    setStatus({
      tone: "success",
      message: `Cleared ${result.recordCount} Dashboard, Tasks, and Timer local records/settings across ${result.keyCount} entries. Research, Teaching, Service, Mindspace, Firebase account state, sync metadata, and backups were not cleared.`,
    });
  }

  return (
    <Card>
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Data / Backup</p>
          <h2>Local backup and restore</h2>
          <p className="muted-text">
            Export a local JSON backup before big changes or migration work.
            Cloud sync is not active yet, so this is your calm little safety net.
          </p>
        </div>
        <span className="pill">Backup v1</span>
      </div>

      <div className="settings-backup-summary">
        <span>{APP_STORAGE_KEYS.length} known keys</span>
        <span>{APP_STORAGE_PREFIXES.length} known dynamic prefix</span>
        <span>Raw localStorage values preserved</span>
      </div>

      <div className="settings-backup-actions">
        <Button type="button" onClick={handleExportBackup}>
          Export backup
        </Button>
        <Button type="button" variant="soft" onClick={handleChooseImportFile}>
          Import backup
        </Button>
        <input
          ref={fileInputRef}
          className="settings-file-input"
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
        />
      </div>

      <p className={`settings-backup-status is-${status.tone}`}>
        {status.message}
      </p>

      <div className="settings-backup-category-list">
        {Object.values(categoryLabels).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {preview ? (
        <section className="settings-restore-preview" aria-live="polite">
          <div>
            <p className="eyebrow">Restore preview</p>
            <h3>{preview.restorableEntries.length} keys ready to restore</h3>
            <p className="muted-text">
              Exported {formatDate(preview.backup.exportedAt)}.{" "}
              {formatCategorySummary(preview) || "No category summary available."}
            </p>
          </div>

          <div className="settings-restore-counts">
            <span>{preview.overwriteKeys.length} will overwrite existing data</span>
            <span>{preview.missingCurrentKeys.length} will be added</span>
            <span>{preview.ignoredEntries.length} unrelated keys ignored</span>
          </div>

          {preview.warnings.length > 0 ? (
            <ul className="settings-backup-warnings">
              {preview.warnings.slice(0, 4).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <label className="settings-restore-confirm">
            <input
              type="checkbox"
              checked={restoreConfirmed}
              onChange={(event) => setRestoreConfirmed(event.target.checked)}
            />
            <span>
              I understand this will overwrite matching local SSG data keys. Make
              a safety backup first.
            </span>
          </label>

          <div className="settings-backup-actions">
            <Button
              type="button"
              disabled={!restoreConfirmed}
              onClick={handleRestoreBackup}
            >
              Restore backup
            </Button>
            <Button
              type="button"
              variant="soft"
              onClick={() => {
                setPreview(null);
                setRestoreConfirmed(false);
              }}
            >
              Cancel import
            </Button>
          </div>
        </section>
      ) : null}

      {lastRestore ? (
        <p className="settings-backup-status is-warning">
          Restored {lastRestore.restoredKeyCount} keys. Reload the app to refresh
          already-open pages and hooks.
        </p>
      ) : null}

      <section className="settings-danger-zone" aria-live="polite">
        <div>
          <p className="eyebrow">Danger zone</p>
          <h3>Clear local Research/Teaching/Service sample data</h3>
          <p className="muted-text">
            This clears local Research, Teaching, and Service records from this
            browser only. It does not clear Tasks, Dashboard planning,
            Timer/manual logs, Mindspace, Settings, Firebase account state,
            sync metadata, or backup files.
          </p>
        </div>

        <div className="settings-restore-counts">
          <span>{cleanupSummary.countsByCategory.research} Research records</span>
          <span>{cleanupSummary.countsByCategory.teaching} Teaching records</span>
          <span>{cleanupSummary.countsByCategory.service} Service records</span>
          <span>{cleanupSummary.keyCount} matching local keys</span>
        </div>

        <label className="settings-restore-confirm">
          <input
            type="checkbox"
            checked={cleanupConfirmed}
            onChange={(event) => setCleanupConfirmed(event.target.checked)}
          />
          <span>
            I have exported or reviewed a backup and understand this will clear
            local Research, Teaching, and Service records from this browser.
          </span>
        </label>

        <div className="settings-backup-actions">
          <Button type="button" variant="soft" onClick={refreshCleanupSummary}>
            Refresh counts
          </Button>
          <Button
            type="button"
            disabled={!cleanupConfirmed || cleanupSummary.keyCount === 0}
            onClick={handleClearSampleData}
          >
            Clear local Research/Teaching/Service data
          </Button>
        </div>
      </section>

      <section className="settings-danger-zone" aria-live="polite">
        <div>
          <p className="eyebrow">Danger zone</p>
          <h3>Clear local Dashboard/Tasks sample data</h3>
          <p className="muted-text">
            This clears local Tasks, Dashboard planning, Timer/manual logs,
            quick captures, and related Dashboard calendar sample settings from
            this browser only. It does not clear Research, Teaching, Service,
            Mindspace, Firebase account state, sync metadata, or backup files.
          </p>
        </div>

        <div className="settings-restore-counts">
          <span>{dashboardCleanupSummary.countsByCategory.tasks} Task records</span>
          <span>
            {dashboardCleanupSummary.countsByCategory.dashboard} Dashboard records
          </span>
          <span>{dashboardCleanupSummary.countsByCategory.timer} Timer/manual records</span>
          <span>
            {dashboardCleanupSummary.countsByCategory["calendar-settings"]} calendar
            sample settings
          </span>
          <span>{dashboardCleanupSummary.keyCount} matching entries</span>
        </div>

        <label className="settings-restore-confirm">
          <input
            type="checkbox"
            checked={dashboardCleanupConfirmed}
            onChange={(event) =>
              setDashboardCleanupConfirmed(event.target.checked)
            }
          />
          <span>
            I have exported or reviewed a backup and understand this will clear
            local Dashboard, Tasks, Timer, manual log, and quick capture records
            from this browser.
          </span>
        </label>

        <div className="settings-backup-actions">
          <Button type="button" variant="soft" onClick={refreshCleanupSummary}>
            Refresh counts
          </Button>
          <Button
            type="button"
            disabled={
              !dashboardCleanupConfirmed || dashboardCleanupSummary.keyCount === 0
            }
            onClick={handleClearDashboardTasksData}
          >
            Clear local Dashboard/Tasks data
          </Button>
        </div>
      </section>
    </Card>
  );
}
