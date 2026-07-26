import { useLocalStorage } from "./useLocalStorage";
import { APP_SETTINGS_STORAGE_KEY } from "../constants/settingsStorage";
import {
  defaultAppSettings,
  type AppSettings,
} from "../types/settings";

function mergeAppSettingsWithDefaults(
  settings?: Partial<AppSettings> | null,
): AppSettings {
  return {
    ...defaultAppSettings,
    ...(settings ?? {}),
    googleCalendarSync: {
      ...defaultAppSettings.googleCalendarSync,
      ...(settings?.googleCalendarSync ?? {}),
      selectedExternalCalendarIds: Array.isArray(
        settings?.googleCalendarSync?.selectedExternalCalendarIds,
      )
        ? settings.googleCalendarSync.selectedExternalCalendarIds
        : defaultAppSettings.googleCalendarSync.selectedExternalCalendarIds,
    },
  };
}

export function useAppSettings() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    APP_SETTINGS_STORAGE_KEY,
    defaultAppSettings,
  );

  function updateSettings(updates: Partial<AppSettings>) {
    setSettings((currentSettings) =>
      mergeAppSettingsWithDefaults({
        ...currentSettings,
        ...updates,
        googleCalendarSync:
          updates.googleCalendarSync
            ? {
                ...currentSettings.googleCalendarSync,
                ...updates.googleCalendarSync,
              }
            : currentSettings.googleCalendarSync,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  function resetSettings() {
    setSettings({
      ...defaultAppSettings,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    settings: mergeAppSettingsWithDefaults(settings),
    updateSettings,
    resetSettings,
  };
}
