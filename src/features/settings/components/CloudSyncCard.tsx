import { useState } from "react";
import { useAuthUser } from "../../../shared/auth/useAuthUser";
import {
  LAST_MINDSPACE_SYNC_AT_KEY,
  LAST_MINDSPACE_SYNC_ERROR_KEY,
  MINDSPACE_SYNC_ENABLED_KEY,
} from "../../../shared/firebase/mindspaceSyncMetadata";
import {
  LAST_PLANNING_SYNC_AT_KEY,
  LAST_PLANNING_SYNC_ERROR_KEY,
  PLANNING_SYNC_ENABLED_KEY,
} from "../../../shared/firebase/planningSyncMetadata";
import {
  LAST_RESEARCH_SYNC_AT_KEY,
  LAST_RESEARCH_SYNC_ERROR_KEY,
  RESEARCH_SYNC_ENABLED_KEY,
} from "../../../shared/firebase/researchSyncMetadata";
import {
  LAST_SERVICE_SYNC_AT_KEY,
  LAST_SERVICE_SYNC_ERROR_KEY,
  SERVICE_SYNC_ENABLED_KEY,
} from "../../../shared/firebase/serviceSyncMetadata";
import {
  LAST_SETTINGS_SYNC_AT_KEY,
  LAST_SETTINGS_SYNC_ERROR_KEY,
  SETTINGS_SYNC_ENABLED_KEY,
} from "../../../shared/firebase/settingsSyncMetadata";
import {
  LAST_TASK_SYNC_AT_KEY,
  LAST_TASK_SYNC_ERROR_KEY,
  TASK_SYNC_ENABLED_KEY,
} from "../../../shared/firebase/taskSyncMetadata";
import {
  LAST_TEACHING_SYNC_AT_KEY,
  LAST_TEACHING_SYNC_ERROR_KEY,
  TEACHING_SYNC_ENABLED_KEY,
} from "../../../shared/firebase/teachingSyncMetadata";
import {
  LAST_TIMER_SYNC_AT_KEY,
  LAST_TIMER_SYNC_ERROR_KEY,
  TIMER_SYNC_ENABLED_KEY,
} from "../../../shared/firebase/timerSyncMetadata";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import { Card } from "../../../shared/ui/Card";
import { collectAppBackup, downloadBackup } from "../../../shared/utils/appBackup";
import { CloudSaveControl } from "./sync/CloudSaveControl";
import { CloudSyncOverview } from "./sync/CloudSyncOverview";
import { MindspaceSyncPanel } from "./sync/MindspaceSyncPanel";
import { OptionsSyncPanel } from "./sync/OptionsSyncPanel";
import { PlanningSyncPanel } from "./sync/PlanningSyncPanel";
import { ResearchSyncPanel } from "./sync/ResearchSyncPanel";
import { ServiceSyncPanel } from "./sync/ServiceSyncPanel";
import type { SyncOverviewItem, SyncPanelProps } from "./sync/syncTypes";
import { TaskSyncPanel } from "./sync/TaskSyncPanel";
import { TeachingSyncPanel } from "./sync/TeachingSyncPanel";
import { TimerSyncPanel } from "./sync/TimerSyncPanel";

function useSyncOverviewItems(): SyncOverviewItem[] {
  const [settingsEnabled] = useLocalStorage<boolean>(
    SETTINGS_SYNC_ENABLED_KEY,
    false,
  );
  const [lastSettingsSyncAt] = useLocalStorage<string>(
    LAST_SETTINGS_SYNC_AT_KEY,
    "",
  );
  const [lastSettingsSyncError] = useLocalStorage<string>(
    LAST_SETTINGS_SYNC_ERROR_KEY,
    "",
  );
  const [taskEnabled] = useLocalStorage<boolean>(TASK_SYNC_ENABLED_KEY, false);
  const [lastTaskSyncAt] = useLocalStorage<string>(LAST_TASK_SYNC_AT_KEY, "");
  const [lastTaskSyncError] = useLocalStorage<string>(
    LAST_TASK_SYNC_ERROR_KEY,
    "",
  );
  const [planningEnabled] = useLocalStorage<boolean>(
    PLANNING_SYNC_ENABLED_KEY,
    false,
  );
  const [lastPlanningSyncAt] = useLocalStorage<string>(
    LAST_PLANNING_SYNC_AT_KEY,
    "",
  );
  const [lastPlanningSyncError] = useLocalStorage<string>(
    LAST_PLANNING_SYNC_ERROR_KEY,
    "",
  );
  const [timerEnabled] = useLocalStorage<boolean>(TIMER_SYNC_ENABLED_KEY, false);
  const [lastTimerSyncAt] = useLocalStorage<string>(LAST_TIMER_SYNC_AT_KEY, "");
  const [lastTimerSyncError] = useLocalStorage<string>(
    LAST_TIMER_SYNC_ERROR_KEY,
    "",
  );
  const [mindspaceEnabled] = useLocalStorage<boolean>(
    MINDSPACE_SYNC_ENABLED_KEY,
    false,
  );
  const [lastMindspaceSyncAt] = useLocalStorage<string>(
    LAST_MINDSPACE_SYNC_AT_KEY,
    "",
  );
  const [lastMindspaceSyncError] = useLocalStorage<string>(
    LAST_MINDSPACE_SYNC_ERROR_KEY,
    "",
  );
  const [serviceEnabled] = useLocalStorage<boolean>(
    SERVICE_SYNC_ENABLED_KEY,
    false,
  );
  const [lastServiceSyncAt] = useLocalStorage<string>(
    LAST_SERVICE_SYNC_AT_KEY,
    "",
  );
  const [lastServiceSyncError] = useLocalStorage<string>(
    LAST_SERVICE_SYNC_ERROR_KEY,
    "",
  );
  const [teachingEnabled] = useLocalStorage<boolean>(
    TEACHING_SYNC_ENABLED_KEY,
    false,
  );
  const [lastTeachingSyncAt] = useLocalStorage<string>(
    LAST_TEACHING_SYNC_AT_KEY,
    "",
  );
  const [lastTeachingSyncError] = useLocalStorage<string>(
    LAST_TEACHING_SYNC_ERROR_KEY,
    "",
  );
  const [researchEnabled] = useLocalStorage<boolean>(
    RESEARCH_SYNC_ENABLED_KEY,
    false,
  );
  const [lastResearchSyncAt] = useLocalStorage<string>(
    LAST_RESEARCH_SYNC_AT_KEY,
    "",
  );
  const [lastResearchSyncError] = useLocalStorage<string>(
    LAST_RESEARCH_SYNC_ERROR_KEY,
    "",
  );

  return [
    {
      label: "Options",
      enabled: settingsEnabled,
      lastSyncAt: lastSettingsSyncAt,
      lastError: lastSettingsSyncError,
    },
    {
      label: "Tasks",
      enabled: taskEnabled,
      lastSyncAt: lastTaskSyncAt,
      lastError: lastTaskSyncError,
    },
    {
      label: "Planning",
      enabled: planningEnabled,
      lastSyncAt: lastPlanningSyncAt,
      lastError: lastPlanningSyncError,
    },
    {
      label: "Timer",
      enabled: timerEnabled,
      lastSyncAt: lastTimerSyncAt,
      lastError: lastTimerSyncError,
    },
    {
      label: "Mindspace",
      enabled: mindspaceEnabled,
      lastSyncAt: lastMindspaceSyncAt,
      lastError: lastMindspaceSyncError,
    },
    {
      label: "Service",
      enabled: serviceEnabled,
      lastSyncAt: lastServiceSyncAt,
      lastError: lastServiceSyncError,
    },
    {
      label: "Teaching",
      enabled: teachingEnabled,
      lastSyncAt: lastTeachingSyncAt,
      lastError: lastTeachingSyncError,
    },
    {
      label: "Research",
      enabled: researchEnabled,
      lastSyncAt: lastResearchSyncAt,
      lastError: lastResearchSyncError,
    },
  ];
}

export function CloudSyncCard() {
  const { user, loading, isConfigured, missingConfigKeys } = useAuthUser();
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [backupExportedAt, setBackupExportedAt] = useState(0);
  const overviewItems = useSyncOverviewItems();

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
      <CloudSyncOverview
        user={user}
        loading={loading}
        isConfigured={isConfigured}
        missingConfigKeys={missingConfigKeys}
        items={overviewItems}
      />

      <CloudSaveControl {...panelProps} items={overviewItems} />

      <section className="settings-task-sync-panel">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Core daily system</p>
            <h2>Manual sync panels</h2>
            <p className="muted-text">
              These controls cover the everyday planning layer: options, shared
              tasks, Dashboard planning records, and timer/manual work logs.
            </p>
          </div>
          <span className="pill">Advanced manual tools</span>
        </div>
      </section>

      <OptionsSyncPanel {...panelProps} />
      <TaskSyncPanel {...panelProps} />
      <PlanningSyncPanel {...panelProps} />
      <TimerSyncPanel {...panelProps} />

      <section className="settings-task-sync-panel">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Academic modules</p>
            <h2>Manual module sync panels</h2>
            <p className="muted-text">
              These controls keep each academic module separate so one sync
              action cannot accidentally push or pull the whole app.
            </p>
          </div>
          <span className="pill">One area at a time</span>
        </div>
      </section>

      <MindspaceSyncPanel {...panelProps} />
      <ServiceSyncPanel {...panelProps} />
      <TeachingSyncPanel {...panelProps} />
      <ResearchSyncPanel {...panelProps} />
    </Card>
  );
}
