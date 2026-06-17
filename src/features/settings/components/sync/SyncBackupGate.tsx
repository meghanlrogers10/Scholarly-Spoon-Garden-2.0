import { Button } from "../../../../shared/ui/Button";

type SyncBackupGateProps = {
  backupConfirmed: boolean;
  setBackupConfirmed: (checked: boolean) => void;
  onExportBackup: () => void;
  children: string;
};

export function SyncBackupGate({
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  children,
}: SyncBackupGateProps) {
  return (
    <div className="settings-task-sync-safety">
      <label className="settings-restore-confirm">
        <input
          type="checkbox"
          checked={backupConfirmed}
          onChange={(event) => setBackupConfirmed(event.target.checked)}
        />
        <span>{children}</span>
      </label>
      <Button type="button" variant="soft" onClick={onExportBackup}>
        Export backup first
      </Button>
    </div>
  );
}
