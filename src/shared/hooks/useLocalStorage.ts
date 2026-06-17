import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOCAL_STORAGE_CHANGE_EVENT,
  readLocalStorageValue,
  writeLocalStorageValue,
  type LocalStorageChangeDetail,
} from "../utils/localStorageSync";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    return readLocalStorageValue(key, initialValue);
  });
  const initialValueRef = useRef(initialValue);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const nextValue = readLocalStorageValue(key, initialValueRef.current);

    valueRef.current = nextValue;
    setValue(nextValue);
  }, [key]);

  useEffect(() => {
    function refreshFromStorage() {
      const nextValue = readLocalStorageValue(key, initialValueRef.current);

      valueRef.current = nextValue;
      setValue(nextValue);
    }

    function handleSameTabStorageChange(event: Event) {
      const detail = (event as CustomEvent<LocalStorageChangeDetail>).detail;

      if (detail?.key === key) {
        refreshFromStorage();
      }
    }

    function handleCrossTabStorageChange(event: StorageEvent) {
      if (event.key === key) {
        refreshFromStorage();
      }
    }

    window.addEventListener(
      LOCAL_STORAGE_CHANGE_EVENT,
      handleSameTabStorageChange,
    );
    window.addEventListener("storage", handleCrossTabStorageChange);

    return () => {
      window.removeEventListener(
        LOCAL_STORAGE_CHANGE_EVENT,
        handleSameTabStorageChange,
      );
      window.removeEventListener("storage", handleCrossTabStorageChange);
    };
  }, [key]);

  const setStoredValue = useCallback(
    (nextValueOrUpdater: T | ((currentValue: T) => T)) => {
      const nextValue =
        typeof nextValueOrUpdater === "function"
          ? (nextValueOrUpdater as (currentValue: T) => T)(valueRef.current)
          : nextValueOrUpdater;

      valueRef.current = nextValue;
      setValue(nextValue);
      writeLocalStorageValue(key, nextValue);
    },
    [key],
  );

  return [value, setStoredValue] as const;
}
