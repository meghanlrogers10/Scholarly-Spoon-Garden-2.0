import "../settings.css";
import { useRef, useState, type FormEvent } from "react";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { getAppDisplayName, normalizePreferredName } from "../../../shared/auth/displayName";
import { useAuthUser } from "../../../shared/auth/useAuthUser";
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
import { CloudSyncCard } from "../components/CloudSyncCard";
import { DataBackupCard } from "../components/DataBackupCard";
import { mergeGoogleCalendarSyncSettings } from "../utils/googleCalendarSyncSettings";

function formatHour(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  return date.toLocaleTimeString([], { hour: "numeric" });
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
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle-row">
      <span>
        <strong>{label}</strong>
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
  const { user, signOut } = useAuthUser();
  const { settings, updateSettings, resetSettings } = useAppSettings();
  const [profileStatus, setProfileStatus] = useState<SettingsStatus>({
    tone: "neutral",
    message: "Preferred name is saved as an app setting only.",
  });
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
        ? "Google Calendar is ready to connect."
        : "Google Calendar connection is not configured for this build.",
    });
  const [isGoogleCalendarBusy, setIsGoogleCalendarBusy] = useState(false);

  function handleStartHourChange(value: string) {
    const nextStartHour = Number(value);

    updateSettings({
      calendarDayStartHour: nextStartHour,
      calendarDayEndHour: Math.max(settings.calendarDayEndHour, nextStartHour + 1),
    });
  }

  function handleEndHourChange(value: string) {
    const nextEndHour = Number(value);

    updateSettings({
      calendarDayStartHour: Math.min(settings.calendarDayStartHour, nextEndHour - 1),
      calendarDayEndHour: nextEndHour,
    });
  }

  function handlePreferredNameSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const preferredName = normalizePreferredName(formData.get("preferredName"));
    const preferredNameUpdatedAt = new Date().toISOString();

    updateSettings({ preferredName, preferredNameUpdatedAt });
    setProfileStatus({
      tone: "success",
      message: preferredName
        ? "Preferred name saved."
        : "Preferred name cleared. The app will use your account name or email fallback.",
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
        message: "Google Calendar connection is not configured for this build.",
      });
      return;
    }

    setIsGoogleCalendarBusy(true);
    setHasGoogleCalendarAccessToken(false);
    setGoogleCalendarStatus({
      tone: "neutral",
      message: "Opening Google Calendar access...",
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
            ? `Connected. ${sources.length} calendars are available.`
            : "Connected, but no Google calendars were returned.",
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
      ? Array.from(new Set([...googleCalendarSync.selectedExternalCalendarIds, calendarId]))
      : googleCalendarSync.selectedExternalCalendarIds.filter(
          (selectedCalendarId) => selectedCalendarId !== calendarId,
        );

    updateGoogleCalendarSync({ selectedExternalCalendarIds: selectedCalendarIds });
    syncSelectedCalendarSources(selectedCalendarIds);
  }

  async function handleImportGoogleCalendarEvents() {
    if (!accessTokenRef.current) {
      setHasGoogleCalendarAccessToken(false);
      setGoogleCalendarStatus({
        tone: "warning",
        message: "Reconnect Google Calendar first.",
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

    setIsGoogleCalendarBusy(true);
    setGoogleCalendarStatus({
      tone: "neutral",
      message: "Importing selected Google Calendar events as busy time...",
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
        importExternalEvents: true,
        lastSyncAt: now,
        lastSyncError: "",
      });
      setGoogleCalendarStatus({
        tone: events.length > 0 ? "success" : "warning",
        message:
          events.length > 0
            ? `Imported ${events.length} Google Calendar events as busy time.`
            : "Import finished. No events were found in this window.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Google Calendar import did not complete.";

      updateGoogleCalendarSync({ lastSyncError: message });
      setGoogleCalendarStatus({ tone: "error", message });
    } finally {
      setIsGoogleCalendarBusy(false);
    }
  }

  const accountName = getAppDisplayName(user, settings.preferredName);

  return (
    <section className="page-stack settings-page">
      <PageHeader
        eyebrow="Options"
        title="Settings"
        description="Profile, cloud save, integrations, and app preferences in one quieter place."
      />

      <div className="settings-back-row">
        <Link className="text-button" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>

      <div className="settings-primary-grid">
        <Card className="settings-profile-card">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>{accountName}</h2>
              <p className="muted-text">
                Preferred name changes only how Scholarly Spoon Garden greets
                you. It does not change your Firebase or Google account name.
              </p>
            </div>
          </div>

          <form className="settings-form-grid" onSubmit={handlePreferredNameSave}>
            <label className="settings-full-width">
              <span>Preferred name</span>
              <input
                key={settings.preferredName ?? "preferred-name-empty"}
                name="preferredName"
                defaultValue={settings.preferredName ?? ""}
                placeholder={user?.displayName ?? "What should the app call you?"}
                autoComplete="nickname"
              />
            </label>
            <div className="settings-profile-account">
              <span>Signed in as</span>
              <strong>{user?.email ?? "Not signed in"}</strong>
            </div>
            <div className="settings-actions settings-actions--inline">
              <Button type="submit">Save preferred name</Button>
              {user ? (
                <Button type="button" variant="soft" onClick={signOut}>
                  <LogOut size={16} aria-hidden="true" /> Sign out
                </Button>
              ) : null}
            </div>
          </form>

          <p
            className={`settings-backup-status is-${profileStatus.tone}`}
            role="status"
            aria-live="polite"
          >
            {profileStatus.message}
          </p>
        </Card>

        <CloudSyncCard />
      </div>

      <Card className="settings-calendar-sync-card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Integrations</p>
            <h2>Google Calendar</h2>
            <p className="muted-text">
              Import selected Google events as read-only busy time for dashboard
              planning.
            </p>
          </div>
          <span className="pill">
            {googleCalendarSync.enabled ? "Connected settings" : "Not connected"}
          </span>
        </div>

        <div className="settings-calendar-action-row">
          <Button
            variant="soft"
            disabled={!GOOGLE_CLIENT_ID || isGoogleCalendarBusy}
            onClick={handleConnectGoogleCalendar}
          >
            {hasGoogleCalendarAccessToken ? "Reconnect Google Calendar" : "Connect Google Calendar"}
          </Button>
          <Button
            disabled={
              isGoogleCalendarBusy ||
              !hasGoogleCalendarAccessToken ||
              googleCalendarSync.selectedExternalCalendarIds.length === 0
            }
            onClick={handleImportGoogleCalendarEvents}
          >
            Import busy time
          </Button>
          <span className="settings-status-pill">
            {isGoogleCalendarBusy ? "Working" : "Read-only"}
          </span>
        </div>

        <p
          className={`settings-backup-status is-${googleCalendarStatus.tone}`}
          role="status"
          aria-live="polite"
        >
          {googleCalendarStatus.message}
        </p>

        {storedGoogleCalendarEvents.fetchedAt ? (
          <div className="settings-backup-summary">
            <span>{storedGoogleCalendarEvents.events.length} imported events</span>
            <span>
              Last import{" "}
              {new Date(storedGoogleCalendarEvents.fetchedAt).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        ) : null}

        <details className="settings-details">
          <summary>Calendars and import options</summary>

          {googleCalendarSources.length > 0 ? (
            <div className="settings-google-calendar-list">
              {googleCalendarSources.map((source) => (
                <label key={source.id} className="settings-toggle-row">
                  <span>
                    <strong>{source.name}</strong>
                    <small>
                      {source.isPrimary ? "Primary calendar" : "Google calendar"}
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={googleCalendarSync.selectedExternalCalendarIds.includes(source.id)}
                    onChange={(event) =>
                      handleGoogleCalendarSelection(source.id, event.target.checked)
                    }
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="muted-text">
              Connect Google Calendar to choose which calendars become busy time.
            </p>
          )}

          <div className="settings-toggle-list">
            <ToggleRow
              label="Import events"
              description="Use selected Google calendars as planning constraints."
              checked={googleCalendarSync.importExternalEvents}
              onChange={(checked) =>
                updateGoogleCalendarSync({ importExternalEvents: checked })
              }
            />
            <ToggleRow
              label="Busy-only import"
              description="Hide event titles, descriptions, and locations."
              checked={googleCalendarSync.importAsBusyOnly}
              onChange={(checked) =>
                updateGoogleCalendarSync({ importAsBusyOnly: checked })
              }
            />
          </div>

          <div className="settings-form-grid">
            <label>
              <span>Sync direction</span>
              <select
                value={googleCalendarSync.syncDirection}
                onChange={(event) =>
                  updateGoogleCalendarSync({
                    syncDirection: event.target.value as GoogleCalendarSyncDirection,
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
            </label>
          </div>
        </details>
      </Card>

      <section className="settings-section">
        <div className="settings-section-heading">
          <p className="eyebrow">App preferences</p>
          <h2>Planning, timer, and display</h2>
        </div>

        <div className="settings-section-grid">
          <Card>
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">Calendar</p>
                <h2>Visible time</h2>
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
                <span>Working block</span>
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
                description="Include Saturday and Sunday in planning views."
                checked={settings.showWeekends}
                onChange={(checked) => updateSettings({ showWeekends: checked })}
              />
            </div>
          </Card>

          <Card>
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">Planning</p>
                <h2>Daily defaults</h2>
              </div>
            </div>

            <div className="settings-form-grid">
              <label>
                <span>Planning mode</span>
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
                  <option value="low-energy">Low energy</option>
                  <option value="deadline-emergency">Deadline emergency</option>
                  <option value="small-task-cleanup">Small-task cleanup</option>
                </select>
              </label>
              <label>
                <span>Spoon warning</span>
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
                <span>Task warning</span>
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
                description="Prompt for spoons, working blocks, and planning mode."
                checked={settings.dailyCheckInEnabled}
                onChange={(checked) => updateSettings({ dailyCheckInEnabled: checked })}
              />
              <ToggleRow
                label="Realistic-plan warnings"
                description="Flag overloaded plans before they become painful."
                checked={settings.realisticPlanWarnings}
                onChange={(checked) =>
                  updateSettings({ realisticPlanWarnings: checked })
                }
              />
              <ToggleRow
                label="Low-energy by default"
                description="Bias suggestions toward smaller next moves."
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
                <h2>Focus defaults</h2>
              </div>
            </div>

            <div className="settings-form-grid">
              <label>
                <span>Focus length</span>
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
                <span>Break length</span>
                <select
                  value={settings.timerBreakMinutes}
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
                      timerReflectionLevel: event.target.value as TimerReflectionLevel,
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
                description="Play the focus timer completion chime."
                checked={settings.timerSoundAlerts}
                onChange={(checked) => updateSettings({ timerSoundAlerts: checked })}
              />
              <ToggleRow
                label="Visual alerts"
                description="Show visible timer nudges."
                checked={settings.timerVisualAlerts}
                onChange={(checked) => updateSettings({ timerVisualAlerts: checked })}
              />
            </div>
          </Card>

          <Card>
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">Display</p>
                <h2>Comfort</h2>
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
                description="Minimize animation and hover movement."
                checked={settings.reducedMotion}
                onChange={(checked) => updateSettings({ reducedMotion: checked })}
              />
              <ToggleRow
                label="High contrast"
                description="Use stronger borders and clearer surfaces."
                checked={settings.highContrast}
                onChange={(checked) => updateSettings({ highContrast: checked })}
              />
              <ToggleRow
                label="Fewer emojis"
                description="Reduce decorative emoji in supported areas."
                checked={settings.fewerEmojis}
                onChange={(checked) => updateSettings({ fewerEmojis: checked })}
              />
              <ToggleRow
                label="Calm mode"
                description="Soften dashboard density where supported."
                checked={settings.calmMode}
                onChange={(checked) => updateSettings({ calmMode: checked })}
              />
            </div>
          </Card>
        </div>
      </section>

      <details className="settings-advanced">
        <summary>Restore or advanced options</summary>
        <div className="settings-advanced-content">
          <DataBackupCard />
          <Card>
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">Advanced</p>
                <h2>Reset app preferences</h2>
                <p className="muted-text">
                  This resets only app settings. It does not clear tasks,
                  planning records, timer logs, Research, Teaching, Service, or
                  Mindspace data.
                </p>
              </div>
            </div>
            <div className="settings-actions">
              <Button variant="soft" onClick={resetSettings}>
                Reset preferences to defaults
              </Button>
            </div>
          </Card>
        </div>
      </details>
    </section>
  );
}
