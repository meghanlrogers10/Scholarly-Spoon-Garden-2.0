import { useEffect } from "react";
import {
  LOCAL_STORAGE_CHANGE_EVENT,
  type LocalStorageChangeDetail,
} from "../../../shared/utils/localStorageSync";

export function useResearchStorageSync(key: string, onChange: () => void) {
  useEffect(() => {
    function handleSameTabStorageChange(event: Event) {
      const detail = (event as CustomEvent<LocalStorageChangeDetail>).detail;

      if (detail?.key === key) {
        onChange();
      }
    }

    function handleCrossTabStorageChange(event: StorageEvent) {
      if (event.key === key) {
        onChange();
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
  }, [key, onChange]);
}
