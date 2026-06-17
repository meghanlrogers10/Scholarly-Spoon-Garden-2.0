import { useState } from "react";
import { useAuthUser } from "../../../shared/auth/useAuthUser";
import { Card } from "../../../shared/ui/Card";
import { collectAppBackup, downloadBackup } from "../../../shared/utils/appBackup";
import { CloudSaveControl } from "./sync/CloudSaveControl";
import type { SyncPanelProps } from "./sync/syncTypes";

export function CloudSyncCard() {
  const { user, loading, isConfigured } = useAuthUser();
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [backupExportedAt, setBackupExportedAt] = useState(0);

  function handleExportBackup() {
    downloadBackup(collectAppBackup());
    setBackupConfirmed(true);
    setBackupExportedAt(Date.now());
  }

  const panelProps: SyncPanelProps = {
    user,
    loading,
    isConfigured,
    backupConfirmed,
    setBackupConfirmed,
    onExportBackup: handleExportBackup,
    backupExportedAt,
  };

  return (
    <Card>
      <CloudSaveControl {...panelProps} />
    </Card>
  );
}
