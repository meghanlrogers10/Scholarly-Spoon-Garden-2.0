export const LOCAL_STORAGE_CHANGE_EVENT = "ssg2-local-storage-change";

export type LocalStorageChangeDetail = {
  key: string;
};

export function notifyLocalStorageChange(key: string) {
  window.dispatchEvent(
    new CustomEvent<LocalStorageChangeDetail>(LOCAL_STORAGE_CHANGE_EVENT, {
      detail: { key },
    }),
  );
}

export function readLocalStorageValue<T>(key: string, fallbackValue: T): T {
  const storedValue = window.localStorage.getItem(key);

  if (!storedValue) {
    return fallbackValue;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;

    if (Array.isArray(fallbackValue) && !Array.isArray(parsedValue)) {
      return fallbackValue;
    }

    return parsedValue as T;
  } catch {
    return fallbackValue;
  }
}

export function writeLocalStorageValue<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  notifyLocalStorageChange(key);
}
