import { useState } from "react";
import {
  TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY,
  TEACHING_ASSISTANTS_STORAGE_KEY,
  TEACHING_COURSE_NOTES_STORAGE_KEY,
  TEACHING_COURSE_TEMPLATES_STORAGE_KEY,
  TEACHING_COURSES_STORAGE_KEY,
  TEACHING_GRADING_ITEMS_STORAGE_KEY,
  TEACHING_MEETINGS_STORAGE_KEY,
  TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY,
  TEACHING_PREP_SESSIONS_STORAGE_KEY,
  TEACHING_RESOURCES_STORAGE_KEY,
  TEACHING_SEMESTERS_STORAGE_KEY,
  TEACHING_TA_ITEMS_STORAGE_KEY,
} from "../../../../shared/constants/teachingStorage";
import {
  batchUploadUserTeachingData,
  countUserTeachingData,
  getTeachingCounts,
  listUserTeachingData,
  mergeTeachingDataForSync,
  normalizeTeachingAnnouncementReminders,
  normalizeTeachingAssistants,
  normalizeTeachingCourseNotes,
  normalizeTeachingCourses,
  normalizeTeachingCourseTemplates,
  normalizeTeachingGradingItems,
  normalizeTeachingMeetings,
  normalizeTeachingOfficeHourVisits,
  normalizeTeachingPrepSessions,
  normalizeTeachingResources,
  normalizeTeachingSemesters,
  normalizeTeachingTaItems,
  pushMergedUserTeachingData,
  TEACHING_NOTE_DRAFT_SYNC_NOTE,
  type TeachingCloudCounts,
} from "../../../../shared/firebase/teachingCloudService";
import {
  LAST_TEACHING_SYNC_AT_KEY,
  LAST_TEACHING_SYNC_ERROR_KEY,
  TEACHING_CLOUD_USER_ID_KEY,
  TEACHING_SYNC_ENABLED_KEY,
} from "../../../../shared/firebase/teachingSyncMetadata";
import { formatTaskSyncDate } from "../../../../shared/firebase/taskSyncMetadata";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import { Button } from "../../../../shared/ui/Button";
import { SyncBackupGate } from "./SyncBackupGate";
import { SyncPanel } from "./SyncPanel";
import { useBackupAwareStatus } from "./syncTypes";
import type { SyncAction, SyncPanelProps } from "./syncTypes";

export function TeachingSyncPanel({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  backupExportedAt,
}: SyncPanelProps) {
  const [storedTeachingSemesters, setStoredTeachingSemesters] =
    useLocalStorage<unknown[]>(TEACHING_SEMESTERS_STORAGE_KEY, []);
  const [storedTeachingCourses, setStoredTeachingCourses] =
    useLocalStorage<unknown[]>(TEACHING_COURSES_STORAGE_KEY, []);
  const [storedTeachingMeetings, setStoredTeachingMeetings] =
    useLocalStorage<unknown[]>(TEACHING_MEETINGS_STORAGE_KEY, []);
  const [storedTeachingPrepSessions, setStoredTeachingPrepSessions] =
    useLocalStorage<unknown[]>(TEACHING_PREP_SESSIONS_STORAGE_KEY, []);
  const [storedTeachingGradingItems, setStoredTeachingGradingItems] =
    useLocalStorage<unknown[]>(TEACHING_GRADING_ITEMS_STORAGE_KEY, []);
  const [storedTeachingTaItems, setStoredTeachingTaItems] =
    useLocalStorage<unknown[]>(TEACHING_TA_ITEMS_STORAGE_KEY, []);
  const [storedTeachingAssistants, setStoredTeachingAssistants] =
    useLocalStorage<unknown[]>(TEACHING_ASSISTANTS_STORAGE_KEY, []);
  const [storedTeachingOfficeHourVisits, setStoredTeachingOfficeHourVisits] =
    useLocalStorage<unknown[]>(TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY, []);
  const [storedTeachingCourseNotes, setStoredTeachingCourseNotes] =
    useLocalStorage<unknown[]>(TEACHING_COURSE_NOTES_STORAGE_KEY, []);
  const [storedTeachingResources, setStoredTeachingResources] =
    useLocalStorage<unknown[]>(TEACHING_RESOURCES_STORAGE_KEY, []);
  const [
    storedTeachingAnnouncementReminders,
    setStoredTeachingAnnouncementReminders,
  ] = useLocalStorage<unknown[]>(
    TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY,
    [],
  );
  const [storedTeachingCourseTemplates, setStoredTeachingCourseTemplates] =
    useLocalStorage<unknown[]>(TEACHING_COURSE_TEMPLATES_STORAGE_KEY, []);
  const [teachingSyncEnabled, setTeachingSyncEnabled] =
    useLocalStorage<boolean>(TEACHING_SYNC_ENABLED_KEY, false);
  const [lastTeachingSyncAt, setLastTeachingSyncAt] = useLocalStorage<string>(
    LAST_TEACHING_SYNC_AT_KEY,
    "",
  );
  const [lastTeachingSyncError, setLastTeachingSyncError] =
    useLocalStorage<string>(LAST_TEACHING_SYNC_ERROR_KEY, "");
  const [teachingCloudUserId, setTeachingCloudUserId] =
    useLocalStorage<string>(TEACHING_CLOUD_USER_ID_KEY, "");
  const [teachingSyncStatus, setTeachingSyncStatus] =
    useBackupAwareStatus({
      tone: "neutral",
      message: "Teaching cloud sync has not run in this session.",
    }, backupExportedAt, "Backup exported. Manual Teaching sync controls are ready when you are.");
  const [teachingSyncing, setTeachingSyncing] = useState(false);
  const [cloudTeachingCounts, setCloudTeachingCounts] =
    useState<TeachingCloudCounts | null>(null);

  const canUseTeachingSync = Boolean(isConfigured && user && teachingSyncEnabled);
  const teachingSyncDisabled =
    !canUseTeachingSync || teachingSyncing || loading;
  const localTeachingSnapshot = {
    semesters: normalizeTeachingSemesters(storedTeachingSemesters),
    courses: normalizeTeachingCourses(storedTeachingCourses),
    meetings: normalizeTeachingMeetings(storedTeachingMeetings),
    prepSessions: normalizeTeachingPrepSessions(storedTeachingPrepSessions),
    gradingItems: normalizeTeachingGradingItems(storedTeachingGradingItems),
    taItems: normalizeTeachingTaItems(storedTeachingTaItems),
    teachingAssistants: normalizeTeachingAssistants(storedTeachingAssistants),
    officeHourVisits: normalizeTeachingOfficeHourVisits(
      storedTeachingOfficeHourVisits,
    ),
    courseNotes: normalizeTeachingCourseNotes(storedTeachingCourseNotes),
    resources: normalizeTeachingResources(storedTeachingResources),
    announcementReminders: normalizeTeachingAnnouncementReminders(
      storedTeachingAnnouncementReminders,
    ),
    courseTemplates: normalizeTeachingCourseTemplates(
      storedTeachingCourseTemplates,
    ),
  };
  const localTeachingCounts = getTeachingCounts(localTeachingSnapshot);

  function recordTeachingSyncSuccess(message: string) {
    const now = new Date().toISOString();

    setLastTeachingSyncAt(now);
    setLastTeachingSyncError("");
    setTeachingCloudUserId(user?.uid ?? "");
    setTeachingSyncStatus({
      tone: "success",
      message,
    });
  }

  function recordTeachingSyncError(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Teaching cloud sync did not complete.";

    setLastTeachingSyncError(message);
    setTeachingSyncStatus({
      tone: "error",
      message,
    });
  }

  function saveLocalTeachingSnapshot(snapshot: typeof localTeachingSnapshot) {
    setStoredTeachingSemesters(snapshot.semesters);
    setStoredTeachingCourses(snapshot.courses);
    setStoredTeachingMeetings(snapshot.meetings);
    setStoredTeachingPrepSessions(snapshot.prepSessions);
    setStoredTeachingGradingItems(snapshot.gradingItems);
    setStoredTeachingTaItems(snapshot.taItems);
    setStoredTeachingAssistants(snapshot.teachingAssistants);
    setStoredTeachingOfficeHourVisits(snapshot.officeHourVisits);
    setStoredTeachingCourseNotes(snapshot.courseNotes);
    setStoredTeachingResources(snapshot.resources);
    setStoredTeachingAnnouncementReminders(snapshot.announcementReminders);
    setStoredTeachingCourseTemplates(snapshot.courseTemplates);
  }

  async function refreshCloudTeachingCount() {
    if (!user || !isConfigured) {
      return;
    }

    setTeachingSyncing(true);

    try {
      const counts = await countUserTeachingData(user.uid);
      setCloudTeachingCounts(counts);
      setTeachingSyncStatus({
        tone: "success",
        message: `Cloud has ${counts.semesters} semesters, ${counts.courses} courses, ${counts.meetings} meetings, ${counts.prepSessions} prep sessions, ${counts.gradingItems} grading items, ${counts.taItems} TA items, ${counts.teachingAssistants} teaching assistants, ${counts.officeHourVisits} office-hour visits, ${counts.courseNotes} notes, ${counts.resources} resources, ${counts.announcementReminders} announcements, and ${counts.courseTemplates} templates.`,
      });
    } catch (error) {
      recordTeachingSyncError(error);
    } finally {
      setTeachingSyncing(false);
    }
  }

  async function runTeachingSync(action: SyncAction) {
    if (!user || teachingSyncDisabled) {
      return;
    }

    if (!backupConfirmed) {
      setTeachingSyncStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first Teaching sync.",
      });
      return;
    }

    setTeachingSyncing(true);

    try {
      const cloudSnapshot = await listUserTeachingData(user.uid);
      setCloudTeachingCounts(getTeachingCounts(cloudSnapshot));

      if (action === "push") {
        const mergeResult = await pushMergedUserTeachingData(
          user.uid,
          localTeachingSnapshot,
          cloudSnapshot,
        );
        saveLocalTeachingSnapshot(mergeResult);
        setCloudTeachingCounts(getTeachingCounts(mergeResult));
        recordTeachingSyncSuccess(
          `Pushed merged Teaching data to cloud. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
        );
        return;
      }

      const mergeResult = mergeTeachingDataForSync(
        localTeachingSnapshot,
        cloudSnapshot,
      );
      saveLocalTeachingSnapshot(mergeResult);

      if (action === "merge") {
        await batchUploadUserTeachingData(user.uid, mergeResult);
        setCloudTeachingCounts(getTeachingCounts(mergeResult));
      }

      recordTeachingSyncSuccess(
        action === "pull"
          ? `Pulled cloud Teaching data into local storage. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`
          : `Synced Teaching data both ways. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`,
      );
    } catch (error) {
      recordTeachingSyncError(error);
    } finally {
      setTeachingSyncing(false);
    }
  }

  return (
    <SyncPanel
      eyebrow="Teaching"
      title="Manual Teaching cloud sync"
      description="Only Teaching semesters, courses, class meetings, prep, grading, TA, office-hour, note, resource, announcement, and template records use this path. Teaching pages still read and write localStorage first."
      statusLabel={teachingSyncEnabled ? "Teaching sync enabled" : "Manual opt-in"}
    >
      <div className="settings-backup-summary">
        <span>{localTeachingCounts.semesters} local semesters</span>
        <span>{localTeachingCounts.courses} local courses</span>
        <span>{localTeachingCounts.meetings} local meetings</span>
        <span>{localTeachingCounts.prepSessions} local prep sessions</span>
        <span>{localTeachingCounts.gradingItems} local grading items</span>
        <span>{localTeachingCounts.taItems} local TA items</span>
        <span>{localTeachingCounts.teachingAssistants} local teaching assistants</span>
        <span>{localTeachingCounts.officeHourVisits} local office-hour visits</span>
        <span>{localTeachingCounts.courseNotes} local notes</span>
        <span>{localTeachingCounts.resources} local resources</span>
        <span>{localTeachingCounts.announcementReminders} local announcements</span>
        <span>{localTeachingCounts.courseTemplates} local templates</span>
        <span>
          {cloudTeachingCounts
            ? `${cloudTeachingCounts.semesters}/${cloudTeachingCounts.courses}/${cloudTeachingCounts.meetings}/${cloudTeachingCounts.prepSessions}/${cloudTeachingCounts.gradingItems}/${cloudTeachingCounts.taItems}/${cloudTeachingCounts.teachingAssistants}/${cloudTeachingCounts.officeHourVisits}/${cloudTeachingCounts.courseNotes}/${cloudTeachingCounts.resources}/${cloudTeachingCounts.announcementReminders}/${cloudTeachingCounts.courseTemplates} cloud`
            : "Cloud count not checked"}
        </span>
        <span>
          {lastTeachingSyncAt
            ? `Last sync ${formatTaskSyncDate(lastTeachingSyncAt)}`
            : "No Teaching sync yet"}
        </span>
      </div>

      <p className="settings-backup-status is-warning">
        Before first cloud push, clear old sample/demo data or confirm these
        are real records. Teaching sync will push the local Teaching stores
        that are currently in this browser.
      </p>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable Teaching cloud sync</strong>
          <small>
            This unlocks manual Teaching sync only. It does not sync Research,
            Source, Service, Mindspace, Timer, Dashboard planning, or all app
            data.
          </small>
        </span>
        <input
          type="checkbox"
          checked={teachingSyncEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setTeachingSyncEnabled(event.target.checked);
            setTeachingCloudUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so Teaching sync controls stay
          unavailable and local Teaching mode continues.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before Teaching data can touch Firestore. Local
          Teaching planning still works while signed out.
        </p>
      ) : null}

      {teachingCloudUserId && user && teachingCloudUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Teaching sync was last enabled for a different signed-in user. Review
          before merging local Teaching data with this account.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand this will merge local and cloud
        Teaching data without deleting missing local records.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          variant="soft"
          onClick={refreshCloudTeachingCount}
          disabled={!isConfigured || !user || teachingSyncing}
        >
          Check cloud Teaching count
        </Button>
        <Button
          type="button"
          onClick={() => runTeachingSync("push")}
          disabled={teachingSyncDisabled}
        >
          Push local Teaching to cloud
        </Button>
        <Button
          type="button"
          variant="soft"
          onClick={() => runTeachingSync("pull")}
          disabled={teachingSyncDisabled}
        >
          Pull cloud Teaching to local
        </Button>
        <Button
          type="button"
          onClick={() => runTeachingSync("merge")}
          disabled={teachingSyncDisabled}
        >
          Sync Teaching now / merge
        </Button>
      </div>

      <p className={`settings-backup-status is-${teachingSyncStatus.tone}`}>
        {teachingSyncStatus.message} Firestore paths:{" "}
        <code>users/{"{uid}"}/teachingSemesters/{"{semesterId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingCourses/{"{courseId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingMeetings/{"{meetingId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingPrepSessions/{"{prepId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingGradingItems/{"{gradingItemId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingTaItems/{"{taItemId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingAssistants/{"{assistantId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingOfficeHourVisits/{"{visitId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingCourseNotes/{"{noteId}"}</code>,{" "}
        <code>users/{"{uid}"}/teachingResources/{"{resourceId}"}</code>,{" "}
        <code>
          users/{"{uid}"}/teachingAnnouncementReminders/{"{reminderId}"}
        </code>
        , and{" "}
        <code>users/{"{uid}"}/teachingCourseTemplates/{"{templateId}"}</code>.
      </p>

      {lastTeachingSyncError ? (
        <p className="settings-backup-status is-error">
          Last saved Teaching sync error: {lastTeachingSyncError}
        </p>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{TEACHING_SYNC_ENABLED_KEY}</code>,{" "}
        <code>{LAST_TEACHING_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_TEACHING_SYNC_ERROR_KEY}</code>,{" "}
        <code>{TEACHING_CLOUD_USER_ID_KEY}</code>. Local data remains in{" "}
        <code>{TEACHING_SEMESTERS_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_COURSES_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_MEETINGS_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_PREP_SESSIONS_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_GRADING_ITEMS_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_TA_ITEMS_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_ASSISTANTS_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_COURSE_NOTES_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_RESOURCES_STORAGE_KEY}</code>,{" "}
        <code>{TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY}</code>, and{" "}
        <code>{TEACHING_COURSE_TEMPLATES_STORAGE_KEY}</code>.
      </p>

      <p className="muted-text">
        Pull and merge preserve local ids for matched records so course pages,
        semester links, Add-to-Today links, and related Teaching routes keep
        pointing at the same local records. Completed, archived, returned,
        posted, and resolved statuses stay closed, and local records missing
        from cloud are not deleted.
      </p>

      <p className="muted-text">{TEACHING_NOTE_DRAFT_SYNC_NOTE}</p>
    </SyncPanel>
  );
}
