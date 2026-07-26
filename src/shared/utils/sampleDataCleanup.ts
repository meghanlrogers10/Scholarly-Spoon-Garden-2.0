import {
  ADVISING_STUDENTS_STORAGE_KEY,
  SERVICE_ADMIN_ITEMS_STORAGE_KEY,
  SERVICE_BOUNDARY_LESSONS_STORAGE_KEY,
  SERVICE_COMMITTEES_STORAGE_KEY,
  SERVICE_ITEMS_STORAGE_KEY,
  SERVICE_REVIEW_LETTERS_STORAGE_KEY,
} from "../constants/serviceStorage";
import { APP_SETTINGS_STORAGE_KEY } from "../constants/settingsStorage";
import {
  LEGACY_RESEARCH_DRAFTS_STORAGE_KEY,
  LEGACY_RESEARCH_LITERATURE_SOURCES_STORAGE_KEY,
  LEGACY_RESEARCH_LOG_ENTRIES_STORAGE_KEY,
  LEGACY_RESEARCH_MIND_MAP_EDGES_STORAGE_KEY,
  LEGACY_RESEARCH_MIND_MAP_NODES_STORAGE_KEY,
  LEGACY_RESEARCH_PRISMA_RECORDS_STORAGE_KEY,
  LEGACY_RESEARCH_READING_NOTES_STORAGE_KEY,
  LEGACY_RESEARCH_SUBMISSIONS_STORAGE_KEY,
  LEGACY_RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY,
  RESEARCH_DRAFTS_STORAGE_KEY,
  RESEARCH_LITERATURE_NOTES_STORAGE_KEY,
  RESEARCH_LITERATURE_SOURCES_STORAGE_KEY,
  RESEARCH_LOG_ENTRIES_STORAGE_KEY,
  RESEARCH_MIND_MAP_EDGES_STORAGE_KEY,
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
  MANUAL_WORK_LOGS_STORAGE_KEY,
  TIMER_SESSIONS_STORAGE_KEY,
} from "../constants/timerStorage";
import {
  MINDSPACE_GOALS_STORAGE_KEY,
  MINDSPACE_ITEMS_STORAGE_KEY,
} from "../constants/mindspaceStorage";
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
import { TASK_STORAGE_KEY } from "../hooks/useTaskBridge";
import { notifyLocalStorageChange } from "./localStorageSync";

export type SampleDataCleanupCategory =
  | "research"
  | "teaching"
  | "service"
  | "mindspace";
export type DashboardTasksCleanupCategory =
  | "tasks"
  | "dashboard"
  | "timer"
  | "calendar-settings";

export type SampleDataCleanupTarget = {
  key: string;
  category: SampleDataCleanupCategory;
  label: string;
};

export type SampleDataCleanupPrefixTarget = {
  prefix: string;
  category: SampleDataCleanupCategory;
  label: string;
};

export type SampleDataCleanupSummary = {
  matchingKeys: SampleDataCleanupTarget[];
  matchingPrefixKeys: SampleDataCleanupTarget[];
  keyCount: number;
  recordCount: number;
  countsByCategory: Record<SampleDataCleanupCategory, number>;
};

export type SampleDataCleanupResult = SampleDataCleanupSummary & {
  removedKeys: string[];
};

export type DashboardTasksCleanupTarget = {
  key: string;
  category: DashboardTasksCleanupCategory;
  label: string;
};

export type DashboardTasksCleanupSummary = {
  matchingKeys: DashboardTasksCleanupTarget[];
  keyCount: number;
  recordCount: number;
  countsByCategory: Record<DashboardTasksCleanupCategory, number>;
  sampleCalendarEventsEnabled: boolean;
};

export type DashboardTasksCleanupResult = DashboardTasksCleanupSummary & {
  removedKeys: string[];
  disabledSampleCalendarEvents: boolean;
};

const emptyCounts: Record<SampleDataCleanupCategory, number> = {
  research: 0,
  teaching: 0,
  service: 0,
  mindspace: 0,
};

const emptyDashboardTasksCounts: Record<DashboardTasksCleanupCategory, number> = {
  tasks: 0,
  dashboard: 0,
  timer: 0,
  "calendar-settings": 0,
};

export const SAMPLE_DATA_CLEANUP_KEYS: SampleDataCleanupTarget[] = [
  { key: RESEARCH_PROJECTS_STORAGE_KEY, category: "research", label: "Research projects" },
  { key: RESEARCH_TASKS_STORAGE_KEY, category: "research", label: "Research tasks" },
  { key: RESEARCH_LOG_ENTRIES_STORAGE_KEY, category: "research", label: "Research log entries" },
  { key: RESEARCH_DRAFTS_STORAGE_KEY, category: "research", label: "Research drafts" },
  { key: RESEARCH_SUBMISSIONS_STORAGE_KEY, category: "research", label: "Research submissions" },
  { key: RESEARCH_LITERATURE_SOURCES_STORAGE_KEY, category: "research", label: "Research literature sources" },
  { key: RESEARCH_LITERATURE_NOTES_STORAGE_KEY, category: "research", label: "Research literature notes" },
  { key: RESEARCH_READING_NOTES_STORAGE_KEY, category: "research", label: "Research reading notes" },
  { key: RESEARCH_MIND_MAP_NODES_STORAGE_KEY, category: "research", label: "Research mind map nodes" },
  { key: RESEARCH_MIND_MAP_EDGES_STORAGE_KEY, category: "research", label: "Research mind map edges" },
  { key: RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY, category: "research", label: "Research synthesis sections" },
  { key: RESEARCH_PRISMA_RECORDS_STORAGE_KEY, category: "research", label: "Research PRISMA records" },
  { key: RESEARCH_PRISMA_CRITERIA_STORAGE_KEY, category: "research", label: "Research PRISMA criteria" },
  { key: LEGACY_RESEARCH_LOG_ENTRIES_STORAGE_KEY, category: "research", label: "Research log entries" },
  { key: LEGACY_RESEARCH_DRAFTS_STORAGE_KEY, category: "research", label: "Research drafts" },
  { key: LEGACY_RESEARCH_SUBMISSIONS_STORAGE_KEY, category: "research", label: "Research submissions" },
  { key: LEGACY_RESEARCH_LITERATURE_SOURCES_STORAGE_KEY, category: "research", label: "Research literature sources" },
  { key: LEGACY_RESEARCH_READING_NOTES_STORAGE_KEY, category: "research", label: "Research reading notes" },
  { key: LEGACY_RESEARCH_MIND_MAP_NODES_STORAGE_KEY, category: "research", label: "Research mind map nodes" },
  { key: LEGACY_RESEARCH_MIND_MAP_EDGES_STORAGE_KEY, category: "research", label: "Research mind map edges" },
  { key: LEGACY_RESEARCH_SYNTHESIS_SECTIONS_STORAGE_KEY, category: "research", label: "Research synthesis sections" },
  { key: LEGACY_RESEARCH_PRISMA_RECORDS_STORAGE_KEY, category: "research", label: "Research PRISMA records" },
  { key: TEACHING_SEMESTERS_STORAGE_KEY, category: "teaching", label: "Teaching semesters" },
  { key: TEACHING_COURSES_STORAGE_KEY, category: "teaching", label: "Teaching courses" },
  { key: TEACHING_MEETINGS_STORAGE_KEY, category: "teaching", label: "Teaching meetings" },
  { key: TEACHING_PREP_SESSIONS_STORAGE_KEY, category: "teaching", label: "Teaching prep sessions" },
  { key: TEACHING_GRADING_ITEMS_STORAGE_KEY, category: "teaching", label: "Teaching grading items" },
  { key: TEACHING_TA_ITEMS_STORAGE_KEY, category: "teaching", label: "Teaching TA items" },
  { key: TEACHING_ASSISTANTS_STORAGE_KEY, category: "teaching", label: "Teaching assistants" },
  { key: TEACHING_OFFICE_HOUR_VISITS_STORAGE_KEY, category: "teaching", label: "Teaching office hour visits" },
  { key: TEACHING_COURSE_NOTES_STORAGE_KEY, category: "teaching", label: "Teaching course notes" },
  { key: TEACHING_RESOURCES_STORAGE_KEY, category: "teaching", label: "Teaching resources" },
  { key: TEACHING_ANNOUNCEMENT_REMINDERS_STORAGE_KEY, category: "teaching", label: "Teaching announcement reminders" },
  { key: TEACHING_COURSE_TEMPLATES_STORAGE_KEY, category: "teaching", label: "Teaching course templates" },
  { key: SERVICE_ITEMS_STORAGE_KEY, category: "service", label: "Service items" },
  { key: SERVICE_COMMITTEES_STORAGE_KEY, category: "service", label: "Service committees" },
  { key: ADVISING_STUDENTS_STORAGE_KEY, category: "service", label: "Advising students" },
  { key: SERVICE_REVIEW_LETTERS_STORAGE_KEY, category: "service", label: "Service reviews and letters" },
  { key: SERVICE_ADMIN_ITEMS_STORAGE_KEY, category: "service", label: "Service admin items" },
  { key: SERVICE_BOUNDARY_LESSONS_STORAGE_KEY, category: "service", label: "Service boundary lessons" },
  { key: MINDSPACE_ITEMS_STORAGE_KEY, category: "mindspace", label: "Mindspace items" },
  { key: MINDSPACE_GOALS_STORAGE_KEY, category: "mindspace", label: "Mindspace goals" },
];

export const SAMPLE_DATA_CLEANUP_PREFIXES: SampleDataCleanupPrefixTarget[] = [];

export const DASHBOARD_TASKS_CLEANUP_KEYS: DashboardTasksCleanupTarget[] = [
  { key: TASK_STORAGE_KEY, category: "tasks", label: "Shared tasks" },
  { key: "ssg2.dailyCheckIns", category: "dashboard", label: "Daily check-ins and working blocks" },
  { key: "ssg2.workingBlocks", category: "dashboard", label: "Legacy working blocks" },
  { key: "ssg2.plannedTaskBlocks", category: "dashboard", label: "Planned task blocks" },
  { key: "ssg2.endOfDayReviews", category: "dashboard", label: "End-of-day reviews" },
  { key: "ssg2.quickCaptures", category: "dashboard", label: "Dashboard quick captures" },
  { key: TIMER_SESSIONS_STORAGE_KEY, category: "timer", label: "Timer sessions" },
  { key: MANUAL_WORK_LOGS_STORAGE_KEY, category: "timer", label: "Manual work logs" },
];

const knownSeedIdsByKey: Record<string, Set<string>> = {
  [TASK_STORAGE_KEY]: new Set(["task-1", "task-2", "task-3"]),
  [RESEARCH_PROJECTS_STORAGE_KEY]: new Set([
    "scd-paper",
    "jqc-mixed-models",
    "karen-prison-project",
    "mark-ipv-project",
    "femicide-followup",
  ]),
  [SERVICE_COMMITTEES_STORAGE_KEY]: new Set(["committee-grad", "committee-assessment"]),
  [SERVICE_ITEMS_STORAGE_KEY]: new Set([
    "service-review-journal",
    "service-assessment-report",
    "service-grad-agenda",
    "service-student-award-letter",
    "service-faculty-policy-notes",
  ]),
  [ADVISING_STUDENTS_STORAGE_KEY]: new Set([
    "student-r1-bound",
    "student-teaching-focused",
    "student-policy-bound",
  ]),
  [MINDSPACE_ITEMS_STORAGE_KEY]: new Set(["mind-1", "mind-2"]),
  [MINDSPACE_GOALS_STORAGE_KEY]: new Set(["goal-1"]),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseStoredValue(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    return null;
  }
}

export function isIdentifiedSeedRecord(key: string, value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  const id = typeof value.id === "string" ? value.id : undefined;
  const source = typeof value.source === "string" ? value.source : undefined;

  return Boolean(
    value.isSampleData === true ||
      value.isDemo === true ||
      value.isTest === true ||
      source === "sample-data" ||
      source === "seed" ||
      source === "demo" ||
      source === "test" ||
      (id && knownSeedIdsByKey[key]?.has(id)),
  );
}

function countIdentifiedRecords(key: string, rawValue: string | null) {
  const parsed = parseStoredValue(rawValue);

  if (Array.isArray(parsed)) {
    return parsed.filter((record) => isIdentifiedSeedRecord(key, record)).length;
  }

  return isIdentifiedSeedRecord(key, parsed) ? 1 : 0;
}

function filterIdentifiedRecords(key: string, rawValue: string | null) {
  const parsed = parseStoredValue(rawValue);

  if (Array.isArray(parsed)) {
    const filtered = parsed.filter((record) => !isIdentifiedSeedRecord(key, record));
    const removedCount = parsed.length - filtered.length;

    return {
      removedCount,
      nextRawValue: filtered.length > 0 ? JSON.stringify(filtered) : null,
    };
  }

  if (isIdentifiedSeedRecord(key, parsed)) {
    return {
      removedCount: 1,
      nextRawValue: null,
    };
  }

  return {
    removedCount: 0,
    nextRawValue: rawValue,
  };
}

function getMatchingPrefixKeys() {
  return Object.keys(window.localStorage).flatMap((key) => {
    const definition = SAMPLE_DATA_CLEANUP_PREFIXES.find((prefixDefinition) =>
      key.startsWith(prefixDefinition.prefix),
    );

    return definition
      ? { key, category: definition.category, label: definition.label }
      : [];
  });
}

export function collectSampleDataCleanupSummary(): SampleDataCleanupSummary {
  const matchingKeys = SAMPLE_DATA_CLEANUP_KEYS.filter(
    ({ key }) => countIdentifiedRecords(key, window.localStorage.getItem(key)) > 0,
  );
  const matchingPrefixKeys = getMatchingPrefixKeys().filter(
    ({ key }) => countIdentifiedRecords(key, window.localStorage.getItem(key)) > 0,
  );
  const allMatches = [...matchingKeys, ...matchingPrefixKeys];
  const countsByCategory = { ...emptyCounts };
  let recordCount = 0;

  allMatches.forEach((target) => {
    const targetRecordCount = countIdentifiedRecords(
      target.key,
      window.localStorage.getItem(target.key),
    );

    countsByCategory[target.category] += targetRecordCount;
    recordCount += targetRecordCount;
  });

  return {
    matchingKeys,
    matchingPrefixKeys,
    keyCount: allMatches.length,
    recordCount,
    countsByCategory,
  };
}

export function clearLocalResearchTeachingServiceData(): SampleDataCleanupResult {
  const summary = collectSampleDataCleanupSummary();
  const removedKeys: string[] = [];

  [...summary.matchingKeys, ...summary.matchingPrefixKeys].forEach(({ key }) => {
    const result = filterIdentifiedRecords(key, window.localStorage.getItem(key));

    if (result.removedCount === 0) {
      return;
    }

    removedKeys.push(key);

    if (result.nextRawValue === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, result.nextRawValue);
    }

    notifyLocalStorageChange(key);
  });

  return {
    ...summary,
    removedKeys,
  };
}

function getSampleCalendarEventsEnabled() {
  const settings = parseStoredValue(window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY));

  return (
    isRecord(settings) &&
    (settings as { showSampleCalendarEvents?: unknown }).showSampleCalendarEvents === true
  );
}

function disableSampleCalendarEvents() {
  const settings = parseStoredValue(window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY));

  if (
    !isRecord(settings) ||
    (settings as { showSampleCalendarEvents?: unknown }).showSampleCalendarEvents !== true
  ) {
    return false;
  }

  window.localStorage.setItem(
    APP_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      ...settings,
      showSampleCalendarEvents: false,
    }),
  );
  notifyLocalStorageChange(APP_SETTINGS_STORAGE_KEY);
  return true;
}

export function collectDashboardTasksCleanupSummary(): DashboardTasksCleanupSummary {
  const matchingKeys = DASHBOARD_TASKS_CLEANUP_KEYS.filter(
    ({ key }) => countIdentifiedRecords(key, window.localStorage.getItem(key)) > 0,
  );
  const countsByCategory = { ...emptyDashboardTasksCounts };
  const sampleCalendarEventsEnabled = getSampleCalendarEventsEnabled();
  let recordCount = 0;

  matchingKeys.forEach((target) => {
    const targetRecordCount = countIdentifiedRecords(
      target.key,
      window.localStorage.getItem(target.key),
    );

    countsByCategory[target.category] += targetRecordCount;
    recordCount += targetRecordCount;
  });

  if (sampleCalendarEventsEnabled) {
    countsByCategory["calendar-settings"] += 1;
    recordCount += 1;
  }

  return {
    matchingKeys,
    keyCount: matchingKeys.length + (sampleCalendarEventsEnabled ? 1 : 0),
    recordCount,
    countsByCategory,
    sampleCalendarEventsEnabled,
  };
}

export function clearLocalDashboardTasksData(): DashboardTasksCleanupResult {
  const summary = collectDashboardTasksCleanupSummary();
  const removedKeys: string[] = [];

  summary.matchingKeys.forEach(({ key }) => {
    const result = filterIdentifiedRecords(key, window.localStorage.getItem(key));

    if (result.removedCount === 0) {
      return;
    }

    removedKeys.push(key);

    if (result.nextRawValue === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, result.nextRawValue);
    }

    notifyLocalStorageChange(key);
  });

  const disabledSampleCalendarEvents = disableSampleCalendarEvents();

  return {
    ...summary,
    removedKeys,
    disabledSampleCalendarEvents,
  };
}
