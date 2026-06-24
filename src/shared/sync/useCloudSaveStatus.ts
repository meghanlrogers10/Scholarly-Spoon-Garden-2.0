import { useEffect, useMemo, useState } from "react";
import {
  CLOUD_SAVE_RUNTIME_STATUS_KEY,
  readCloudSaveRuntimeStatus,
} from "./cloudSaveManager";
import { getCloudSaveQueue } from "./syncQueue";
import { LOCAL_STORAGE_CHANGE_EVENT } from "../utils/localStorageSync";

export function useCloudSaveStatus() {
  const [status, setStatus] = useState(readCloudSaveRuntimeStatus);
  const [queue, setQueue] = useState(getCloudSaveQueue);

  useEffect(() => {
    function refresh() {
      setStatus(readCloudSaveRuntimeStatus());
      setQueue(getCloudSaveQueue());
    }

    function handleStorageChange(event: Event) {
      const detail = (event as CustomEvent<{ key: string }>).detail;

      if (
        detail?.key === CLOUD_SAVE_RUNTIME_STATUS_KEY ||
        detail?.key === "ssg2.cloudSaveSyncQueue"
      ) {
        refresh();
      }
    }

    function handleCrossTabStorageChange(event: StorageEvent) {
      if (
        event.key === CLOUD_SAVE_RUNTIME_STATUS_KEY ||
        event.key === "ssg2.cloudSaveSyncQueue"
      ) {
        refresh();
      }
    }

    window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleStorageChange);
    window.addEventListener("storage", handleCrossTabStorageChange);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);

    return () => {
      window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleStorageChange);
      window.removeEventListener("storage", handleCrossTabStorageChange);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, []);

  return useMemo(() => ({ status, queue }), [status, queue]);
}

