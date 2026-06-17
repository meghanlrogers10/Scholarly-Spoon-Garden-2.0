import { Cloud, LogIn } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  type CloudConnectionTestResult,
  testCloudConnection,
} from "../../../../shared/firebase/testCloudConnection";
import {
  getSyncStatusDescription,
  syncStatusLabels,
  type SyncStatus,
} from "../../../../shared/firebase/syncStatus";
import { formatTaskSyncDate } from "../../../../shared/firebase/taskSyncMetadata";
import { Button } from "../../../../shared/ui/Button";
import type { SyncOverviewItem } from "./syncTypes";
import type { User } from "firebase/auth";

type TestStatus =
  | { tone: "neutral"; message: string; result?: CloudConnectionTestResult }
  | { tone: "success"; message: string; result: CloudConnectionTestResult }
  | { tone: "error"; message: string; result?: CloudConnectionTestResult };

type CloudSyncOverviewProps = {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  missingConfigKeys: string[];
  items: SyncOverviewItem[];
};

function formatTestDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CloudSyncOverview({
  user,
  loading,
  isConfigured,
  missingConfigKeys,
  items,
}: CloudSyncOverviewProps) {
  const [testStatus, setTestStatus] = useState<TestStatus>({
    tone: "neutral",
    message: "No cloud connection test run in this session.",
  });
  const [testing, setTesting] = useState(false);

  const syncStatus = useMemo<SyncStatus>(() => {
    if (!isConfigured) return "local-only";
    if (!user) return "signed-out";
    if (testing) return "syncing";
    if (testStatus.tone === "success") return "synced";
    if (testStatus.tone === "error") return "error";

    return "sync-ready";
  }, [isConfigured, testStatus.tone, testing, user]);

  async function handleTestCloudConnection() {
    if (!user) {
      return;
    }

    setTesting(true);
    setTestStatus({
      tone: "neutral",
      message: "Testing one tiny user-scoped profile document.",
    });

    try {
      const result = await testCloudConnection(user.uid);
      setTestStatus({
        tone: "success",
        message: `Cloud test passed at ${formatTestDate(result.timestamp)}.`,
        result,
      });
    } catch (error) {
      setTestStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "The cloud connection test did not complete.",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Account / Cloud</p>
          <h2>Cloud account and manual sync tools</h2>
          <p className="muted-text">
            Manual sync is temporary while Cloud Save is being stabilized.
            Eventually this will become one Cloud Save switch. LocalStorage
            remains the source of truth until each manual action is run.
          </p>
        </div>
        <span className="pill">{syncStatusLabels[syncStatus]}</span>
      </div>

      <div className="settings-backup-summary">
        <span>{user ? `Signed in as ${user.email ?? "this account"}` : "Signed out"}</span>
        <span>{isConfigured ? "Firebase configured" : "Firebase local-only"}</span>
        <span>Backup before first sync</span>
      </div>

      <p className="settings-cloud-description">
        <Cloud size={18} aria-hidden="true" />
        <span>{getSyncStatusDescription(syncStatus)}</span>
      </p>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase env vars are missing: {missingConfigKeys.join(", ")}. The app
          is running in local-only mode.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <div className="settings-backup-actions">
          <Link className="button button-primary settings-link-button" to="/login">
            <LogIn size={16} aria-hidden="true" /> Sign in to test cloud
          </Link>
        </div>
      ) : null}

      {user ? (
        <div className="settings-backup-actions">
          <Button
            type="button"
            onClick={handleTestCloudConnection}
            disabled={testing || loading}
          >
            Test cloud connection
          </Button>
        </div>
      ) : null}

      <p className={`settings-backup-status is-${testStatus.tone}`}>
        {testStatus.message}
        {testStatus.result ? (
          <>
            {" "}
            Document: <code>{testStatus.result.path}</code>
          </>
        ) : null}
      </p>

      <section className="settings-task-sync-panel">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Cloud Save status overview</p>
            <h2>Manual sync areas</h2>
            <p className="muted-text">
              These panels are advanced manual tools for checking, pushing,
              pulling, and merging one area at a time.
            </p>
          </div>
          <span className="pill">
            {items.filter((item) => item.enabled).length}/{items.length} enabled
          </span>
        </div>

        <div className="settings-backup-summary">
          {items.map((item) => (
            <span key={item.label}>
              {item.label}: {item.enabled ? "enabled" : "off"}
              {item.lastError
                ? " · error saved"
                : item.lastSyncAt
                  ? ` · ${formatTaskSyncDate(item.lastSyncAt)}`
                  : " · never synced"}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
