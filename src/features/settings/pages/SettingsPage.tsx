import "../settings.css";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CloudSyncCard } from "../components/CloudSyncCard";
import { DataBackupCard } from "../components/DataBackupCard";
import { mergeGoogleCalendarSyncSettings } from "../utils/googleCalendarSyncSettings";
import { GOOGLE_CLIENT_ID } from "../../../shared/google/googleCalendarConfig";
import {
  emptyStoredGoogleCalendarEvents,
  GOOGLE_CALENDAR_EVENTS_STORAGE_KEY,
  type StoredGoogleCalendarEvents,
} from "../../../shared/google/googleCalendarStorage";
import {
  fetchGoogleCalendarEvents,
  fetchGoogleCalendarList,
} from "../../../shared/google/googleCalendarReadService";
import { requestGoogleCalendarAccessToken } from "../../../shared/google/googleIdentity";
import { useAppSettings } from "../../../shared/hooks/useAppSettings";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";
import type {
  GoogleCalendarSource,
  GoogleCalendarSyncDirection,
} from "../../../shared/types/googleCalendarSync";
import type {
  CalendarDensity,
  LayoutDensity,
  PlanningMode,
  TextSize,
  TimerReflectionLevel,
} from "../../../shared/types/settings";

function formatHour(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
  });
}

const startHourOptions = Array.from({ length: 23 }, (_, index) => index);
const endHourOptions = Array.from({ length: 23 }, (_, index) => index + 1);
const workingBlockOptions = [30, 45, 60, 90, 120, 180];
const pomodoroOptions = [15, 20, 25, 30, 45, 50];
const breakOptions = [3, 5, 10, 15, 20];
const longRunningOptions = [60, 90, 120, 150, 180, 240];
const maxSpoonOptions = [1, 2, 3, 4, 5, 6, 7, 8];
const maxTaskOptions = [2, 3, 4, 5, 6, 7, 8, 10];

type SettingsStatus = {
  tone: "neutral" | "success" | "warning" | "error";
  message: string;
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  status,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  status?: "Partial" | "Coming soon";
}) {
  return (
    <label className="settings-toggle-row">
      <span>
        <strong>
          {label}
          {status ? <em>{status}</em> : null}
        </strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useAppSettings();
  const [storedGoogleCalendarEvents, setStoredGoogleCalendarEvents] =
    useLocalStorage<StoredGoogleCalendarEvents>(
      GOOGLE_CALENDAR_EVENTS_STORAGE_KEY,
      emptyStoredGoogleCalendarEvents,
    );
  const googleCalendarSync = mergeGoogleCalendarSyncSettings(
    settings.googleCalendarSync,
  );
  const accessTokenRef = useRef<string>("");
  const [googleCalendarSources, setGoogleCalendarSources] = useState<
    GoogleCalendarSource[]
  >([]);
  const [hasGoogleCalendarAccessToken, setHasGoogleCalendarAccessToken] =
    useState(false);
  const [googleCalendarStatus, setGoogleCalendarStatus] =
    useState<SettingsStatus>({
      tone: GOOGLE_CLIENT_ID ? "neutral" : "warning",
      message: GOOGLE_CLIENT_ID
        ? "Google Calendar is ready to connect in read-only mode."
        : "Google Client ID missing. Add VITE_GOOGLE_CLIENT_ID to enable Google Calendar connection.",
    });
  const [isGoogleCalendarBusy, setIsGoogleCalendarBusy] = useState(false);

  function handleStartHourChange(value: string) {
    const nextStartHour = Number(value);
    const safeEndHour = Math.max(
      settings.calendarDayEndHour,
      nextStartHour + 1,
    );

    updateSettings({
      calendarDayStartHour: nextStartHour,
      calendarDayEndHour: safeEndHour,
    });
  }

  function handleEndHourChange(value: string) {
    const nextEndHour = Number(value);
    const safeStartHour = Math.min(
      settings.calendarDayStartHour,
      nextEndHour - 1,
    );

    updateSettings({
      calendarDayStartHour: safeStartHour,
      calendarDayEndHour: nextEndHour,
    });
  }

  function updateGoogleCalendarSync(
    updates: Partial<typeof googleCalendarSync>,
  ) {
    updateSettings({
      googleCalendarSync: mergeGoogleCalendarSyncSettings({
        ...googleCalendarSync,
        ...updates,
      }),
    });
  }

  function syncSelectedCalendarSources(selectedCalendarIds: string[]) {
    setGoogleCalendarSources((currentSources) =>
      currentSources.map((source) => ({
        ...source,
        isSelected: selectedCalendarIds.includes(source.id),
      })),
    );
  }

  async function handleConnectGoogleCalendar() {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleCalendarStatus({
        tone: "warning",
        message:
          "Google Client ID missing. Add VITE_GOOGLE_CLIENT_ID before connecting Google Calendar.",
      });
      return;
    }

    setIsGoogleCalendarBusy(true);
    setHasGoogleCalendarAccessToken(false);
    setGoogleCalendarStatus({
      tone: "neutral",
      message: "Opening Google Calendar read-only access...",
    });

    try {
      const token = await requestGoogleCalendarAccessToken();
      accessTokenRef.current = token;
      setHasGoogleCalendarAccessToken(true);

      const calendars = await fetchGoogleCalendarList(token);
      const selectedCalendarIds = googleCalendarSync.selectedExternalCalendarIds;
      const sources = calendars.map((source) => ({
        ...source,
        isSelected: selectedCalendarIds.includes(source.id),
      }));

      setGoogleCalendarSources(sources);
      updateGoogleCalendarSync({ enabled: true, syncDirection: "read-only" });
      setGoogleCalendarStatus({
        tone: "success",
        message:
          sources.length > 0
            ? `Connected read-only. Choose calendars, then import events. Found ${sources.length} calendars.`
            : "Connected read-only, but no Google calendars were returned.",
      });
    } catch (error) {
      accessTokenRef.current = "";
      setHasGoogleCalendarAccessToken(false);
      setGoogleCalendarStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Google Calendar connection did not complete.",
      });
    } finally {
      setIsGoogleCalendarBusy(false);
    }
  }

  function handleGoogleCalendarSelection(calendarId: string, selected: boolean) {
    const selectedCalendarIds = selected
      ? Array.from(
          new Set([
            ...googleCalendarSync.selectedExternalCalendarIds,
            calendarId,
          ]),
        )
      : googleCalendarSync.selectedExternalCalendarIds.filter(
          (selectedCalendarId) => selectedCalendarId !== calendarId,
        );

    updateGoogleCalendarSync({
      selectedExternalCalendarIds: selectedCalendarIds,
    });
    syncSelectedCalendarSources(selectedCalendarIds);
  }

  async function handleImportGoogleCalendarEvents() {
    if (!accessTokenRef.current) {
      setHasGoogleCalendarAccessToken(false);
      setGoogleCalendarStatus({
        tone: "warning",
        message: "Reconnect Google Calendar first. Access tokens are not stored after refresh.",
      });
      return;
    }

    if (googleCalendarSync.selectedExternalCalendarIds.length === 0) {
      setGoogleCalendarStatus({
        tone: "warning",
        message: "Select at least one Google calendar before importing events.",
      });
      return;
    }

    if (!googleCalendarSync.importExternalEvents) {
      setGoogleCalendarStatus({
        tone: "warning",
        message: "Turn on Google event import before importing events.",
      });
      return;
    }

    setIsGoogleCalendarBusy(true);
    setGoogleCalendarStatus({
      tone: "neutral",
      message: "Importing read-only busy time from selected Google calendars...",
    });

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 7);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 30);
    windowEnd.setHours(23, 59, 59, 999);

    try {
      const eventGroups = await Promise.all(
        googleCalendarSync.selectedExternalCalendarIds.map((calendarId) =>
          fetchGoogleCalendarEvents(
            accessTokenRef.current,
            calendarId,
            windowStart.toISOString(),
            windowEnd.toISOString(),
            { importAsBusyOnly: googleCalendarSync.importAsBusyOnly },
          ),
        ),
      );
      const events = eventGroups.flat();
      const now = new Date().toISOString();

      setStoredGoogleCalendarEvents({
        fetchedAt: now,
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        events,
      });
      updateGoogleCalendarSync({
        enabled: true,
        syncDirection: "read-only",
        lastSyncAt: now,
        lastSyncError: "",
      });
      setGoogleCalendarStatus({
        tone: events.length > 0 ? "success" : "warning",
        message:
          events.length > 0
            ? `Imported ${events.length} read-only Google Calendar events as Dashboard busy time.`
            : "Import finished. No Google Calendar events were found in this window.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Google Calendar import did not complete.";

      updateGoogleCalendarSync({
        lastSyncError: message,
      });
      setGoogleCalendarStatus({
        tone: "error",
        message,
      });
    } finally {
      setIsGoogleCalendarBusy(false);
    }
  }

  return (
    <section className="page-stack settings-page">
      <PageHeader
        eyebrow="Options"
        title="Cognitive load control panel"
        description="Small defaults that make the app calmer, more realistic, and easier to use on low-spoon days. These settings are local for now and become the foundation for Daily Check-In, Working Blocks, Today Builder, and Timer Reality."
      />

      <div className="settings-back-row">
        <Link className="text-button" to="/dashboard">
          ← Back to Dashboard
        </Link>
      </div>

      <Card>
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Planning data readiness</p>
            <h2>Task bridge ready</h2>
          </div>
          <span className="pill">Local V2</span>
        </div>
        <p className="muted-text">
          Shared tasks now carry estimates, actual timer totals, source context,
          next actions, and low-energy hints for Daily Check-In, Working Blocks,
          and Today Builder.
        </p>
      </Card>

      <div className="settings-section-grid">
        <Card>
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Calendar</p>
              <h2>Visible time and work blocks</h2>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              <span>Day starts at</span>
              <select
                value={settings.calendarDayStartHour}
                onChange={(event) => handleStartHourChange(event.target.value)}
              >
                {startHourOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Day ends at</span>
              <select
                value={settings.calendarDayEndHour}
                onChange={(event) => handleEndHourChange(event.target.value)}
              >
                {endHourOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Default working block</span>
              <select
                value={settings.defaultWorkingBlockMinutes}
                onChange={(event) =>
                  updateSettings({
                    defaultWorkingBlockMinutes: Number(event.target.value),
                  })
                }
              >
                {workingBlockOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Calendar density</span>
              <select
                value={settings.calendarDensity}
                onChange={(event) =>
                  updateSettings({
                    calendarDensity: event.target.value as CalendarDensity,
                  })
                }
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
              </select>
            </label>
          </div>

          <div className="settings-toggle-list">
            <ToggleRow
              label="Show weekends"
              description="Useful during summer or deadline weeks; turn off for a calmer academic-week view."
              checked={settings.showWeekends}
              onChange={(checked) => updateSettings({ showWeekends: checked })}
            />
            <ToggleRow
              label="Show sample calendar events"
              description="Keep off for real use so fake events do not clutter planning."
              checked={settings.showSampleCalendarEvents}
              onChange={(checked) =>
                updateSettings({ showSampleCalendarEvents: checked })
              }
            />
          </div>
        </Card>

        <Card>
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Planning</p>
              <h2>Daily Check-In defaults</h2>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              <span>Default planning mode</span>
              <select
                value={settings.defaultPlanningMode}
                onChange={(event) =>
                  updateSettings({
                    defaultPlanningMode: event.target.value as PlanningMode,
                  })
                }
              >
                <option value="balanced">Balanced</option>
                <option value="research-push">Research push</option>
                <option value="teaching-survival">Teaching survival</option>
                <option value="service-triage">Service triage</option>
                <option value="low-energy">Low-energy mode</option>
                <option value="deadline-emergency">Deadline emergency</option>
                <option value="small-task-cleanup">Small-task cleanup</option>
              </select>
            </label>

            <label>
              <span>Daily spoon warning</span>
              <select
                value={settings.maxDailySpoonsWarning}
                onChange={(event) =>
                  updateSettings({
                    maxDailySpoonsWarning: Number(event.target.value),
                  })
                }
              >
                {maxSpoonOptions.map((spoons) => (
                  <option key={spoons} value={spoons}>
                    {spoons} spoons
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Daily task warning</span>
              <select
                value={settings.maxDailyTaskWarning}
                onChange={(event) =>
                  updateSettings({
                    maxDailyTaskWarning: Number(event.target.value),
                  })
                }
              >
                {maxTaskOptions.map((tasks) => (
                  <option key={tasks} value={tasks}>
                    {tasks} tasks
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="settings-toggle-list">
            <ToggleRow
              label="Daily Check-In"
              description="Show a once-a-day prompt for spoons, working blocks, and planning mode."
              checked={settings.dailyCheckInEnabled}
              onChange={(checked) =>
                updateSettings({ dailyCheckInEnabled: checked })
              }
            />
            <ToggleRow
              label="Realistic-plan warnings"
              description="Let SSG call out fantasy plans before they become shame spirals."
              checked={settings.realisticPlanWarnings}
              onChange={(checked) =>
                updateSettings({ realisticPlanWarnings: checked })
              }
            />
            <ToggleRow
              label="Start low-energy by default"
              description="Bias suggestions toward tiny next moves and low-spoon tasks."
              checked={settings.lowEnergyModeDefault}
              onChange={(checked) =>
                updateSettings({ lowEnergyModeDefault: checked })
              }
            />
          </div>
        </Card>

        <Card>
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Timer</p>
              <h2>Focus and reflection defaults</h2>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              <span>Pomodoro length</span>
              <select
                value={settings.timerPomodoroMinutes}
                onChange={(event) =>
                  updateSettings({
                    timerPomodoroMinutes: Number(event.target.value),
                  })
                }
              >
                {pomodoroOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>
                Break length <em className="settings-status-pill">Coming soon</em>
              </span>
              <select
                value={settings.timerBreakMinutes}
                disabled
                aria-describedby="timer-break-length-note"
                onChange={(event) =>
                  updateSettings({ timerBreakMinutes: Number(event.target.value) })
                }
              >
                {breakOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
              <small id="timer-break-length-note">
                Saved for sync now; break-session automation is not wired yet.
              </small>
            </label>

            <label>
              <span>Long-running warning</span>
              <select
                value={settings.longRunningTimerWarningMinutes}
                onChange={(event) =>
                  updateSettings({
                    longRunningTimerWarningMinutes: Number(event.target.value),
                  })
                }
              >
                {longRunningOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Stop reflection</span>
              <select
                value={settings.timerReflectionLevel}
                onChange={(event) =>
                  updateSettings({
                    timerReflectionLevel: event.target
                      .value as TimerReflectionLevel,
                  })
                }
              >
                <option value="none">None</option>
                <option value="light">Light</option>
                <option value="full">Full</option>
              </select>
            </label>
          </div>

          <div className="settings-toggle-list">
            <ToggleRow
              label="Sound alerts"
              description="Optional. Off by default so the app does not jumpscare you."
              checked={settings.timerSoundAlerts}
              onChange={(checked) => updateSettings({ timerSoundAlerts: checked })}
            />
            <ToggleRow
              label="Visual alerts"
              description="Show a visual nudge when Pomodoro or long-running warnings fire."
              checked={settings.timerVisualAlerts}
              onChange={(checked) => updateSettings({ timerVisualAlerts: checked })}
            />
          </div>
        </Card>

        <Card>
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Accessibility / sensory</p>
              <h2>Make the app calmer</h2>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              <span>Text size</span>
              <select
                value={settings.textSize}
                onChange={(event) =>
                  updateSettings({ textSize: event.target.value as TextSize })
                }
              >
                <option value="standard">Standard</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra large</option>
              </select>
            </label>

            <label>
              <span>Layout density</span>
              <select
                value={settings.layoutDensity}
                onChange={(event) =>
                  updateSettings({
                    layoutDensity: event.target.value as LayoutDensity,
                  })
                }
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </label>
          </div>

          <div className="settings-toggle-list">
            <ToggleRow
              label="Reduced motion"
              description="Minimizes transitions, hover movement, and decorative motion in current UI."
              checked={settings.reducedMotion}
              onChange={(checked) => updateSettings({ reducedMotion: checked })}
            />
            <ToggleRow
              label="High contrast"
              description="Applies stronger borders, clearer surfaces, and higher-contrast controls."
              checked={settings.highContrast}
              onChange={(checked) => updateSettings({ highContrast: checked })}
            />
            <ToggleRow
              label="Fewer emojis"
              description="Reduces decorative emojis in the main app shell and timer mood scale."
              checked={settings.fewerEmojis}
              onChange={(checked) => updateSettings({ fewerEmojis: checked })}
              status="Partial"
            />
            <ToggleRow
              label="Calm mode"
              description="Softens dashboard density and hides the most decorative dashboard prompts."
              checked={settings.calmMode}
              onChange={(checked) => updateSettings({ calmMode: checked })}
              status="Partial"
            />
          </div>
        </Card>
      </div>

      <Card className="settings-calendar-sync-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Google Calendar</p>
            <h2>Google Calendar Sync</h2>
            <p className="muted-text">
              Read-only: SSG can see calendar busy time, but cannot change your
              Google Calendar. Access tokens stay in memory only, so reconnect
              after a page refresh. Direct Apple/iCloud sync is not part of this
              version.
            </p>
          </div>
          <span className="pill">Read-only</span>
        </div>

        <div className="settings-calendar-action-row">
          <Button
            variant="soft"
            disabled={!GOOGLE_CLIENT_ID || isGoogleCalendarBusy}
            onClick={handleConnectGoogleCalendar}
          >
            Connect Google Calendar
          </Button>
          <Button
            variant="soft"
            disabled={googleCalendarSources.length === 0 || isGoogleCalendarBusy}
            onClick={() =>
              setGoogleCalendarStatus({
                tone: "neutral",
                message: "Choose calendars below, then import events.",
              })
            }
          >
            Select Google calendars
          </Button>
          <Button
            variant="soft"
            disabled={
              isGoogleCalendarBusy ||
              !hasGoogleCalendarAccessToken ||
              !googleCalendarSync.importExternalEvents ||
              googleCalendarSync.selectedExternalCalendarIds.length === 0
            }
            onClick={handleImportGoogleCalendarEvents}
          >
            Import events
          </Button>
          <span className="settings-status-pill">
            {isGoogleCalendarBusy ? "Working" : "No writes"}
          </span>
        </div>

        <p className={`settings-backup-status is-${googleCalendarStatus.tone}`}>
          {googleCalendarStatus.message}
        </p>

        {storedGoogleCalendarEvents.fetchedAt ? (
          <div className="settings-backup-summary">
            <span>
              {storedGoogleCalendarEvents.events.length} imported Google events
            </span>
            <span>
              Last import{" "}
              {new Date(
                storedGoogleCalendarEvents.fetchedAt,
              ).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        ) : null}

        {googleCalendarSources.length > 0 ? (
          <div className="settings-google-calendar-list">
            {googleCalendarSources.map((source) => (
              <label key={source.id} className="settings-toggle-row">
                <span>
                  <strong>
                    {source.name}
                    {source.isPrimary ? <em>Primary</em> : null}
                  </strong>
                  <small>
                    Google Calendar ·{" "}
                    {source.canWrite ? "writable in Google" : "read access"} ·
                    SSG imports read-only busy time
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={googleCalendarSync.selectedExternalCalendarIds.includes(
                    source.id,
                  )}
                  onChange={(event) =>
                    handleGoogleCalendarSelection(
                      source.id,
                      event.target.checked,
                    )
                  }
                />
              </label>
            ))}
          </div>
        ) : null}

        <div className="settings-form-grid">
          <label>
            <span>Sync direction</span>
            <select
              value={googleCalendarSync.syncDirection}
              onChange={(event) =>
                updateGoogleCalendarSync({
                  syncDirection: event.target
                    .value as GoogleCalendarSyncDirection,
                })
              }
            >
              <option value="read-only">Read only</option>
              <option value="write-only" disabled>
                Write only later
              </option>
              <option value="two-way" disabled>
                Two-way later
              </option>
            </select>
            <small>
              V1 only imports Google events as busy-time constraints.
            </small>
          </label>
        </div>

        <div className="settings-toggle-list">
          <ToggleRow
            label="Enable Google Calendar sync planning"
            description="Allow SSG to store read-only Google Calendar preferences and imported busy-time events locally."
            checked={googleCalendarSync.enabled}
            onChange={(checked) =>
              updateGoogleCalendarSync({ enabled: checked })
            }
          />
          <ToggleRow
            label="Import Google events as busy time"
            description="Hide titles, descriptions, and locations from SSG when importing external Google events."
            checked={
              googleCalendarSync.importExternalEvents &&
              googleCalendarSync.importAsBusyOnly
            }
            onChange={(checked) =>
              updateGoogleCalendarSync({
                importExternalEvents: checked,
                importAsBusyOnly: checked,
              })
            }
          />
          <ToggleRow
            label="Export working blocks"
            description="Opt in later when you want SSG working blocks to appear on Google Calendar."
            checked={googleCalendarSync.exportWorkingBlocks}
            onChange={(checked) =>
              updateGoogleCalendarSync({ exportWorkingBlocks: checked })
            }
          />
          <ToggleRow
            label="Export planned task blocks"
            description="Opt in later when planned task blocks are ready to create Google Calendar events."
            checked={googleCalendarSync.exportPlannedTaskBlocks}
            onChange={(checked) =>
              updateGoogleCalendarSync({ exportPlannedTaskBlocks: checked })
            }
          />
          <ToggleRow
            label="Export research deadlines"
            description="Deadline-style dates are calendar-friendly, so this starts export-ready."
            checked={googleCalendarSync.exportResearchDeadlines}
            onChange={(checked) =>
              updateGoogleCalendarSync({ exportResearchDeadlines: checked })
            }
          />
          <ToggleRow
            label="Export teaching deadlines"
            description="Keep course and teaching deadlines available for future Google Calendar export."
            checked={googleCalendarSync.exportTeachingDeadlines}
            onChange={(checked) =>
              updateGoogleCalendarSync({ exportTeachingDeadlines: checked })
            }
          />
          <ToggleRow
            label="Export service deadlines"
            description="Keep committee and service deadlines available for future Google Calendar export."
            checked={googleCalendarSync.exportServiceDeadlines}
            onChange={(checked) =>
              updateGoogleCalendarSync({ exportServiceDeadlines: checked })
            }
          />
          <ToggleRow
            label="Export timer sessions"
            description="Off by default because timer history is more personal than calendar planning."
            checked={googleCalendarSync.exportTimerSessions}
            onChange={(checked) =>
              updateGoogleCalendarSync({ exportTimerSessions: checked })
            }
          />
          <ToggleRow
            label="Export manual work logs"
            description="Off by default so manually logged work stays private unless you choose otherwise later."
            checked={googleCalendarSync.exportManualWorkLogs}
            onChange={(checked) =>
              updateGoogleCalendarSync({ exportManualWorkLogs: checked })
            }
          />
        </div>

        <div className="settings-calendar-apple-note">
          <h3>Want this in Apple Calendar too?</h3>
          <p>
            Apple Calendar can show these same events by adding your Google
            account to Apple Calendar on iPhone, iPad, or Mac and turning on
            Calendars. Direct iCloud or Apple Calendar sync may be considered
            later, but it is not needed for this path.
          </p>
        </div>
      </Card>

      <CloudSyncCard />

      <DataBackupCard />

      <Card>
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Options reset</p>
            <h2>Reset settings only</h2>
            <p className="muted-text">
              This only resets app options to defaults. It does not clear tasks,
              planning records, timer sessions, Research, Teaching, Service, or
              Mindspace data.
            </p>
          </div>
        </div>

        <div className="settings-actions">
          <Button variant="soft" onClick={resetSettings}>
            Reset options to defaults
          </Button>
        </div>
      </Card>
    </section>
  );
}
