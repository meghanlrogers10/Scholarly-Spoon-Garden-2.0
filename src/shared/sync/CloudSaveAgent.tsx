import { useCallback, useEffect, useRef } from "react";
import { useAuthUser } from "../auth/useAuthUser";
import {
  CLOUD_SAVE_AUTO_DEBOUNCE_MS,
  CLOUD_SAVE_REQUEST_SYNC_EVENT,
  canAttemptCloudSave,
  queueStorageKeyForCloudSave,
  runCloudSave,
  setCloudSaveRuntimeStatus,
} from "./cloudSaveManager";
import type { CloudSaveArea } from "./cloudSaveTypes";
import { saveLocalBackupSnapshot } from "./localBackup";
import {
  getPendingCloudSaveQueue,
} from "./syncQueue";
import {
  LOCAL_STORAGE_CHANGE_EVENT,
  type LocalStorageChangeDetail,
} from "../utils/localStorageSync";

function getAreasWaitingToSync(): CloudSaveArea[] {
  return Array.from(
    new Set(getPendingCloudSaveQueue().map((item) => item.area)),
  );
}

export function CloudSaveAgent() {
  const { user } = useAuthUser();
  const debounceRef = useRef<number | null>(null);
  const syncingRef = useRef(false);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    uidRef.current = user?.uid ?? null;
  }, [user?.uid]);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const syncQueuedAreas = useCallback(
    async (manual = false) => {
      const uid = uidRef.current;
      const queuedAreas = getAreasWaitingToSync();
      const areas = queuedAreas.length > 0 ? queuedAreas : undefined;

      if (!uid || syncingRef.current) {
        return;
      }

      if (!canAttemptCloudSave(uid)) {
        setCloudSaveRuntimeStatus({
          tone: navigator.onLine ? "neutral" : "warning",
          message: navigator.onLine
            ? "Saved locally. Cloud Save will sync after sign-in and setup are ready."
            : "Offline. Changes are saved locally and will sync when you reconnect.",
          online: navigator.onLine,
          pendingCount: getPendingCloudSaveQueue().length,
        });
        return;
      }

      syncingRef.current = true;

      try {
        await runCloudSave({ uid, areas, manual });
      } finally {
        syncingRef.current = false;
      }
    },
    [],
  );

  const scheduleQueuedSync = useCallback(() => {
    clearDebounce();
    debounceRef.current = window.setTimeout(() => {
      void syncQueuedAreas(false);
    }, CLOUD_SAVE_AUTO_DEBOUNCE_MS);
  }, [clearDebounce, syncQueuedAreas]);

  useEffect(() => {
    saveLocalBackupSnapshot(user?.uid);
  }, [user?.uid]);

  useEffect(() => {
    function handleLocalStorageChange(event: Event) {
      const detail = (event as CustomEvent<LocalStorageChangeDetail>).detail;

      if (!detail?.key || syncingRef.current) {
        return;
      }

      const area = queueStorageKeyForCloudSave(detail.key);

      if (!area) {
        return;
      }

      saveLocalBackupSnapshot(uidRef.current ?? undefined);
      setCloudSaveRuntimeStatus({
        tone: navigator.onLine ? "neutral" : "warning",
        message: navigator.onLine
          ? "Saved locally. Cloud Save is waiting for the next sync window."
          : "Offline. Changes are saved locally and will sync when you reconnect.",
        online: navigator.onLine,
        pendingCount: getPendingCloudSaveQueue().length,
      });
      scheduleQueuedSync();
    }

    function handleCrossTabStorageChange(event: StorageEvent) {
      if (event.key) {
        handleLocalStorageChange(
          new CustomEvent<LocalStorageChangeDetail>(LOCAL_STORAGE_CHANGE_EVENT, {
            detail: { key: event.key },
          }),
        );
      }
    }

    function handleOnline() {
      setCloudSaveRuntimeStatus({
        tone: "neutral",
        message: "Back online. Cloud Save is checking for changes to sync.",
        online: true,
        pendingCount: getPendingCloudSaveQueue().length,
      });
      scheduleQueuedSync();
    }

    function handleOffline() {
      clearDebounce();
      saveLocalBackupSnapshot(uidRef.current ?? undefined);
      setCloudSaveRuntimeStatus({
        tone: "warning",
        message: "Offline. Changes are saved locally and will sync when you reconnect.",
        online: false,
        pendingCount: getPendingCloudSaveQueue().length,
      });
    }

    function handleManualSyncRequest() {
      clearDebounce();
      void syncQueuedAreas(true);
    }

    window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleLocalStorageChange);
    window.addEventListener("storage", handleCrossTabStorageChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(CLOUD_SAVE_REQUEST_SYNC_EVENT, handleManualSyncRequest);

    return () => {
      clearDebounce();
      window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleLocalStorageChange);
      window.removeEventListener("storage", handleCrossTabStorageChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        CLOUD_SAVE_REQUEST_SYNC_EVENT,
        handleManualSyncRequest,
      );
    };
  }, [clearDebounce, scheduleQueuedSync, syncQueuedAreas, user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      scheduleQueuedSync();
    }
  }, [scheduleQueuedSync, user?.uid]);

  return null;
}

