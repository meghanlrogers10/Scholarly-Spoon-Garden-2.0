import { useMemo, useState } from "react";
import {
  MINDSPACE_GOALS_STORAGE_KEY,
  MINDSPACE_ITEMS_STORAGE_KEY,
} from "../../../../shared/constants/mindspaceStorage";
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
import { APP_SETTINGS_STORAGE_KEY } from "../../../../shared/constants/settingsStorage";
import {
  ADVISING_STUDENTS_STORAGE_KEY,
  SERVICE_ADMIN_ITEMS_STORAGE_KEY,
  SERVICE_BOUNDARY_LESSONS_STORAGE_KEY,
  SERVICE_COMMITTEES_STORAGE_KEY,
  SERVICE_ITEMS_STORAGE_KEY,
  SERVICE_REVIEW_LETTERS_STORAGE_KEY,
} from "../../../../shared/constants/serviceStorage";
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
  MANUAL_WORK_LOGS_STORAGE_KEY,
  TIMER_SESSIONS_STORAGE_KEY,
} from "../../../../shared/constants/timerStorage";
import {
  CLOUD_SAVE_ENABLED_KEY,
  CLOUD_SAVE_LAST_AREA_STATUS_KEY,
  CLOUD_SAVE_USER_ID_KEY,
  LAST_CLOUD_SAVE_ERROR_KEY,
  LAST_CLOUD_SAVE_SYNC_AT_KEY,
} from "../../../../shared/firebase/cloudSaveMetadata";
import {
  LAST_MINDSPACE_SYNC_AT_KEY,
  LAST_MINDSPACE_SYNC_ERROR_KEY,
  MINDSPACE_CLOUD_USER_ID_KEY,
} from "../../../../shared/firebase/mindspaceSyncMetadata";
import {
  batchUploadUserMindspaceData,
  listUserMindspaceData,
  mergeMindspaceDataForSync,
  normalizeMindspaceGoals,
  normalizeMindspaceItems,
} from "../../../../shared/firebase/mindspaceCloudService";
import {
  batchUploadUserPlanningData,
  listUserPlanningData,
} from "../../../../shared/firebase/planningCloudService";
import {
  LAST_PLANNING_SYNC_AT_KEY,
  LAST_PLANNING_SYNC_ERROR_KEY,
  PLANNING_CLOUD_USER_ID_KEY,
} from "../../../../shared/firebase/planningSyncMetadata";
import {
  batchUploadUserResearchData,
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
  type ResearchCloudSnapshot,
} from "../../../../shared/firebase/researchCloudService";
import {
  LAST_RESEARCH_SYNC_AT_KEY,
  LAST_RESEARCH_SYNC_ERROR_KEY,
  RESEARCH_CLOUD_USER_ID_KEY,
} from "../../../../shared/firebase/researchSyncMetadata";
import {
  batchUploadUserServiceData,
  getServiceCounts,
  listUserServiceData,
  mergeServiceDataForSync,
  normalizeAdvisingStudents,
  normalizeReviewLetters,
  normalizeServiceAdminItems,
  normalizeServiceBoundaryLessons,
  normalizeServiceCommittees,
  normalizeServiceItems,
} from "../../../../shared/firebase/serviceCloudService";
import {
  LAST_SERVICE_SYNC_AT_KEY,
  LAST_SERVICE_SYNC_ERROR_KEY,
  SERVICE_CLOUD_USER_ID_KEY,
} from "../../../../shared/firebase/serviceSyncMetadata";
import {
  mergeAppSettingsForSync,
  normalizeLocalAppSettings,
  readUserAppSettings,
  saveUserAppSettings,
} from "../../../../shared/firebase/settingsCloudService";
import {
  LAST_SETTINGS_SYNC_AT_KEY,
  LAST_SETTINGS_SYNC_ERROR_KEY,
  SETTINGS_CLOUD_USER_ID_KEY,
} from "../../../../shared/firebase/settingsSyncMetadata";
import {
  batchUploadUserTasks,
  listUserTasks,
  mergeTasksForSync,
} from "../../../../shared/firebase/taskCloudService";
import {
  LAST_TASK_SYNC_AT_KEY,
  LAST_TASK_SYNC_ERROR_KEY,
  TASK_CLOUD_USER_ID_KEY,
  formatTaskSyncDate,
} from "../../../../shared/firebase/taskSyncMetadata";
import {
  batchUploadUserTeachingData,
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
} from "../../../../shared/firebase/teachingCloudService";
import {
  LAST_TEACHING_SYNC_AT_KEY,
  LAST_TEACHING_SYNC_ERROR_KEY,
  TEACHING_CLOUD_USER_ID_KEY,
} from "../../../../shared/firebase/teachingSyncMetadata";
import {
  batchUploadUserTimerData,
  listUserTimerData,
  mergeTimerDataForSync,
} from "../../../../shared/firebase/timerCloudService";
import {
  LAST_TIMER_SYNC_AT_KEY,
  LAST_TIMER_SYNC_ERROR_KEY,
  TIMER_CLOUD_USER_ID_KEY,
} from "../../../../shared/firebase/timerSyncMetadata";
import { useLocalStorage } from "../../../../shared/hooks/useLocalStorage";
import { TASK_STORAGE_KEY, useTaskBridge } from "../../../../shared/hooks/useTaskBridge";
import { defaultAppSettings, type AppSettings } from "../../../../shared/types/settings";
import type { TimerSession } from "../../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../../shared/types/workLog";
import { Button } from "../../../../shared/ui/Button";
import {
  DAILY_CHECK_IN_STORAGE_KEY,
  END_OF_DAY_REVIEW_STORAGE_KEY,
  getPlanningCounts,
  mergePlanningForSync,
  normalizeDailyCheckIns,
  normalizeEndOfDayReviews,
  normalizePlannedTaskBlocks,
  PLANNED_TASK_BLOCK_STORAGE_KEY,
} from "../../../dashboard/utils/planningStorage";
import { SyncBackupGate } from "./SyncBackupGate";
import type { SyncOverviewItem, SyncPanelProps, SyncStatusMessage } from "./syncTypes";

type CloudSaveArea =
  | "settings"
  | "tasks"
  | "planning"
  | "timer"
  | "mindspace"
  | "service"
  | "teaching"
  | "research";

type CloudSaveAreaStatus = {
  tone: SyncStatusMessage["tone"];
  message: string;
  syncedAt?: string;
};

type CloudSaveAreaResult = {
  area: CloudSaveArea;
  label: string;
  ok: boolean;
  message: string;
};

const CLOUD_SAVE_ORDER: Array<{ area: CloudSaveArea; label: string }> = [
  { area: "settings", label: "Options" },
  { area: "tasks", label: "Tasks" },
  { area: "planning", label: "Planning" },
  { area: "timer", label: "Timer" },
  { area: "mindspace", label: "Mindspace" },
  { area: "service", label: "Service" },
  { area: "teaching", label: "Teaching" },
  { area: "research", label: "Research" },
];

function isSyncStale(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return Date.now() - timestamp > 24 * 60 * 60 * 1000;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CloudSaveControl({
  user,
  loading,
  isConfigured,
  backupConfirmed,
  setBackupConfirmed,
  onExportBackup,
  items,
}: SyncPanelProps & { items: SyncOverviewItem[] }) {
  const { tasks, setTasks } = useTaskBridge();
  const [cloudSaveEnabled, setCloudSaveEnabled] = useLocalStorage<boolean>(
    CLOUD_SAVE_ENABLED_KEY,
    false,
  );
  const [lastCloudSaveSyncAt, setLastCloudSaveSyncAt] = useLocalStorage<string>(
    LAST_CLOUD_SAVE_SYNC_AT_KEY,
    "",
  );
  const [lastCloudSaveError, setLastCloudSaveError] = useLocalStorage<string>(
    LAST_CLOUD_SAVE_ERROR_KEY,
    "",
  );
  const [cloudSaveUserId, setCloudSaveUserId] = useLocalStorage<string>(
    CLOUD_SAVE_USER_ID_KEY,
    "",
  );
  const [areaStatus, setAreaStatus] = useLocalStorage<
    Partial<Record<CloudSaveArea, CloudSaveAreaStatus>>
  >(CLOUD_SAVE_LAST_AREA_STATUS_KEY, {});
  const [cloudSaveStatus, setCloudSaveStatus] = useState<SyncStatusMessage>({
    tone: "neutral",
    message: "Cloud Save has not run in this session.",
  });
  const [syncing, setSyncing] = useState(false);
  const [lastResults, setLastResults] = useState<CloudSaveAreaResult[]>([]);

  const [storedAppSettings, setStoredAppSettings] = useLocalStorage<AppSettings>(
    APP_SETTINGS_STORAGE_KEY,
    defaultAppSettings,
  );
  const [, setLastSettingsSyncAt] = useLocalStorage<string>(
    LAST_SETTINGS_SYNC_AT_KEY,
    "",
  );
  const [, setLastSettingsSyncError] = useLocalStorage<string>(
    LAST_SETTINGS_SYNC_ERROR_KEY,
    "",
  );
  const [, setSettingsCloudUserId] =
    useLocalStorage<string>(SETTINGS_CLOUD_USER_ID_KEY, "");

  const [, setLastTaskSyncAt] = useLocalStorage<string>(LAST_TASK_SYNC_AT_KEY, "");
  const [, setLastTaskSyncError] = useLocalStorage<string>(
    LAST_TASK_SYNC_ERROR_KEY,
    "",
  );
  const [, setTaskCloudUserId] = useLocalStorage<string>(
    TASK_CLOUD_USER_ID_KEY,
    "",
  );

  const [storedCheckIns, setStoredCheckIns] = useLocalStorage<unknown[]>(
    DAILY_CHECK_IN_STORAGE_KEY,
    [],
  );
  const [storedPlannedBlocks, setStoredPlannedBlocks] = useLocalStorage<unknown[]>(
    PLANNED_TASK_BLOCK_STORAGE_KEY,
    [],
  );
  const [storedReviews, setStoredReviews] = useLocalStorage<unknown[]>(
    END_OF_DAY_REVIEW_STORAGE_KEY,
    [],
  );
  const [, setLastPlanningSyncAt] = useLocalStorage<string>(
    LAST_PLANNING_SYNC_AT_KEY,
    "",
  );
  const [, setLastPlanningSyncError] = useLocalStorage<string>(
    LAST_PLANNING_SYNC_ERROR_KEY,
    "",
  );
  const [, setPlanningCloudUserId] =
    useLocalStorage<string>(PLANNING_CLOUD_USER_ID_KEY, "");

  const [timerSessions, setTimerSessions] = useLocalStorage<TimerSession[]>(
    TIMER_SESSIONS_STORAGE_KEY,
    [],
  );
  const [manualWorkLogs, setManualWorkLogs] = useLocalStorage<
    ManualWorkLogEntry[]
  >(MANUAL_WORK_LOGS_STORAGE_KEY, []);
  const [, setLastTimerSyncAt] = useLocalStorage<string>(
    LAST_TIMER_SYNC_AT_KEY,
    "",
  );
  const [, setLastTimerSyncError] = useLocalStorage<string>(
    LAST_TIMER_SYNC_ERROR_KEY,
    "",
  );
  const [, setTimerCloudUserId] =
    useLocalStorage<string>(TIMER_CLOUD_USER_ID_KEY, "");

  const [storedMindspaceItems, setStoredMindspaceItems] = useLocalStorage<
    unknown[]
  >(MINDSPACE_ITEMS_STORAGE_KEY, []);
  const [storedMindspaceGoals, setStoredMindspaceGoals] = useLocalStorage<
    unknown[]
  >(MINDSPACE_GOALS_STORAGE_KEY, []);
  const [, setLastMindspaceSyncAt] = useLocalStorage<string>(
    LAST_MINDSPACE_SYNC_AT_KEY,
    "",
  );
  const [, setLastMindspaceSyncError] = useLocalStorage<string>(
    LAST_MINDSPACE_SYNC_ERROR_KEY,
    "",
  );
  const [, setMindspaceCloudUserId] =
    useLocalStorage<string>(MINDSPACE_CLOUD_USER_ID_KEY, "");

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
  const [, setLastServiceSyncAt] = useLocalStorage<string>(
    LAST_SERVICE_SYNC_AT_KEY,
    "",
  );
  const [, setLastServiceSyncError] = useLocalStorage<string>(
    LAST_SERVICE_SYNC_ERROR_KEY,
    "",
  );
  const [, setServiceCloudUserId] =
    useLocalStorage<string>(SERVICE_CLOUD_USER_ID_KEY, "");

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
  const [, setLastTeachingSyncAt] = useLocalStorage<string>(
    LAST_TEACHING_SYNC_AT_KEY,
    "",
  );
  const [, setLastTeachingSyncError] = useLocalStorage<string>(
    LAST_TEACHING_SYNC_ERROR_KEY,
    "",
  );
  const [, setTeachingCloudUserId] =
    useLocalStorage<string>(TEACHING_CLOUD_USER_ID_KEY, "");

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
  const [, setLastResearchSyncAt] = useLocalStorage<string>(
    LAST_RESEARCH_SYNC_AT_KEY,
    "",
  );
  const [, setLastResearchSyncError] = useLocalStorage<string>(
    LAST_RESEARCH_SYNC_ERROR_KEY,
    "",
  );
  const [, setResearchCloudUserId] =
    useLocalStorage<string>(RESEARCH_CLOUD_USER_ID_KEY, "");

  const enabledAreas = useMemo(() => {
    const enabledLabels = new Set(
      items.filter((item) => item.enabled).map((item) => item.label),
    );

    return CLOUD_SAVE_ORDER.filter((item) => enabledLabels.has(item.label));
  }, [items]);

  const shouldOfferSync =
    cloudSaveEnabled && enabledAreas.length > 0 && isSyncStale(lastCloudSaveSyncAt);

  function recordAreaSuccess(area: CloudSaveArea, message: string) {
    const now = new Date().toISOString();

    setAreaStatus((current) => ({
      ...current,
      [area]: { tone: "success", message, syncedAt: now },
    }));
  }

  function recordAreaError(area: CloudSaveArea, message: string) {
    setAreaStatus((current) => ({
      ...current,
      [area]: { tone: "error", message },
    }));
  }

  function recordDomainSyncSuccess(area: CloudSaveArea) {
    const now = new Date().toISOString();
    const uid = user?.uid ?? "";

    if (area === "settings") {
      setLastSettingsSyncAt(now);
      setLastSettingsSyncError("");
      setSettingsCloudUserId(uid);
      return;
    }

    if (area === "tasks") {
      setLastTaskSyncAt(now);
      setLastTaskSyncError("");
      setTaskCloudUserId(uid);
      return;
    }

    if (area === "planning") {
      setLastPlanningSyncAt(now);
      setLastPlanningSyncError("");
      setPlanningCloudUserId(uid);
      return;
    }

    if (area === "timer") {
      setLastTimerSyncAt(now);
      setLastTimerSyncError("");
      setTimerCloudUserId(uid);
      return;
    }

    if (area === "mindspace") {
      setLastMindspaceSyncAt(now);
      setLastMindspaceSyncError("");
      setMindspaceCloudUserId(uid);
      return;
    }

    if (area === "service") {
      setLastServiceSyncAt(now);
      setLastServiceSyncError("");
      setServiceCloudUserId(uid);
      return;
    }

    if (area === "teaching") {
      setLastTeachingSyncAt(now);
      setLastTeachingSyncError("");
      setTeachingCloudUserId(uid);
      return;
    }

    if (area === "research") {
      setLastResearchSyncAt(now);
      setLastResearchSyncError("");
      setResearchCloudUserId(uid);
    }
  }

  function recordDomainSyncError(area: CloudSaveArea, message: string) {
    if (area === "settings") setLastSettingsSyncError(message);
    if (area === "tasks") setLastTaskSyncError(message);
    if (area === "planning") setLastPlanningSyncError(message);
    if (area === "timer") setLastTimerSyncError(message);
    if (area === "mindspace") setLastMindspaceSyncError(message);
    if (area === "service") setLastServiceSyncError(message);
    if (area === "teaching") setLastTeachingSyncError(message);
    if (area === "research") setLastResearchSyncError(message);
  }

  async function syncSettings(uid: string) {
    const cloudSnapshot = await readUserAppSettings(uid);
    const mergeResult = mergeAppSettingsForSync(
      normalizeLocalAppSettings(storedAppSettings),
      cloudSnapshot.settings,
    );

    await saveUserAppSettings(uid, mergeResult.settings);
    setStoredAppSettings(mergeResult.settings);
    return `Options merged. ${mergeResult.reason}`;
  }

  async function syncTasks(uid: string) {
    const cloudTasks = await listUserTasks(uid);
    const mergeResult = mergeTasksForSync(tasks, cloudTasks);

    await batchUploadUserTasks(uid, mergeResult.tasks);
    setTasks(mergeResult.tasks);
    return `Tasks merged. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`;
  }

  async function syncPlanning(uid: string) {
    const localSnapshot = {
      checkIns: normalizeDailyCheckIns(storedCheckIns),
      plannedBlocks: normalizePlannedTaskBlocks(storedPlannedBlocks),
      reviews: normalizeEndOfDayReviews(storedReviews),
    };
    const cloudSnapshot = await listUserPlanningData(uid);
    const mergeResult = mergePlanningForSync(localSnapshot, cloudSnapshot);

    await batchUploadUserPlanningData(uid, mergeResult);
    setStoredCheckIns(mergeResult.checkIns);
    setStoredPlannedBlocks(mergeResult.plannedBlocks);
    setStoredReviews(mergeResult.reviews);

    const counts = getPlanningCounts(mergeResult);
    return `Planning merged. ${counts.checkIns} check-ins, ${counts.workingBlocks} working blocks, ${counts.plannedBlocks} planned blocks.`;
  }

  async function syncTimer(uid: string) {
    const localSnapshot = { timerSessions, manualWorkLogs };
    const cloudSnapshot = await listUserTimerData(uid);
    const mergeResult = mergeTimerDataForSync(localSnapshot, cloudSnapshot);

    await batchUploadUserTimerData(uid, mergeResult);
    setTimerSessions(mergeResult.timerSessions);
    setManualWorkLogs(mergeResult.manualWorkLogs);
    return `Timer/manual logs merged. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`;
  }

  async function syncMindspace(uid: string) {
    const localSnapshot = {
      items: normalizeMindspaceItems(storedMindspaceItems),
      goals: normalizeMindspaceGoals(storedMindspaceGoals),
    };
    const cloudSnapshot = await listUserMindspaceData(uid);
    const mergeResult = mergeMindspaceDataForSync(localSnapshot, cloudSnapshot);

    await batchUploadUserMindspaceData(uid, mergeResult);
    setStoredMindspaceItems(mergeResult.items);
    setStoredMindspaceGoals(mergeResult.goals);
    return `Mindspace merged. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`;
  }

  async function syncService(uid: string) {
    const localSnapshot = {
      serviceItems: normalizeServiceItems(storedServiceItems),
      committees: normalizeServiceCommittees(storedServiceCommittees),
      advisingStudents: normalizeAdvisingStudents(storedAdvisingStudents),
      reviewLetters: normalizeReviewLetters(storedReviewLetters),
      adminItems: normalizeServiceAdminItems(storedAdminItems),
      boundaryLessons: normalizeServiceBoundaryLessons(storedBoundaryLessons),
    };
    const cloudSnapshot = await listUserServiceData(uid);
    const mergeResult = mergeServiceDataForSync(localSnapshot, cloudSnapshot);

    await batchUploadUserServiceData(uid, mergeResult);
    setStoredServiceItems(mergeResult.serviceItems);
    setStoredServiceCommittees(mergeResult.committees);
    setStoredAdvisingStudents(mergeResult.advisingStudents);
    setStoredReviewLetters(mergeResult.reviewLetters);
    setStoredAdminItems(mergeResult.adminItems);
    setStoredBoundaryLessons(mergeResult.boundaryLessons);

    const counts = getServiceCounts(mergeResult);
    return `Service merged. ${counts.serviceItems} items, ${counts.committees} committees, ${counts.advisingStudents} advisees.`;
  }

  async function syncTeaching(uid: string) {
    const localSnapshot = {
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
    const cloudSnapshot = await listUserTeachingData(uid);
    const mergeResult = mergeTeachingDataForSync(localSnapshot, cloudSnapshot);

    await batchUploadUserTeachingData(uid, mergeResult);
    setStoredTeachingSemesters(mergeResult.semesters);
    setStoredTeachingCourses(mergeResult.courses);
    setStoredTeachingMeetings(mergeResult.meetings);
    setStoredTeachingPrepSessions(mergeResult.prepSessions);
    setStoredTeachingGradingItems(mergeResult.gradingItems);
    setStoredTeachingTaItems(mergeResult.taItems);
    setStoredTeachingAssistants(mergeResult.teachingAssistants);
    setStoredTeachingOfficeHourVisits(mergeResult.officeHourVisits);
    setStoredTeachingCourseNotes(mergeResult.courseNotes);
    setStoredTeachingResources(mergeResult.resources);
    setStoredTeachingAnnouncementReminders(mergeResult.announcementReminders);
    setStoredTeachingCourseTemplates(mergeResult.courseTemplates);

    const counts = getTeachingCounts(mergeResult);
    return `Teaching merged. ${counts.semesters} semesters, ${counts.courses} courses, ${counts.gradingItems} grading items.`;
  }

  async function syncResearch(uid: string) {
    const localSnapshot: ResearchCloudSnapshot = {
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
    const cloudSnapshot = await listUserResearchData(uid);
    const mergeResult = mergeResearchDataForSync(localSnapshot, cloudSnapshot);
    const uploadResult = await batchUploadUserResearchData(uid, mergeResult);

    setStoredResearchProjects(mergeResult.projects);
    setStoredResearchTasks(mergeResult.tasks);
    setStoredResearchLogEntries(mergeResult.logEntries);
    setStoredResearchDrafts(mergeResult.drafts);
    setStoredResearchSubmissions(mergeResult.submissions);
    setStoredResearchLiteratureSources(mergeResult.literatureSources);
    setStoredResearchLiteratureNotes(mergeResult.literatureNotes);
    setStoredResearchReadingNotes(mergeResult.readingNotes);
    setStoredResearchMindMapNodes(mergeResult.mindMapNodes);
    setStoredResearchSynthesisSections(mergeResult.synthesisSections);
    setStoredResearchPrismaRecords(mergeResult.prismaRecords);
    setStoredResearchPrismaCriteria(mergeResult.prismaCriteria);

    const counts = getResearchCounts(mergeResult);
    const skippedMessage =
      uploadResult.skippedLargeRecords.length > 0
        ? ` Skipped ${uploadResult.skippedLargeRecords.length} oversized local records for cloud upload; local copies were preserved.`
        : "";
    return `Research merged. ${counts.projects} projects, ${counts.tasks} tasks, ${counts.literatureSources} sources.${skippedMessage}`;
  }

  async function runArea(area: CloudSaveArea, uid: string) {
    if (area === "settings") return syncSettings(uid);
    if (area === "tasks") return syncTasks(uid);
    if (area === "planning") return syncPlanning(uid);
    if (area === "timer") return syncTimer(uid);
    if (area === "mindspace") return syncMindspace(uid);
    if (area === "service") return syncService(uid);
    if (area === "teaching") return syncTeaching(uid);
    return syncResearch(uid);
  }

  async function handleSyncAllEnabledAreas() {
    if (!user || !isConfigured || !cloudSaveEnabled || syncing) {
      return;
    }

    if (!backupConfirmed) {
      setCloudSaveStatus({
        tone: "warning",
        message: "Export or confirm a backup before the first Cloud Save sync.",
      });
      return;
    }

    if (enabledAreas.length === 0) {
      setCloudSaveStatus({
        tone: "warning",
        message: "Turn on at least one individual sync area before Cloud Save runs.",
      });
      return;
    }

    setSyncing(true);
    setLastResults([]);

    const results: CloudSaveAreaResult[] = [];

    for (const item of enabledAreas) {
      try {
        const message = await runArea(item.area, user.uid);
        recordDomainSyncSuccess(item.area);
        recordAreaSuccess(item.area, message);
        results.push({ area: item.area, label: item.label, ok: true, message });
      } catch (error) {
        const message = getErrorMessage(
          error,
          `${item.label} sync did not complete.`,
        );

        recordDomainSyncError(item.area, message);
        recordAreaError(item.area, message);
        results.push({ area: item.area, label: item.label, ok: false, message });
      }
    }

    const failedCount = results.filter((result) => !result.ok).length;
    const now = new Date().toISOString();

    setLastResults(results);
    setLastCloudSaveSyncAt(now);
    setCloudSaveUserId(user.uid);

    if (failedCount > 0) {
      const message = `Cloud Save finished with ${results.length - failedCount} successful area(s) and ${failedCount} area(s) needing attention.`;
      setLastCloudSaveError(message);
      setCloudSaveStatus({ tone: "warning", message });
    } else {
      const message = `Cloud Save synced ${results.length} enabled area(s).`;
      setLastCloudSaveError("");
      setCloudSaveStatus({ tone: "success", message });
    }

    setSyncing(false);
  }

  const syncDisabled =
    !isConfigured ||
    !user ||
    !cloudSaveEnabled ||
    syncing ||
    loading ||
    enabledAreas.length === 0;

  return (
    <section className="settings-task-sync-panel">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Cloud Save V1</p>
          <h2>One-button Cloud Save</h2>
          <p className="muted-text">
            Cloud Save coordinates the existing manual merge tools for the
            areas you have individually enabled below. Manual tools remain
            available below for troubleshooting.
          </p>
        </div>
        <span className="pill">
          {cloudSaveEnabled ? "Cloud Save on" : "Cloud Save off"}
        </span>
      </div>

      <div className="settings-backup-summary">
        <span>{user ? `Signed in as ${user.email ?? "this account"}` : "Signed out"}</span>
        <span>{isConfigured ? "Firebase configured" : "Local-only mode"}</span>
        <span>{enabledAreas.length} enabled area(s)</span>
        <span>
          {lastCloudSaveSyncAt
            ? `Last Cloud Save ${formatTaskSyncDate(lastCloudSaveSyncAt)}`
            : "No Cloud Save sync yet"}
        </span>
      </div>

      <label className="settings-toggle-row">
        <span>
          <strong>Enable Cloud Save</strong>
          <small>
            This does not force-enable every area. It only coordinates the
            individual sync areas you opt into below.
          </small>
        </span>
        <input
          type="checkbox"
          checked={cloudSaveEnabled}
          disabled={!isConfigured || !user}
          onChange={(event) => {
            setCloudSaveEnabled(event.target.checked);
            setCloudSaveUserId(event.target.checked ? user?.uid ?? "" : "");
          }}
        />
      </label>

      {!isConfigured ? (
        <p className="settings-backup-status is-warning">
          Firebase is not configured, so Cloud Save stays unavailable and the
          app remains local-only.
        </p>
      ) : null}

      {isConfigured && !user ? (
        <p className="settings-backup-status is-warning">
          Sign in is required before Cloud Save can be enabled. Local-first mode
          still works while signed out.
        </p>
      ) : null}

      {cloudSaveUserId && user && cloudSaveUserId !== user.uid ? (
        <p className="settings-backup-status is-warning">
          Cloud Save was last enabled for a different signed-in user. Review
          before syncing local data with this account.
        </p>
      ) : null}

      {shouldOfferSync ? (
        <p className="settings-backup-status is-warning">
          Cloud Save is on. Sync all enabled areas now when you are ready.
          Background automatic sync is deferred for a safer V2.
        </p>
      ) : null}

      <SyncBackupGate
        backupConfirmed={backupConfirmed}
        setBackupConfirmed={setBackupConfirmed}
        onExportBackup={onExportBackup}
      >
        I exported a backup or understand Cloud Save will merge local and cloud
        data for enabled areas without deleting missing local records.
      </SyncBackupGate>

      <div className="settings-backup-actions">
        <Button
          type="button"
          onClick={handleSyncAllEnabledAreas}
          disabled={syncDisabled}
        >
          {syncing ? "Syncing enabled areas..." : "Sync all enabled areas now"}
        </Button>
      </div>

      <p className={`settings-backup-status is-${cloudSaveStatus.tone}`}>
        {cloudSaveStatus.message}
      </p>

      {lastCloudSaveError ? (
        <p className="settings-backup-status is-error">
          Last saved Cloud Save error: {lastCloudSaveError}
        </p>
      ) : null}

      <div className="settings-backup-summary">
        {CLOUD_SAVE_ORDER.map((item) => {
          const isEnabled = enabledAreas.some(
            (enabledArea) => enabledArea.area === item.area,
          );
          const status = areaStatus[item.area];

          return (
            <span key={item.area}>
              {item.label}: {isEnabled ? "enabled" : "off"}
              {status?.syncedAt ? ` · ${formatTaskSyncDate(status.syncedAt)}` : ""}
              {status?.tone === "error" ? " · error" : ""}
            </span>
          );
        })}
      </div>

      {lastResults.length > 0 ? (
        <div className="settings-backup-summary">
          {lastResults.map((result) => (
            <span key={result.area}>
              {result.label}: {result.ok ? "synced" : "needs attention"}
            </span>
          ))}
        </div>
      ) : null}

      <p className="muted-text">
        Metadata keys: <code>{CLOUD_SAVE_ENABLED_KEY}</code>,{" "}
        <code>{LAST_CLOUD_SAVE_SYNC_AT_KEY}</code>,{" "}
        <code>{LAST_CLOUD_SAVE_ERROR_KEY}</code>,{" "}
        <code>{CLOUD_SAVE_USER_ID_KEY}</code>, and{" "}
        <code>{CLOUD_SAVE_LAST_AREA_STATUS_KEY}</code>. Sync order: Options,
        Tasks, Planning, Timer/manual logs, Mindspace, Service, Teaching, then
        Research.
      </p>

      <p className="muted-text">
        Active timer state, files, images, PDFs, Firebase Storage, realtime
        listeners, background intervals, and per-keystroke sync are not part of
        Cloud Save V1.
      </p>

      <p className="muted-text">
        Shared task storage remains in <code>{TASK_STORAGE_KEY}</code>; Cloud
        Save still treats localStorage as the immediate source of truth.
      </p>
    </section>
  );
}
