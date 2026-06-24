import { APP_SETTINGS_STORAGE_KEY } from "../constants/settingsStorage";
import {
  ADVISING_STUDENTS_STORAGE_KEY,
  SERVICE_ADMIN_ITEMS_STORAGE_KEY,
  SERVICE_BOUNDARY_LESSONS_STORAGE_KEY,
  SERVICE_COMMITTEES_STORAGE_KEY,
  SERVICE_ITEMS_STORAGE_KEY,
  SERVICE_REVIEW_LETTERS_STORAGE_KEY,
} from "../constants/serviceStorage";
import {
  MINDSPACE_GOALS_STORAGE_KEY,
  MINDSPACE_ITEMS_STORAGE_KEY,
} from "../constants/mindspaceStorage";
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
} from "../constants/researchStorage";
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
} from "../constants/teachingStorage";
import {
  MANUAL_WORK_LOGS_STORAGE_KEY,
  TIMER_SESSIONS_STORAGE_KEY,
} from "../constants/timerStorage";
import {
  CLOUD_SAVE_ENABLED_KEY,
  CLOUD_SAVE_LAST_AREA_STATUS_KEY,
  CLOUD_SAVE_USER_ID_KEY,
  LAST_CLOUD_SAVE_ERROR_KEY,
  LAST_CLOUD_SAVE_SYNC_AT_KEY,
} from "../firebase/cloudSaveMetadata";
import {
  batchUploadUserMindspaceData,
  listUserMindspaceData,
  mergeMindspaceDataForSync,
  normalizeMindspaceGoals,
  normalizeMindspaceItems,
} from "../firebase/mindspaceCloudService";
import {
  batchUploadUserPlanningData,
  listUserPlanningData,
} from "../firebase/planningCloudService";
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
} from "../firebase/researchCloudService";
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
} from "../firebase/serviceCloudService";
import {
  mergeAppSettingsForSync,
  normalizeLocalAppSettings,
  readUserAppSettings,
  saveUserAppSettings,
} from "../firebase/settingsCloudService";
import {
  batchUploadUserTasks,
  listUserTasks,
  mergeTasksForSync,
} from "../firebase/taskCloudService";
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
} from "../firebase/teachingCloudService";
import {
  batchUploadUserTimerData,
  listUserTimerData,
  mergeTimerDataForSync,
} from "../firebase/timerCloudService";
import {
  LAST_MINDSPACE_SYNC_AT_KEY,
  LAST_MINDSPACE_SYNC_ERROR_KEY,
  MINDSPACE_CLOUD_USER_ID_KEY,
} from "../firebase/mindspaceSyncMetadata";
import {
  LAST_PLANNING_SYNC_AT_KEY,
  LAST_PLANNING_SYNC_ERROR_KEY,
  PLANNING_CLOUD_USER_ID_KEY,
} from "../firebase/planningSyncMetadata";
import {
  LAST_RESEARCH_SYNC_AT_KEY,
  LAST_RESEARCH_SYNC_ERROR_KEY,
  RESEARCH_CLOUD_USER_ID_KEY,
} from "../firebase/researchSyncMetadata";
import {
  LAST_SERVICE_SYNC_AT_KEY,
  LAST_SERVICE_SYNC_ERROR_KEY,
  SERVICE_CLOUD_USER_ID_KEY,
} from "../firebase/serviceSyncMetadata";
import {
  LAST_SETTINGS_SYNC_AT_KEY,
  LAST_SETTINGS_SYNC_ERROR_KEY,
  SETTINGS_CLOUD_USER_ID_KEY,
} from "../firebase/settingsSyncMetadata";
import {
  LAST_TASK_SYNC_AT_KEY,
  LAST_TASK_SYNC_ERROR_KEY,
  TASK_CLOUD_USER_ID_KEY,
} from "../firebase/taskSyncMetadata";
import {
  LAST_TEACHING_SYNC_AT_KEY,
  LAST_TEACHING_SYNC_ERROR_KEY,
  TEACHING_CLOUD_USER_ID_KEY,
} from "../firebase/teachingSyncMetadata";
import {
  LAST_TIMER_SYNC_AT_KEY,
  LAST_TIMER_SYNC_ERROR_KEY,
  TIMER_CLOUD_USER_ID_KEY,
} from "../firebase/timerSyncMetadata";
import {
  DAILY_CHECK_IN_STORAGE_KEY,
  END_OF_DAY_REVIEW_STORAGE_KEY,
  getPlanningCounts,
  mergePlanningForSync,
  normalizeDailyCheckIns,
  normalizeEndOfDayReviews,
  normalizePlannedTaskBlocks,
  PLANNED_TASK_BLOCK_STORAGE_KEY,
} from "../../features/dashboard/utils/planningStorage";
import { defaultAppSettings } from "../types/settings";
import { TASK_STORAGE_KEY, normalizeTasks } from "../hooks/useTaskBridge";
import {
  LOCAL_STORAGE_CHANGE_EVENT,
  readLocalStorageValue,
  writeLocalStorageValue,
  type LocalStorageChangeDetail,
} from "../utils/localStorageSync";
import {
  APP_STORAGE_KEYS,
  APP_STORAGE_PREFIXES,
  isRecognizedAppStorageKey,
  type AppStorageCategory,
} from "../utils/appBackup";
import { isFirebaseConfigured } from "../firebase/firebaseClient";
import { saveLocalBackupSnapshot } from "./localBackup";
import {
  CLOUD_SAVE_AREA_LABELS,
  CLOUD_SAVE_ORDER,
  type CloudSaveArea,
  type CloudSaveAreaResult,
  type CloudSaveAreaStatus,
  type CloudSaveRunResult,
  type CloudSaveRuntimeStatus,
} from "./cloudSaveTypes";
import {
  compactCloudSaveQueue,
  enqueueCloudSaveArea,
  getPendingCloudSaveQueue,
  markCloudSaveQueueFailed,
  markCloudSaveQueueSynced,
  markCloudSaveQueueSyncing,
} from "./syncQueue";
import {
  LOCAL_BACKUP_HISTORY_KEY,
  LOCAL_BACKUP_SNAPSHOT_KEY,
} from "./localBackup";

export const CLOUD_SAVE_RUNTIME_STATUS_KEY = "ssg2.cloudSaveRuntimeStatus";
export const CLOUD_SAVE_REQUEST_SYNC_EVENT = "ssg2-cloud-save-request-sync";
export const CLOUD_SAVE_AUTO_DEBOUNCE_MS = 3000;

type RunCloudSaveOptions = {
  uid: string;
  areas?: CloudSaveArea[];
  reason?: string;
  manual?: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function readJson<T>(key: string, fallbackValue: T) {
  return readLocalStorageValue<T>(key, fallbackValue);
}

function writeJson<T>(key: string, value: T) {
  writeLocalStorageValue(key, value);
}

function writeString(key: string, value: string) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(
    new CustomEvent<LocalStorageChangeDetail>(LOCAL_STORAGE_CHANGE_EVENT, {
      detail: { key },
    }),
  );
}

export function setCloudSaveRuntimeStatus(
  status: Omit<CloudSaveRuntimeStatus, "lastUpdatedAt">,
) {
  writeJson(CLOUD_SAVE_RUNTIME_STATUS_KEY, {
    ...status,
    lastUpdatedAt: new Date().toISOString(),
  });
}

export function readCloudSaveRuntimeStatus(): CloudSaveRuntimeStatus {
  return readJson<CloudSaveRuntimeStatus>(CLOUD_SAVE_RUNTIME_STATUS_KEY, {
    tone: "neutral",
    message: "Cloud Save has not run in this session.",
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    pendingCount: getPendingCloudSaveQueue().length,
    lastUpdatedAt: "",
  });
}

function recordAreaStatus(area: CloudSaveArea, status: CloudSaveAreaStatus) {
  const current = readJson<Partial<Record<CloudSaveArea, CloudSaveAreaStatus>>>(
    CLOUD_SAVE_LAST_AREA_STATUS_KEY,
    {},
  );

  writeJson(CLOUD_SAVE_LAST_AREA_STATUS_KEY, {
    ...current,
    [area]: status,
  });
}

function recordDomainSyncSuccess(area: CloudSaveArea, uid: string, syncedAt: string) {
  const entries: Partial<Record<CloudSaveArea, [string, string, string]>> = {
    settings: [LAST_SETTINGS_SYNC_AT_KEY, LAST_SETTINGS_SYNC_ERROR_KEY, SETTINGS_CLOUD_USER_ID_KEY],
    tasks: [LAST_TASK_SYNC_AT_KEY, LAST_TASK_SYNC_ERROR_KEY, TASK_CLOUD_USER_ID_KEY],
    planning: [LAST_PLANNING_SYNC_AT_KEY, LAST_PLANNING_SYNC_ERROR_KEY, PLANNING_CLOUD_USER_ID_KEY],
    timer: [LAST_TIMER_SYNC_AT_KEY, LAST_TIMER_SYNC_ERROR_KEY, TIMER_CLOUD_USER_ID_KEY],
    mindspace: [LAST_MINDSPACE_SYNC_AT_KEY, LAST_MINDSPACE_SYNC_ERROR_KEY, MINDSPACE_CLOUD_USER_ID_KEY],
    service: [LAST_SERVICE_SYNC_AT_KEY, LAST_SERVICE_SYNC_ERROR_KEY, SERVICE_CLOUD_USER_ID_KEY],
    teaching: [LAST_TEACHING_SYNC_AT_KEY, LAST_TEACHING_SYNC_ERROR_KEY, TEACHING_CLOUD_USER_ID_KEY],
    research: [LAST_RESEARCH_SYNC_AT_KEY, LAST_RESEARCH_SYNC_ERROR_KEY, RESEARCH_CLOUD_USER_ID_KEY],
  };
  const keys = entries[area];

  if (!keys) {
    return;
  }

  writeString(keys[0], syncedAt);
  writeString(keys[1], "");
  writeString(keys[2], uid);
}

function recordDomainSyncError(area: CloudSaveArea, message: string) {
  const entries: Partial<Record<CloudSaveArea, string>> = {
    settings: LAST_SETTINGS_SYNC_ERROR_KEY,
    tasks: LAST_TASK_SYNC_ERROR_KEY,
    planning: LAST_PLANNING_SYNC_ERROR_KEY,
    timer: LAST_TIMER_SYNC_ERROR_KEY,
    mindspace: LAST_MINDSPACE_SYNC_ERROR_KEY,
    service: LAST_SERVICE_SYNC_ERROR_KEY,
    teaching: LAST_TEACHING_SYNC_ERROR_KEY,
    research: LAST_RESEARCH_SYNC_ERROR_KEY,
  };
  const key = entries[area];

  if (key) {
    writeString(key, message);
  }
}

async function syncSettings(uid: string) {
  const storedAppSettings = readJson(APP_SETTINGS_STORAGE_KEY, defaultAppSettings);
  const cloudSnapshot = await readUserAppSettings(uid);
  const mergeResult = mergeAppSettingsForSync(
    normalizeLocalAppSettings(storedAppSettings),
    cloudSnapshot.settings,
  );

  await saveUserAppSettings(uid, mergeResult.settings);
  writeJson(APP_SETTINGS_STORAGE_KEY, mergeResult.settings);
  return `Options merged. ${mergeResult.reason}`;
}

async function syncTasks(uid: string) {
  const tasks = normalizeTasks(readJson(TASK_STORAGE_KEY, []));
  const cloudTasks = await listUserTasks(uid);
  const mergeResult = mergeTasksForSync(tasks, cloudTasks);

  await batchUploadUserTasks(uid, mergeResult.tasks);
  writeJson(TASK_STORAGE_KEY, mergeResult.tasks);
  return `Tasks merged. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`;
}

async function syncPlanning(uid: string) {
  const localSnapshot = {
    checkIns: normalizeDailyCheckIns(readJson(DAILY_CHECK_IN_STORAGE_KEY, [])),
    plannedBlocks: normalizePlannedTaskBlocks(readJson(PLANNED_TASK_BLOCK_STORAGE_KEY, [])),
    reviews: normalizeEndOfDayReviews(readJson(END_OF_DAY_REVIEW_STORAGE_KEY, [])),
  };
  const cloudSnapshot = await listUserPlanningData(uid);
  const mergeResult = mergePlanningForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserPlanningData(uid, mergeResult);
  writeJson(DAILY_CHECK_IN_STORAGE_KEY, mergeResult.checkIns);
  writeJson(PLANNED_TASK_BLOCK_STORAGE_KEY, mergeResult.plannedBlocks);
  writeJson(END_OF_DAY_REVIEW_STORAGE_KEY, mergeResult.reviews);

  const counts = getPlanningCounts(mergeResult);
  return `Planning merged. ${counts.checkIns} check-ins, ${counts.workingBlocks} working blocks, ${counts.plannedBlocks} planned blocks.`;
}

async function syncTimer(uid: string) {
  const localSnapshot = {
    timerSessions: readJson(TIMER_SESSIONS_STORAGE_KEY, []),
    manualWorkLogs: readJson(MANUAL_WORK_LOGS_STORAGE_KEY, []),
  };
  const cloudSnapshot = await listUserTimerData(uid);
  const mergeResult = mergeTimerDataForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserTimerData(uid, mergeResult);
  writeJson(TIMER_SESSIONS_STORAGE_KEY, mergeResult.timerSessions);
  writeJson(MANUAL_WORK_LOGS_STORAGE_KEY, mergeResult.manualWorkLogs);
  return `Timer/manual logs merged. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`;
}

async function syncMindspace(uid: string) {
  const localSnapshot = {
    items: normalizeMindspaceItems(readJson(MINDSPACE_ITEMS_STORAGE_KEY, [])),
    goals: normalizeMindspaceGoals(readJson(MINDSPACE_GOALS_STORAGE_KEY, [])),
  };
  const cloudSnapshot = await listUserMindspaceData(uid);
  const mergeResult = mergeMindspaceDataForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserMindspaceData(uid, mergeResult);
  writeJson(MINDSPACE_ITEMS_STORAGE_KEY, mergeResult.items);
  writeJson(MINDSPACE_GOALS_STORAGE_KEY, mergeResult.goals);
  return `Mindspace merged. Added ${mergeResult.addedCount}, updated ${mergeResult.updatedCount}, deduped ${mergeResult.dedupedCount}.`;
}

async function syncService(uid: string) {
  const localSnapshot = {
    serviceItems: normalizeServiceItems(readJson(SERVICE_ITEMS_STORAGE_KEY, [])),
    committees: normalizeServiceCommittees(readJson(SERVICE_COMMITTEES_STORAGE_KEY, [])),
    advisingStudents: normalizeAdvisingStudents(readJson(ADVISING_STUDENTS_STORAGE_KEY, [])),
    reviewLetters: normalizeReviewLetters(readJson(SERVICE_REVIEW_LETTERS_STORAGE_KEY, [])),
    adminItems: normalizeServiceAdminItems(readJson(SERVICE_ADMIN_ITEMS_STORAGE_KEY, [])),
    boundaryLessons: normalizeServiceBoundaryLessons(readJson(SERVICE_BOUNDARY_LESSONS_STORAGE_KEY, [])),
  };
  const cloudSnapshot = await listUserServiceData(uid);
  const mergeResult = mergeServiceDataForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserServiceData(uid, mergeResult);
  writeJson(SERVICE_ITEMS_STORAGE_KEY, mergeResult.serviceItems);
  writeJson(SERVICE_COMMITTEES_STORAGE_KEY, mergeResult.committees);
  writeJson(ADVISING_STUDENTS_STORAGE_KEY, mergeResult.advisingStudents);
  writeJson(SERVICE_REVIEW_LETTERS_STORAGE_KEY, mergeResult.reviewLetters);
  writeJson(SERVICE_ADMIN_ITEMS_STORAGE_KEY, mergeResult.adminItems);
  writeJson(SERVICE_BOUNDARY_LESSONS_STORAGE_KEY, mergeResult.boundaryLessons);

  const counts = getServiceCounts(mergeResult);
  return `Service merged. ${counts.serviceItems} items, ${counts.committees} committees, ${counts.advisingStudents} advisees.`;
}

async function syncTeaching(uid: string) {
  const localSnapshot = {
    semesters: normalizeTeachingSemesters(readJson(TEACHING_SEMESTERS_STORAGE_KEY, [])),
    courses: normalizeTeachingCourses(readJson(TEACHING_COURSES_STORAGE_KEY, [])),
    meetings: normalizeTeachingMeetings(readJson(TEACHING_MEETINGS_STORAGE_KEY, [])),
    prepSessions: normalizeTeachingPrepSessions(readJson(TEACHING_PREP_SESSIONS_STORAGE_KEY, [])),
    gradingItems: normalizeTeachingGradingItems(readJson(TEACHING_GRADING_ITEMS_STORAGE_KEY, [])),
    taItems: normalizeTeachingTaItems(readJson(TEACHING_TA_ITEMS_STORAGE_KEY, [])),
    teachingAssistants: normalizeTeachingAssistants(readJson(TEACHING_ASSISTANTS_STORAGE_KEY, [])),
    officeHourVisits: normalizeTeachingOfficeHourVisits(readJson(TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY, [])),
    courseNotes: normalizeTeachingCourseNotes(readJson(TEACHING_COURSE_NOTES_STORAGE_KEY, [])),
    resources: normalizeTeachingResources(readJson(TEACHING_RESOURCES_STORAGE_KEY, [])),
    announcementReminders: normalizeTeachingAnnouncementReminders(readJson(TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY, [])),
    courseTemplates: normalizeTeachingCourseTemplates(readJson(TEACHING_COURSE_TEMPLATES_STORAGE_KEY, [])),
  };
  const cloudSnapshot = await listUserTeachingData(uid);
  const mergeResult = mergeTeachingDataForSync(localSnapshot, cloudSnapshot);

  await batchUploadUserTeachingData(uid, mergeResult);
  writeJson(TEACHING_SEMESTERS_STORAGE_KEY, mergeResult.semesters);
  writeJson(TEACHING_COURSES_STORAGE_KEY, mergeResult.courses);
  writeJson(TEACHING_MEETINGS_STORAGE_KEY, mergeResult.meetings);
  writeJson(TEACHING_PREP_SESSIONS_STORAGE_KEY, mergeResult.prepSessions);
  writeJson(TEACHING_GRADING_ITEMS_STORAGE_KEY, mergeResult.gradingItems);
  writeJson(TEACHING_TA_ITEMS_STORAGE_KEY, mergeResult.taItems);
  writeJson(TEACHING_ASSISTANTS_STORAGE_KEY, mergeResult.teachingAssistants);
  writeJson(TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY, mergeResult.officeHourVisits);
  writeJson(TEACHING_COURSE_NOTES_STORAGE_KEY, mergeResult.courseNotes);
  writeJson(TEACHING_RESOURCES_STORAGE_KEY, mergeResult.resources);
  writeJson(TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY, mergeResult.announcementReminders);
  writeJson(TEACHING_COURSE_TEMPLATES_STORAGE_KEY, mergeResult.courseTemplates);

  const counts = getTeachingCounts(mergeResult);
  return `Teaching merged. ${counts.semesters} semesters, ${counts.courses} courses, ${counts.gradingItems} grading items.`;
}

async function syncResearch(uid: string) {
  const localSnapshot: ResearchCloudSnapshot = {
    projects: normalizeResearchProjects(readJson(RESEARCH_PROJECTS_STORAGE_KEY, [])),
    tasks: normalizeResearchTasks(readJson(RESEARCH_TASKS_STORAGE_KEY, [])),
    logEntries: normalizeResearchLogEntries(readJson(RESEARCH_LOG_ENTRIES_STORAGE_KEY, [])),
    drafts: normalizeResearchDrafts(readJson(RESEARCH_DRAFTS_STORAGE_KEY, [])),
    submissions: normalizeResearchSubmissions(readJson(RESEARCH_SUBMISSIONS_STORAGE_KEY, [])),
    literatureSources: normalizeResearchLiteratureSources(readJson(RESEARCH_LITERATURE_SOURCES_STORAGE_KEY, [])),
    literatureNotes: normalizeResearchLiteratureNotes(readJson(RESEARCH_LITERATURE_NOTES_STORAGE_KEY, [])),
    readingNotes: normalizeResearchReadingNotes(readJson(RESEARCH_READING_NOTES_STORAGE_KEY, [])),
    mindMapNodes: normalizeResearchMindMapNodes(readJson(RESEARCH_MIND_MAP_NODES_STORAGE_KEY, [])),
    synthesisSections: normalizeResearchSynthesisSections(readJson(RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY, [])),
    prismaRecords: normalizeResearchPrismaRecords(readJson(RESEARCH_PRISMA_RECORDS_STORAGE_KEY, [])),
    prismaCriteria: normalizeResearchPrismaCriteriaList(readJson(RESEARCH_PRISMA_CRITERIA_STORAGE_KEY, [])),
  };
  const cloudSnapshot = await listUserResearchData(uid);
  const mergeResult = mergeResearchDataForSync(localSnapshot, cloudSnapshot);
  const uploadResult = await batchUploadUserResearchData(uid, mergeResult);

  writeJson(RESEARCH_PROJECTS_STORAGE_KEY, mergeResult.projects);
  writeJson(RESEARCH_TASKS_STORAGE_KEY, mergeResult.tasks);
  writeJson(RESEARCH_LOG_ENTRIES_STORAGE_KEY, mergeResult.logEntries);
  writeJson(RESEARCH_DRAFTS_STORAGE_KEY, mergeResult.drafts);
  writeJson(RESEARCH_SUBMISSIONS_STORAGE_KEY, mergeResult.submissions);
  writeJson(RESEARCH_LITERATURE_SOURCES_STORAGE_KEY, mergeResult.literatureSources);
  writeJson(RESEARCH_LITERATURE_NOTES_STORAGE_KEY, mergeResult.literatureNotes);
  writeJson(RESEARCH_READING_NOTES_STORAGE_KEY, mergeResult.readingNotes);
  writeJson(RESEARCH_MIND_MAP_NODES_STORAGE_KEY, mergeResult.mindMapNodes);
  writeJson(RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY, mergeResult.synthesisSections);
  writeJson(RESEARCH_PRISMA_RECORDS_STORAGE_KEY, mergeResult.prismaRecords);
  writeJson(RESEARCH_PRISMA_CRITERIA_STORAGE_KEY, mergeResult.prismaCriteria);

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

export async function runCloudSave(options: RunCloudSaveOptions): Promise<CloudSaveRunResult> {
  const areas = options.areas?.length ? options.areas : CLOUD_SAVE_ORDER;
  const syncedAt = new Date().toISOString();
  const results: CloudSaveAreaResult[] = [];

  saveLocalBackupSnapshot(options.uid);
  markCloudSaveQueueSyncing(areas);

  for (const area of areas) {
    const label = CLOUD_SAVE_AREA_LABELS[area];

    try {
      const message = await runArea(area, options.uid);
      recordDomainSyncSuccess(area, options.uid, syncedAt);
      recordAreaStatus(area, { tone: "success", message, syncedAt });
      markCloudSaveQueueSynced(area);
      results.push({ area, label, ok: true, message });
    } catch (error) {
      const message = getErrorMessage(error, `${label} sync did not complete.`);

      recordDomainSyncError(area, message);
      recordAreaStatus(area, { tone: "error", message });
      markCloudSaveQueueFailed(area, message);
      results.push({ area, label, ok: false, message });
    }
  }

  const failedCount = results.filter((result) => !result.ok).length;

  writeString(LAST_CLOUD_SAVE_SYNC_AT_KEY, syncedAt);
  writeString(CLOUD_SAVE_USER_ID_KEY, options.uid);
  saveLocalBackupSnapshot(options.uid);
  compactCloudSaveQueue();

  if (failedCount > 0) {
    const message = `Cloud Save finished with ${results.length - failedCount} successful area(s) and ${failedCount} area(s) waiting to retry.`;
    writeString(LAST_CLOUD_SAVE_ERROR_KEY, message);
    setCloudSaveRuntimeStatus({
      tone: "warning",
      message,
      online: navigator.onLine,
      pendingCount: getPendingCloudSaveQueue().length,
    });
  } else {
    const message = options.manual
      ? `Cloud Save synced ${results.length} supported area(s).`
      : `Cloud Save synced recent changes.`;
    writeString(LAST_CLOUD_SAVE_ERROR_KEY, "");
    setCloudSaveRuntimeStatus({
      tone: "success",
      message,
      online: navigator.onLine,
      pendingCount: getPendingCloudSaveQueue().length,
    });
  }

  return { results, syncedAt, failedCount };
}

export function requestCloudSaveSync() {
  window.dispatchEvent(new Event(CLOUD_SAVE_REQUEST_SYNC_EVENT));
}

function isCloudSaveEnabled() {
  return readJson(CLOUD_SAVE_ENABLED_KEY, false);
}

export function canAttemptCloudSave(uid: string | null | undefined) {
  return Boolean(uid && isFirebaseConfigured && isCloudSaveEnabled() && navigator.onLine);
}

const categoryToArea: Partial<Record<AppStorageCategory, CloudSaveArea>> = {
  settings: "settings",
  "shared-tasks": "tasks",
  dashboard: "planning",
  timer: "timer",
  research: "research",
  teaching: "teaching",
  service: "service",
  mindspace: "mindspace",
};

const internalSyncKeys = new Set([
  CLOUD_SAVE_LAST_AREA_STATUS_KEY,
  CLOUD_SAVE_RUNTIME_STATUS_KEY,
  LOCAL_BACKUP_SNAPSHOT_KEY,
  LOCAL_BACKUP_HISTORY_KEY,
  "ssg2.cloudSaveSyncQueue",
]);

export function queueStorageKeyForCloudSave(key: string) {
  if (internalSyncKeys.has(key)) {
    return null;
  }

  if (!isRecognizedAppStorageKey(key)) {
    return null;
  }

  const exact = APP_STORAGE_KEYS.find((definition) => definition.key === key);
  const prefixed =
    exact ??
    APP_STORAGE_PREFIXES.find((definition) =>
      key.startsWith(definition.prefix),
    );
  const area = prefixed ? categoryToArea[prefixed.category] ?? null : null;

  if (area) {
    enqueueCloudSaveArea(area, "Local changes saved in this browser.");
  }

  return area;
}
