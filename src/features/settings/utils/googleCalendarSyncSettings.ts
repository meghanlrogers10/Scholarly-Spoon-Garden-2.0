import {
  defaultGoogleCalendarSyncSettings,
  type GoogleCalendarSyncSettings,
} from "../../../shared/types/googleCalendarSync";

export function getDefaultGoogleCalendarSyncSettings(): GoogleCalendarSyncSettings {
  return {
    ...defaultGoogleCalendarSyncSettings,
    selectedExternalCalendarIds: [
      ...defaultGoogleCalendarSyncSettings.selectedExternalCalendarIds,
    ],
  };
}

export function mergeGoogleCalendarSyncSettings(
  saved?: Partial<GoogleCalendarSyncSettings> | null,
): GoogleCalendarSyncSettings {
  return {
    ...getDefaultGoogleCalendarSyncSettings(),
    ...(saved ?? {}),
    selectedExternalCalendarIds: Array.isArray(
      saved?.selectedExternalCalendarIds,
    )
      ? saved.selectedExternalCalendarIds.filter(
          (calendarId): calendarId is string => typeof calendarId === "string",
        )
      : [],
  };
}

export function isGoogleCalendarSyncEnabled(
  settings: GoogleCalendarSyncSettings,
) {
  return settings.enabled;
}

export function shouldImportGoogleEvents(settings: GoogleCalendarSyncSettings) {
  return (
    settings.enabled &&
    settings.importExternalEvents &&
    settings.syncDirection !== "write-only"
  );
}

export function shouldExportSsgPlanningBlocks(
  settings: GoogleCalendarSyncSettings,
) {
  return (
    settings.enabled &&
    settings.syncDirection !== "read-only" &&
    (settings.exportWorkingBlocks || settings.exportPlannedTaskBlocks)
  );
}
