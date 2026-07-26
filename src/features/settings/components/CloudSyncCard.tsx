import { useMemo, useState } from "react";
import { Cloud, Download, RefreshCw } from "lucide-react";
import { useAuthUser } from "../../../shared/auth/useAuthUser";
import {
  requestCloudSaveSync,
} from "../../../shared/sync/cloudSaveManager";
import { useCloudSaveStatus } from "../../../shared/sync/useCloudSaveStatus";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { collectAppBackup, downloadBackup } from "../../../shared/utils/appBackup";

function formatLastSync(value?: string) {
  if (!value) {
    return "";
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function CloudSyncCard() {
  const { user, isConfigured } = useAuthUser();
  const { status, queue } = useCloudSaveStatus();
  const [backupStatus, setBackupStatus] = useState("");
  const pendingCount = queue.filter((item) => item.status !== "synced").length;

  const cloudStatus = useMemo(() => {
    if (!isConfigured) {
      return {
        tone: "warning",
        label: "Local save only",
        message: "Firebase is not configured for this build.",
      };
    }

    if (!user) {
      return {
        tone: "neutral",
        label: "Cloud save available",
        message: "Sign in to sync your app data to the cloud.",
      };
    }

    if (!navigator.onLine) {
      return {
        tone: "warning",
        label: "Offline, changes saved locally",
        message: "Cloud save will retry automatically when you reconnect.",
      };
    }

    if (status.tone === "error" || status.tone === "warning") {
      return {
        tone: status.tone,
        label: pendingCount > 0 ? "Waiting to retry" : "Cloud save needs attention",
        message: status.message,
      };
    }

    if (pendingCount > 0 || status.message.toLowerCase().includes("waiting")) {
      return {
        tone: "neutral",
        label: "Saving...",
        message: "Recent changes are queued for automatic cloud save.",
      };
    }

    return {
      tone: "success",
      label: status.tone === "success" ? "Saved" : "Cloud save on",
      message:
        status.tone === "success"
          ? status.message
          : "Signed-in changes sync automatically while you are online.",
    };
  }, [isConfigured, pendingCount, status.message, status.tone, user]);

  function handleDownloadBackup() {
    const backup = collectAppBackup();

    downloadBackup(backup);
    setBackupStatus(`Backup downloaded with ${backup.keyCount} local app keys.`);
  }

  return (
    <Card className="settings-cloud-card">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Cloud save and backup</p>
          <h2>Automatic cloud save</h2>
          <p className="muted-text">
            Signed-in changes sync automatically, with local saves kept during
            temporary network problems.
          </p>
        </div>
        <Cloud size={24} aria-hidden="true" />
      </div>

      <div
        className={`settings-cloud-status is-${cloudStatus.tone}`}
        role="status"
        aria-live="polite"
      >
        <strong>{cloudStatus.label}</strong>
        <span>{cloudStatus.message}</span>
        {status.lastUpdatedAt ? (
          <small>Last synced {formatLastSync(status.lastUpdatedAt)}</small>
        ) : null}
      </div>

      <div className="settings-actions settings-actions--inline">
        <Button
          type="button"
          variant="soft"
          disabled={!user || !isConfigured}
          onClick={requestCloudSaveSync}
        >
          <RefreshCw size={16} aria-hidden="true" /> Sync now
        </Button>
        <Button type="button" onClick={handleDownloadBackup}>
          <Download size={16} aria-hidden="true" /> Download backup
        </Button>
      </div>

      {backupStatus ? (
        <p className="settings-backup-status is-success" role="status">
          {backupStatus}
        </p>
      ) : null}
    </Card>
  );
}
