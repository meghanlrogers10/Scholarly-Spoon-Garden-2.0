import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";
import {
  MANUAL_WORK_LOGS_STORAGE_KEY,
  TIMER_SESSIONS_STORAGE_KEY,
} from "../../../shared/constants/timerStorage";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import { useTaskBridge } from "../../../shared/hooks/useTaskBridge";
import type { Task } from "../../../shared/types/task";
import type { EstimateAccuracy, TimerSession } from "../../../shared/types/timer";
import type { ManualWorkLogEntry } from "../../../shared/types/workLog";
import { usePlannedTaskBlocks } from "../../dashboard/hooks/usePlannedTaskBlocks";
import {
  calculateEstimatedVsActual,
  calculateTotalActualMinutes,
  calculatePlannedBlockCoverage,
  calculateTimeRealitySummary,
  createTaskMap,
  getEstimateRatioLabel,
  getEstimateRealityCounts,
  getSessionArea,
  getSessionEstimateMinutes,
  getSessionTaskType,
  groupSessionsByArea,
  groupSessionsByDate,
  groupSessionsByTaskType,
  normalizeManualWorkLog,
  normalizeTimerSession,
  type TimeRealitySession,
} from "../utils/timeReality";
import "../timer.css";

type WorkLogSource = "timer" | "manual";
type SourceFilter = "all" | WorkLogSource;
type DateRangeFilter = "today" | "week" | "last-7" | "all";

const estimateAccuracyLabels: Record<EstimateAccuracy, string> = {
  "too-short": "Estimate too short",
  "about-right": "Estimate about right",
  "too-long": "Estimate too long",
};

function formatDuration(totalMinutes: number | null | undefined) {
  if (!totalMinutes) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function getStartOfWeek() {
  const today = getStartOfToday();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  today.setDate(today.getDate() - diff);

  return today;
}

function isInDateRange(session: TimeRealitySession, filter: DateRangeFilter) {
  if (filter === "all") {
    return true;
  }

  const startedAt = new Date(session.startedAt);

  if (Number.isNaN(startedAt.getTime())) {
    return false;
  }

  if (filter === "today") {
    return startedAt >= getStartOfToday();
  }

  if (filter === "week") {
    return startedAt >= getStartOfWeek();
  }

  const sevenDaysAgo = getStartOfToday();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  return startedAt >= sevenDaysAgo;
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function getExportFileDate() {
  return new Date().toISOString().slice(0, 10);
}

function exportSessionsToCsv(
  sessions: TimeRealitySession[],
  taskMap: Map<string, Task>,
) {
  const headers = [
    "date",
    "start",
    "end",
    "durationMinutes",
    "source",
    "mode",
    "taskTitle",
    "taskId",
    "area",
    "taskType",
    "workingBlockId",
    "plannedTaskBlockId",
    "completedTask",
    "estimateAccuracy",
    "hadHiddenSetup",
    "wasInterrupted",
    "mood",
    "reflection",
  ];

  const rows = sessions.map((session) => {
    const area = getSessionArea(session, taskMap);
    const taskType = getSessionTaskType(session, taskMap);

    return [
      session.startedAt.slice(0, 10),
      session.startedAt,
      session.endedAt ?? "",
      session.durationMinutes,
      session.source,
      session.mode ?? "",
      session.taskTitle ?? session.title,
      session.taskId ?? "",
      area,
      taskType === "unknown" ? "" : taskType,
      session.workingBlockId ?? "",
      session.plannedTaskBlockId ?? "",
      session.completedTask ?? "",
      session.estimateAccuracy ?? "",
      session.hadHiddenSetup ?? "",
      session.wasInterrupted ?? "",
      session.mood ?? "",
      session.reflection ?? "",
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ssg-time-reality-${getExportFileDate()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportSessionsToMarkdown(
  sessions: TimeRealitySession[],
  taskMap: Map<string, Task>,
) {
  const lines = [
    `# Time Reality Export (${getExportFileDate()})`,
    "",
    `Sessions: ${sessions.length}`,
    `Actual time: ${formatDuration(calculateTotalActualMinutes(sessions))}`,
    "",
  ];

  sessions.forEach((session) => {
    const area = getSessionArea(session, taskMap);
    const taskType = getSessionTaskType(session, taskMap);
    const flags = [
      session.source,
      session.mode,
      session.completedTask === true ? "finished" : undefined,
      session.estimateAccuracy,
      session.hadHiddenSetup ? "hidden setup" : undefined,
      session.wasInterrupted ? "interrupted" : undefined,
      session.mood,
    ].filter(Boolean);

    lines.push(
      `## ${session.startedAt.slice(0, 10)} - ${session.taskTitle ?? session.title}`,
      "",
      `- Time: ${formatDateTime(session.startedAt)} (${formatDuration(
        session.durationMinutes,
      )})`,
      `- Area/type: ${area} / ${
        taskType === "unknown" ? "No task type" : taskType
      }`,
      `- Source: ${flags.join(", ") || "work log"}`,
      `- Planning links: working block ${
        session.workingBlockId ? session.workingBlockId : "none"
      }, planned task ${
        session.plannedTaskBlockId ? session.plannedTaskBlockId : "none"
      }`,
    );

    if (session.reflection) {
      lines.push(`- Reflection: ${session.reflection}`);
    }

    lines.push("");
  });

  const blob = new Blob([lines.join("\n")], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ssg-time-reality-${getExportFileDate()}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function TimerLogPage() {
  const [timerSessions, setTimerSessions] = useLocalStorage<TimerSession[]>(
    TIMER_SESSIONS_STORAGE_KEY,
    [],
  );
  const [manualWorkLogs, setManualWorkLogs] = useLocalStorage<
    ManualWorkLogEntry[]
  >(MANUAL_WORK_LOGS_STORAGE_KEY, []);
  const { tasks, adjustActualMinutesForTask } = useTaskBridge();
  const { plannedBlocks } = usePlannedTaskBlocks();
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>("last-7");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");

  const taskMap = useMemo(() => createTaskMap(tasks), [tasks]);

  const allEntries = useMemo<TimeRealitySession[]>(() => {
    const timerEntries = timerSessions.map(normalizeTimerSession);
    const manualEntries = manualWorkLogs.map(normalizeManualWorkLog);

    return [...timerEntries, ...manualEntries].sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }, [timerSessions, manualWorkLogs]);

  const filteredEntries = allEntries.filter((entry) => {
    const sourceMatches =
      sourceFilter === "all" || entry.source === sourceFilter;
    const area = String(getSessionArea(entry, taskMap));
    const taskType = getSessionTaskType(entry, taskMap);
    const areaMatches = areaFilter === "all" || area === areaFilter;
    const taskTypeMatches =
      taskTypeFilter === "all" || taskType === taskTypeFilter;

    return (
      isInDateRange(entry, dateRangeFilter) &&
      sourceMatches &&
      areaMatches &&
      taskTypeMatches
    );
  });

  const summary = calculateTimeRealitySummary(
    filteredEntries,
    tasks,
    plannedBlocks,
  );
  const estimateSummary = calculateEstimatedVsActual(filteredEntries, tasks);
  const estimateReality = getEstimateRealityCounts(filteredEntries);
  const plannedCoverage = calculatePlannedBlockCoverage(
    filteredEntries,
    plannedBlocks,
  );
  const sessionsByDate = groupSessionsByDate(filteredEntries);
  const areaSummaries = groupSessionsByArea(filteredEntries, tasks);
  const taskTypeSummaries = groupSessionsByTaskType(filteredEntries, tasks);
  const todayEntries = allEntries.filter((entry) => isInDateRange(entry, "today"));
  const weekEntries = allEntries.filter((entry) => isInDateRange(entry, "week"));
  const timerEntriesInView = filteredEntries.filter(
    (entry) => entry.source === "timer",
  );
  const manualEntriesInView = filteredEntries.filter(
    (entry) => entry.source === "manual",
  );
  const overEstimateEntries = filteredEntries.filter((entry) => {
    const estimateMinutes = getSessionEstimateMinutes(entry, taskMap);

    return Boolean(
      estimateMinutes &&
        estimateMinutes > 0 &&
        entry.durationMinutes > estimateMinutes * 1.25,
    );
  });
  const lowEnergyCompletedEntries = filteredEntries.filter((entry) => {
    if (entry.completedTask !== true || !entry.taskId) {
      return false;
    }

    const task = taskMap.get(entry.taskId);

    return Boolean(task?.lowEnergyFriendly || (task?.spoonCost ?? 99) <= 2);
  });
  const frictionEntries = filteredEntries.filter(
    (entry) => entry.hadHiddenSetup || entry.wasInterrupted,
  );
  const tooShortTaskTypeCounts = filteredEntries
    .filter((entry) => entry.estimateAccuracy === "too-short")
    .reduce<Record<string, number>>((counts, entry) => {
      const taskType = getSessionTaskType(entry, taskMap);
      const label = taskType === "unknown" ? "No task type" : taskType;
      counts[label] = (counts[label] ?? 0) + 1;

      return counts;
    }, {});
  const topTooShortTaskTypes = Object.entries(tooShortTaskTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const areaOptions = Array.from(
    new Set(allEntries.map((entry) => String(getSessionArea(entry, taskMap)))),
  ).sort();
  const taskTypeOptions = Array.from(
    new Set(allEntries.map((entry) => getSessionTaskType(entry, taskMap))),
  ).sort();

  function clearFilters() {
    setDateRangeFilter("last-7");
    setSourceFilter("all");
    setAreaFilter("all");
    setTaskTypeFilter("all");
  }

  function deleteEntry(entry: TimeRealitySession) {
    if (entry.taskId && entry.durationMinutes > 0) {
      adjustActualMinutesForTask(entry.taskId, -entry.durationMinutes, -1);
    }

    if (entry.source === "timer") {
      setTimerSessions((currentSessions) =>
        currentSessions.filter((session) => session.id !== entry.storageId),
      );

      return;
    }

    setManualWorkLogs((currentLogs) =>
      currentLogs.filter((log) => log.id !== entry.storageId),
    );
  }

  return (
    <section className="page-stack timer-log-page">
      <PageHeader
        eyebrow="Work history"
        title="Focus Bloom Log"
        description="Time reality is a map, not a moral judgment."
      />

      <Card className="time-reality-panel">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Time reality</p>
            <h2>Actual work logged</h2>
          </div>

          <div className="time-reality-action-row">
            <Link className="button button-soft" to="/dashboard?shutdownReview=1">
              Review today
            </Link>
            <Button
              variant="soft"
              onClick={() => exportSessionsToCsv(filteredEntries, taskMap)}
            >
              Export CSV
            </Button>
            <Button
              variant="soft"
              onClick={() => exportSessionsToMarkdown(filteredEntries, taskMap)}
            >
              Export Markdown
            </Button>
          </div>
        </div>

        <div className="timer-log-summary-grid">
          <Card className="timer-log-stat-card">
            <p className="eyebrow">Actual</p>
            <strong>{formatDuration(summary.totalActualMinutes)}</strong>
            <span>{filteredEntries.length} sessions in view</span>
          </Card>

          <Card className="timer-log-stat-card">
            <p className="eyebrow">Today / week</p>
            <strong>{formatDuration(calculateTotalActualMinutes(todayEntries))}</strong>
            <span>{formatDuration(calculateTotalActualMinutes(weekEntries))} this week</span>
          </Card>

          <Card className="timer-log-stat-card">
            <p className="eyebrow">Estimated vs actual</p>
            <strong>{getEstimateRatioLabel(summary.estimateRatio)}</strong>
            <span>
              {formatDuration(estimateSummary.totalEstimatedMinutes)} estimated
            </span>
          </Card>

          <Card className="timer-log-stat-card">
            <p className="eyebrow">Completed</p>
            <strong>{summary.completedSessions}</strong>
            <span>sessions marked finished</span>
          </Card>

          <Card className="timer-log-stat-card">
            <p className="eyebrow">Interrupted</p>
            <strong>{summary.interruptedSessions}</strong>
            <span>interruptions explain estimate drift</span>
          </Card>

          <Card className="timer-log-stat-card">
            <p className="eyebrow">Hidden setup</p>
            <strong>{summary.hiddenSetupSessions}</strong>
            <span>hidden setup is real work</span>
          </Card>

          <Card className="timer-log-stat-card">
            <p className="eyebrow">Planned links</p>
            <strong>{summary.sessionsWithPlannedBlock}</strong>
            <span>{summary.sessionsWithoutPlannedBlock} unlinked sessions</span>
          </Card>

          <Card className="timer-log-stat-card">
            <p className="eyebrow">Timer / manual</p>
            <strong>
              {formatDuration(calculateTotalActualMinutes(timerEntriesInView))}
            </strong>
            <span>
              {formatDuration(calculateTotalActualMinutes(manualEntriesInView))} manual
            </span>
          </Card>
        </div>
      </Card>

      <Card className="timer-log-filter-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>Find work sessions</h2>
          </div>

          <Button variant="soft" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>

        <div className="timer-log-filter-grid">
          <label>
            <span>Date range</span>
            <select
              value={dateRangeFilter}
              onChange={(event) =>
                setDateRangeFilter(event.target.value as DateRangeFilter)
              }
            >
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="last-7">Last 7 days</option>
              <option value="all">All</option>
            </select>
          </label>

          <label>
            <span>Source</span>
            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value as SourceFilter)
              }
            >
              <option value="all">All sources</option>
              <option value="timer">Timer only</option>
              <option value="manual">Manual only</option>
            </select>
          </label>

          <label>
            <span>Area</span>
            <select
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
            >
              <option value="all">All areas</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Task type</span>
            <select
              value={taskTypeFilter}
              onChange={(event) => setTaskTypeFilter(event.target.value)}
            >
              <option value="all">All task types</option>
              {taskTypeOptions.map((taskType) => (
                <option key={taskType} value={taskType}>
                  {taskType === "unknown" ? "No task type" : taskType}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="time-reality-grid">
        <Card className="time-reality-section-card">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Area</p>
              <h2>Time by area</h2>
            </div>
          </div>

          <div className="time-reality-row-list">
            {areaSummaries.length === 0 ? (
              <p className="muted-text">No area totals yet.</p>
            ) : (
              areaSummaries.map((summaryRow) => (
                <div key={summaryRow.key} className="time-reality-row">
                  <div>
                    <strong>{summaryRow.label}</strong>
                    <span>{summaryRow.sessionCount} sessions</span>
                  </div>
                  <div>
                    <strong>{formatDuration(summaryRow.totalActualMinutes)}</strong>
                    <span>
                      {summaryRow.interruptedCount > 0
                        ? `${summaryRow.interruptedCount} interrupted · `
                        : ""}
                      {summaryRow.hiddenSetupCount > 0
                        ? `${summaryRow.hiddenSetupCount} hidden setup`
                        : "steady"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="time-reality-section-card">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Task type</p>
              <h2>Estimate drift</h2>
            </div>
          </div>

          <div className="time-reality-row-list">
            {taskTypeSummaries.length === 0 ? (
              <p className="muted-text">No task-type data yet.</p>
            ) : (
              taskTypeSummaries.map((summaryRow) => (
                <div key={summaryRow.key} className="time-reality-row">
                  <div>
                    <strong>{summaryRow.label}</strong>
                    <span>{summaryRow.sessionCount} sessions</span>
                  </div>
                  <div>
                    <strong>{formatDuration(summaryRow.totalActualMinutes)}</strong>
                    <span>
                      {formatDuration(summaryRow.totalEstimatedMinutes)} estimated ·{" "}
                      {getEstimateRatioLabel(summaryRow.estimateRatio)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="time-reality-grid">
        <Card className="time-reality-section-card">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Estimate reality</p>
              <h2>How estimates felt</h2>
            </div>
          </div>

          <div className="time-reality-metric-strip">
            <div>
              <strong>{estimateReality.tooShort}</strong>
              <span>too short</span>
            </div>
            <div>
              <strong>{estimateReality.aboutRight}</strong>
              <span>about right</span>
            </div>
            <div>
              <strong>{estimateReality.tooLong}</strong>
              <span>too long</span>
            </div>
          </div>

          <div className="time-reality-chip-row">
            {topTooShortTaskTypes.length > 0 ? (
              topTooShortTaskTypes.map(([taskType, count]) => (
                <span key={taskType} className="pill">
                  {taskType}: {count} too short
                </span>
              ))
            ) : (
              <span className="pill">No repeated too-short pattern yet</span>
            )}
          </div>
        </Card>

        <Card className="time-reality-section-card">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Friction signals</p>
              <h2>Setup and interruptions</h2>
            </div>
          </div>

          <p className="muted-text">
            Hidden setup is real work. Interruptions explain estimate drift.
          </p>

          <div className="time-reality-chip-row">
            {frictionEntries.slice(0, 5).map((entry) => (
              <span key={entry.id} className="pill">
                {entry.title}
              </span>
            ))}
            {frictionEntries.length === 0 ? (
              <span className="pill">No friction flags in this view</span>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="time-reality-grid">
        <Card className="time-reality-section-card">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Over estimate</p>
              <h2>Tasks that ran long</h2>
            </div>
          </div>

          <div className="time-reality-chip-row">
            {overEstimateEntries.slice(0, 5).map((entry) => (
              <span key={entry.id} className="pill">
                {entry.taskTitle ?? entry.title}: {formatDuration(entry.durationMinutes)}
              </span>
            ))}
            {overEstimateEntries.length === 0 ? (
              <span className="pill">No big estimate overruns in this view</span>
            ) : null}
          </div>
        </Card>

        <Card className="time-reality-section-card">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Low energy wins</p>
              <h2>Finished with small spoons</h2>
            </div>
          </div>

          <div className="time-reality-chip-row">
            {lowEnergyCompletedEntries.slice(0, 5).map((entry) => (
              <span key={entry.id} className="pill">
                {entry.taskTitle ?? entry.title}
              </span>
            ))}
            {lowEnergyCompletedEntries.length === 0 ? (
              <span className="pill">No low-spoon completions in this view yet</span>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="time-reality-section-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Planned vs actual basic</p>
            <h2>Planning links</h2>
          </div>
        </div>

        <div className="time-reality-metric-strip">
          <div>
            <strong>{plannedCoverage.sessionsWithPlannedBlock}</strong>
            <span>linked to planned tasks</span>
          </div>
          <div>
            <strong>{plannedCoverage.sessionsWithWorkingBlock}</strong>
            <span>linked to working blocks</span>
          </div>
          <div>
            <strong>{plannedCoverage.sessionsWithoutPlanningContext}</strong>
            <span>unlinked to planning</span>
          </div>
          <div>
            <strong>{plannedCoverage.plannedBlocksWithActualWork}</strong>
            <span>planned blocks with actual work</span>
          </div>
        </div>
      </Card>

      <Card className="timer-log-list-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Sessions</p>
            <h2>{filteredEntries.length} visible logs</h2>
          </div>
          <div className="time-reality-chip-row">
            <span className="pill">{allEntries.length} total saved</span>
            <span className="pill">{Object.keys(sessionsByDate).length} days</span>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <p className="muted-text">
            {allEntries.length > 0
              ? `${allEntries.length} work logs are saved, but the current filters are hiding them. Clear filters to bring them back.`
              : "No work logs saved yet. Go do one tiny useful thing, then come back for evidence."}
          </p>
        ) : (
          <div className="timer-log-list">
            {filteredEntries.map((entry) => {
              const area = getSessionArea(entry, taskMap);
              const taskType = getSessionTaskType(entry, taskMap);
              const estimateMinutes = getSessionEstimateMinutes(entry, taskMap);

              return (
                <article key={entry.id} className="timer-log-entry">
                  <div>
                    <p className="eyebrow">
                      {entry.source === "timer" ? "Timed session" : "Manual log"}
                    </p>

                    <h3>{entry.title}</h3>

                    {entry.taskTitle && (
                      <p className="muted-text">
                        Linked task: {entry.taskTitle}
                      </p>
                    )}

                    <p className="muted-text">
                      {formatDateTime(entry.startedAt)}
                      {entry.workingBlockId ? " · working block linked" : ""}
                      {entry.plannedTaskBlockId ? " · planned task linked" : ""}
                    </p>
                  </div>

                  <div className="timer-log-entry-meta">
                    <span className="pill">{String(area)}</span>
                    <span className="pill">
                      {taskType === "unknown" ? "No task type" : taskType}
                    </span>

                    {estimateMinutes ? (
                      <span className="pill">
                        {formatDuration(estimateMinutes)} estimate
                      </span>
                    ) : null}

                    {entry.completedTask === true && (
                      <span className="pill">Finished</span>
                    )}

                    {entry.completedTask === false && (
                      <span className="pill">Not finished</span>
                    )}

                    {entry.estimateAccuracy && (
                      <span className="pill">
                        {estimateAccuracyLabels[entry.estimateAccuracy]}
                      </span>
                    )}

                    {entry.hadHiddenSetup && (
                      <span className="pill">Hidden setup</span>
                    )}

                    {entry.wasInterrupted && (
                      <span className="pill">Interrupted</span>
                    )}

                    <strong>{formatDuration(entry.durationMinutes)}</strong>

                    <button
                      className="text-button"
                      onClick={() => deleteEntry(entry)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
