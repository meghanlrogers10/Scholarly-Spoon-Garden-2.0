import { useState } from "react";
import {
  RESEARCH_DRAFTS_STORAGE_KEY,
  RESEARCH_LITERATURE_NOTES_STORAGE_KEY,
  RESEARCH_LITERATURE_SOURCES_STORAGE_KEY,
  RESEARCH_LOG_ENTRIES_STORAGE_KEY,
  RESEARCH_MIND_MAP_NODES_STORAGE_KEY,
  RESEARCH_PRISMA_CRITERIA_STORAGE_KEY,
  RESEARCH_PRISMA_RECORDS_STORAGE_KEY,
  RESEARCH_PROJECTS_STORAGE_KEY,
  RESEARCH_READING_NOTES_STORAGE_KEY,
  RESEARCH_SUBMISSIONS_STORAGE_KEY,
  RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY,
  RESEARCH_TASKS_STORAGE_KEY,
} from "../../../../shared/constants/researchStorage";
import {
  batchUploadUserResearchData,
  countUserResearchData,
  getResearchCounts,
  listUserResearchData,
  mergeResearchDataForSync,
  normalizeResearchDrafts,
  normalizeResearchLiteratureNotes,
  normalizeResearchLiteratureSources,
  normalizeResearchLogEntries,
  normalizeResearchMindMapNodes,
  normalizeResearchPrismaCriteriaList,
  normalizeResearchPrismaRecords,
  normalizeResearchProjects,
  normalizeResearchReadingNotes,
  normalizeResearchSubmissions,
  normalizeResearchSynthesisSections,
  normalizeResearchTasks,
  pushMergedUserResearchData,
  type ResearchCloudCounts,
  type ResearchCloudSnapshot,
  type ResearchSkippedRecord,
} from "../../../../shared/firebase/researchCloudService";
import {
  LAST_RESEARCH_SYNC_AT_KEY,
  LAST_RESEARCH_SYNC_ERROR_KEY,
  RESEARCH_CLOUD_USER_ID_KEY,
  RESEARCH_SYNC_ENABLED_KEY,
} from "../../../../shared/firebase/researchSyncMetadata";
import { formatTaskSyncDate } from "../../../../shared/firebase/taskSyncMetadata";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import { Button } from "../../../../shared/ui/Button";
import { SyncBackupGate } from "./SyncBackupGate";
import { SyncPanel } from "./SyncPanel";
import { useBackupAwareStatus } from "./syncTypes";
import type { SyncAction, SyncPanelProps } from "./syncTypes";

export function ResearchSyncPanel({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  backupExportedAt,
}: SyncPanelProps) {
  const [storedResearchProjects, setStoredResearchProjects] =
    useLocalStorage<unknown[]>(RESEARCH_PROJECTS_STORAGE_KEY, []);
  const [storedResearchTasks, setStoredResearchTasks] = useLocalStorage<
    unknown[]
  >(RESEARCH_TASKS_STORAGE_KEY, []);
  const [storedResearchLogEntries, setStoredResearchLogEntries] =
    useLocalStorage<unknown[]>(RESEARCH_LOG_ENTRIES_STORAGE_KEY, []);
  const [storedResearchDrafts, setStoredResearchDrafts] =
    useLocalStorage<unknown[]>(RESEARCH_DRAFTS_STORAGE_KEY, []);
  const [storedResearchSubmissions, setStoredResearchSubmissions] =
    useLocalStorage<unknown[]>(RESEARCH_SUBMISSIONS_STORAGE_KEY, []);
  const [storedResearchLiteratureSources, setStoredResearchLiteratureSources] =
    useLocalStorage<unknown[]>(RESEARCH_LITERATURE_SOURCES_STORAGE_KEY, []);
  const [storedResearchLiteratureNotes, setStoredResearchLiteratureNotes] =
    useLocalStorage<unknown[]>(RESEARCH_LITERATURE_NOTES_STORAGE_KEY, []);
  const [storedResearchReadingNotes, setStoredResearchReadingNotes] =
    useLocalStorage<unknown[]>(RESEARCH_READING_NOTES_STORAGE_KEY, []);
  const [storedResearchMindMapNodes, setStoredResearchMindMapNodes] =
    useLocalStorage<unknown[]>(RESEARCH_MIND_MAP_NODES_STORAGE_KEY, []);
  const [storedResearchSynthesisSections, setStoredResearchSynthesisSections] =
    useLocalStorage<unknown[]>(RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY, []);
  const [storedResearchPrismaRecords, setStoredResearchPrismaRecords] =
    useLocalStorage<unknown[]>(RESEARCH_PRISMA_RECORDS_STORAGE_KEY, []);
  const [storedResearchPrismaCriteria, setStoredResearchPrismaCriteria] =
    useLocalStorage<unknown[]>(RESEARCH_PRISMA_CRITERIA_STORAGE_KEY, []);
  const [researchSyncEnabled, setResearchSyncEnabled] =
    useLocalStorage<boolean>(RESEARCH_SYNC_ENABLED_KEY, false);
  const [lastResearchSyncAt, setLastResearchSyncAt] = useLocalStorage<string>(
    LAST_RESEARCH_SYNC_AT_KEY,
    "",
  );
  const [lastResearchSyncError, setLastResearchSyncError] =
    useLocalStorage<string>(LAST_RESEARCH_SYNC_ERROR_KEY, "");
  const [researchCloudUserId, setResearchCloudUserId] =
    useLocalStorage<string>(RESEARCH_CLOUD_USER_ID_KEY, "");
  const [researchSyncStatus, setResearchSyncStatus] =
    useBackupAwareStatus({
      tone: "neutral",
      message: "Research cloud sync has not run in this session.",
    }, backupExportedAt, "Backup exported. Manual Research sync controls are ready when you are.");
  const [researchSyncing, setResearchSyncing] = useState(false);
  const [cloudResearchCounts, setCloudResearchCounts] =
    useState<ResearchCloudCounts | null>(null);
  const [lastResearchSkippedLargeRecords, setLastResearchSkippedLargeRecords] =
    useState<ResearchSkippedRecord[]>([]);

  const canUseResearchSync = Boolean(isConfigured && user && researchSyncEnabled);
  const researchSyncDisabled =
    !canUseResearchSync || researchSyncing || loading;
  const localResearchSnapshot: ResearchCloudSnapshot = {
    projects: normalizeResearchProjects(storedResearchProjects),
    tasks: normalizeResearchTasks(storedResearchTasks),
    logEntries: normalizeResearchLogEntries(storedResearchLogEntries),
    drafts: normalizeResearchDrafts(storedResearchDrafts),
    submissions: normalizeResearchSubmissions(storedResearchSubmissions),
    literatureSources: normalizeResearchLiteratureSources(
      storedResearchLiteratureSources,
    ),
    literatureNotes: normalizeResearchLiteratureNotes(
      storedResearchLiteratureNotes,
    ),
    readingNotes: normalizeResearchReadingNotes(storedResearchReadingNotes),
    mindMapNodes: normalizeResearchMindMapNodes(storedResearchMindMapNodes),
    synthesisSections: normalizeResearchSynthesisSections(
      storedResearchSynthesisSections,
    ),
    prismaRecords: normalizeResearchPrismaRecords(storedResearchPrismaRecords),
    prismaCriteria: normalizeResearchPrismaCriteriaList(
      storedResearchPrismaCriteria,
    ),
  };
  const localResearchCounts = getResearchCounts(localResearchSnapshot);

  function recordResearchSyncSuccess(message: string) {
    const now = new Date().toISOString();

    setLastResearchSyncAt(now);
    setLastResearchSyncError("");
    setResearchCloudUserId(user?.uid ?? "");
    setResearchSyncStatus({
      tone: "success",
      message,
    });
  }

  function recordResearchSyncError(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Research cloud sync did not complete.";

    setLastResearchSyncError(message);
    setResearchSyncStatus({
      tone: "error",
      message,
    });
  }

  function saveLocalResearchSnapshot(snapshot: ResearchCloudSnapshot) {
    setStoredResearchProjects(snapshot.projects);
    setStoredResearchTasks(snapshot.tasks);
    setStoredResearchLogEntries(snapshot.logEntries);
    setStoredResearchDrafts(snapshot.drafts);
    setStoredResearchSubmissions(snapshot.submissions);
    setStoredResearchLiteratureSources(snapshot.literatureSources);
    setStoredResearchLiteratureNotes(snapshot.literatureNotes);
    setStoredResearchReadingNotes(snapshot.readingNotes);
    setStoredResearchMindMapNodes(snapshot.mindMapNodes);
    setStoredResearchSynthesisSections(snapshot.synthesisSections);
    setStoredResearchPrismaRecords(snapshot.prismaRecords);
    setStoredResearchPrismaCriteria(snapshot.prismaCriteria);
  }

  function formatResearchLargeSkipMessage(skipped: ResearchSkippedRecord[]) {
    if (skipped.length === 0) {
      return "";
    }

    return ` Skipped ${skipped.length} oversized Research record${
      skipped.length === 1 ? "" : "s"
    } for cloud upload; local copies were preserved.`;
  }

  async function refreshCloudResearchCount() {
    if (!user || !isConfigured) {
      return;
    }

    setResearchSyncing(true);

    try {
      const counts = await countUserResearchData(user.uid);
      setCloudResearchCounts(counts);
      setResearchSyncStatus({
        tone: "success",
        message: `Cloud has ${counts.projects} projects, ${counts.tasks} tasks, ${counts.logEntries} log entries, ${counts.drafts} drafts, ${counts.submissions} submissions, ${counts.literatureSources} sources, ${counts.literatureNotes} source notes, ${counts.readingNotes} reading notes, ${counts.mindMapNodes} mind map nodes, ${counts.synthesisSections} synthesis sections, ${counts.prismaRecords} PRISMA records, and ${counts.prismaCriteria} PRISMA criteria sets.`,
      });
    } catch (error) {
      recordResearchSyncError(error);
    } finally {
      setResearchSyncing(false);
    }
  }

  async function runResearchSync(action: SyncAction) {
    if (!user || researchSyncDisabled) {
      return;
    }

    if (!backupConfirmed) {
      setResearchSyncStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first Research sync.",
      });
      return;
    }

    setResearchSyncing(true);
    setLastResearchSkippedLargeRecords([]);

    try {
      const cloudSnapshot = await listUserResearchData(user.uid);
      setCloudResearchCounts(getResearchCounts(cloudSnapshot));

      if (action === "push") {
        const mergeResult = await pushMergedUserResearchData(
          user.uid,
          localResearchSnapshot,
          cloudSnapshot,
        );
        saveLocalResearchSnapshot(mergeResult);
        setCloudResearchCounts(getResearchCounts(mergeResult));
        setLastResearchSkippedLargeRecords(mergeResult.skippedLargeRecords);
        recordResearchSyncSuccess(
          `Pushed merged Research data to cloud. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.${formatResearchLargeSkipMessage(
            mergeResult.skippedLargeRecords,
          )}`,
        );
        return;
      }

      const mergeResult = mergeResearchDataForSync(
        localResearchSnapshot,
        cloudSnapshot,
      );
      saveLocalResearchSnapshot(mergeResult);

      if (action === "merge") {
        const uploadResult = await batchUploadUserResearchData(user.uid, mergeResult);
        setCloudResearchCounts(uploadResult.counts);
        setLastResearchSkippedLargeRecords(uploadResult.skippedLargeRecords);
        recordResearchSyncSuccess(
          `Synced Research data both ways. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.${formatResearchLargeSkipMessage(
            uploadResult.skippedLargeRecords,
          )}`,
        );
        return;
      }

      recordResearchSyncSuccess(
        `Pulled cloud Research data into local storage. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
      );
    } catch (error) {
      recordResearchSyncError(error);
    } finally {
      setResearchSyncing(false);
    }
  }

  return (
    <SyncPanel
      eyebrow="Research"
      title="Manual Research cloud sync"
      description="Only Research projects, Research tasks, logs, drafts, submissions, literature records, notes, mind map nodes, synthesis sections, and PRISMA records use this path. Research pages still read and write localStorage first."
      statusLabel={researchSyncEnabled ? "Research sync enabled" : "Manual opt-in"}
    >
      <div className="settings-backup-summary">
        <span>{localResearchCounts.projects} local projects</span>
        <span>{localResearchCounts.tasks} local Research tasks</span>
        <span>{localResearchCounts.logEntries} local log entries</span>
        <span>{localResearchCounts.drafts} local drafts</span>
        <span>{localResearchCounts.submissions} local submissions</span>
        <span>{localResearchCounts.literatureSources} local sources</span>
        <span>{localResearchCounts.literatureNotes} local source notes</span>
        <span>{localResearchCounts.readingNotes} local reading notes</span>
        <span>{localResearchCounts.mindMapNodes} local mind map nodes</span>
        <span>{localResearchCounts.synthesisSections} local synthesis sections</span>
        <span>{localResearchCounts.prismaRecords} local PRISMA records</span>
        <span>{localResearchCounts.prismaCriteria} local PRISMA criteria</span>
        <span>
          {cloudResearchCounts
            ? `${cloudResearchCounts.projects}/${cloudResearchCounts.tasks}/${cloudResearchCounts.logEntries}/${cloudResearchCounts.drafts}/${cloudResearchCounts.submissions}/${cloudResearchCounts.literatureSources}/${cloudResearchCounts.literatureNotes}/${cloudResearchCounts.readingNotes}/${cloudResearchCounts.mindMapNodes}/${cloudResearchCounts.synthesisSections}/${cloudResearchCounts.prismaRecords}/${cloudResearchCounts.prismaCriteria} cloud`
            : "Cloud count not checked"}
        </span>
        <span>
          {lastResearchSyncAt
            ? `Last sync ${formatTaskSyncDate(lastResearchSyncAt)}`
            : "No Research sync yet"}
        </span>
      </div>

      <p className="settings-backup-status is-warning">
        Before first cloud push, clear old sample/demo data or confirm these
        Research records are real. Research can contain large pasted outputs,
        HTML, tables, and image data URLs; this sync does not use Firebase
        Storage and will preserve local oversized records instead of stripping
        them.
      </p>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable Research cloud sync</strong>
          <small>
            This unlocks manual Research sync only. It does not sync Source,
            files, images, PDFs, Teaching, Service, Mindspace, Timer,
            Dashboard planning, or all app data.
          </small>
        </span>
        <input
          type="checkbox"
          checked={researchSyncEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setResearchSyncEnabled(event.target.checked);
            setResearchCloudUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so Research sync controls stay
          unavailable and local Research mode continues.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before Research data can touch Firestore. Local
          Research work still works while signed out.
        </p>
      ) : null}

      {researchCloudUserId && user && researchCloudUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Research sync was last enabled for a different signed-in user.
          Review before merging local Research data with this account.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand this will merge local and cloud
        Research data without deleting missing local records.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          variant="soft"
          onClick={refreshCloudResearchCount}
          disabled={!isConfigured || !user || researchSyncing}
        >
          Check cloud Research count
        </Button>
        <Button
          type="button"
          onClick={() => runResearchSync("push")}
          disabled={researchSyncDisabled}
        >
          Push local Research to cloud
        </Button>
        <Button
          type="button"
          variant="soft"
          onClick={() => runResearchSync("pull")}
          disabled={researchSyncDisabled}
        >
          Pull cloud Research to local
        </Button>
        <Button
          type="button"
          onClick={() => runResearchSync("merge")}
          disabled={researchSyncDisabled}
        >
          Sync Research now / merge
        </Button>
      </div>

      <p className={`settings-backup-status is-${researchSyncStatus.tone}`}>
        {researchSyncStatus.message} Firestore paths:{" "}
        <code>users/{"{uid}"}/researchProjects/{"{projectId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchTasks/{"{taskId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchLogEntries/{"{entryId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchDrafts/{"{draftId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchSubmissions/{"{submissionId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchLiteratureSources/{"{sourceId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchLiteratureNotes/{"{noteId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchReadingNotes/{"{noteId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchMindMapNodes/{"{nodeId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchSynthesisSections/{"{sectionId}"}</code>,{" "}
        <code>users/{"{uid}"}/researchPrismaRecords/{"{recordId}"}</code>, and{" "}
        <code>users/{"{uid}"}/researchPrismaCriteria/{"{projectId}"}</code>.
      </p>

      {lastResearchSyncError ? (
        <p className="settings-backup-status is-error">
          Last saved Research sync error: {lastResearchSyncError}
        </p>
      ) : null}

      {lastResearchSkippedLargeRecords.length > 0 ? (
        <p className="settings-backup-status is-warning">
          Oversized local records skipped during the last Research cloud upload:{" "}
          {lastResearchSkippedLargeRecords
            .slice(0, 4)
            .map((record) => `${record.collection}:${record.id}`)
            .join(", ")}
          {lastResearchSkippedLargeRecords.length > 4 ? ", ..." : ""}. They
          remain in localStorage and backup/export.
        </p>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{RESEARCH_SYNC_ENABLED_KEY}</code>,{" "}
        <code>{LAST_RESEARCH_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_RESEARCH_SYNC_ERROR_KEY}</code>,{" "}
        <code>{RESEARCH_CLOUD_USER_ID_KEY}</code>. Local data remains in{" "}
        <code>{RESEARCH_PROJECTS_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_TASKS_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_LOG_ENTRIES_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_DRAFTS_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_SUBMISSIONS_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_LITERATURE_SOURCES_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_LITERATURE_NOTES_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_READING_NOTES_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_MIND_MAP_NODES_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY}</code>,{" "}
        <code>{RESEARCH_PRISMA_RECORDS_STORAGE_KEY}</code>, and{" "}
        <code>{RESEARCH_PRISMA_CRITERIA_STORAGE_KEY}</code>.
      </p>

      <p className="muted-text">
        Pull and merge preserve local ids where records match so project
        routes, source links, draft links, PRISMA links, and Add-to-Today task
        references stay stable. Local records missing from cloud are not
        deleted. Mind map edges are not synced because no active edge store is
        currently used by the Research UI.
      </p>
    </SyncPanel>
  );
}
