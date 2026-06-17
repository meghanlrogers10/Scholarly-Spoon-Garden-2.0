import { useLocalStorage } from "./useLocalStorage";
import { APP_SETTINGS_STORAGE_KEY } from "../constants/settingsStorage";
import {
  defaultAppSettings,
  type AppSettings,
} from "../types/settings";

export function useAppSettings() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    APP_SETTINGS_STORAGE_KEY,
    defaultAppSettings,
  );

  function updateSettings(updates: Partial<AppSettings>) {
    setSettings((currentSettings) => ({
      ...defaultAppSettings,
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  }

  function resetSettings() {
    setSettings({
      ...defaultAppSettings,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    settings: {
      ...defaultAppSettings,
      ...settings,
    },
    updateSettings,
    resetSettings,
  };
}
