import { MANUAL_WORK_LOGS_STORAGE_KEY } from "../../../shared/constants/timerStorage";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import type { ManualWorkLogEntry } from "../../../shared/types/workLog";

export type ManualWorkLogInput = Omit<
  ManualWorkLogEntry,
  "id" | "createdAt"
>;

export function useManualWorkLogs() {
  const [manualWorkLogs, setManualWorkLogs] = useLocalStorage<
    ManualWorkLogEntry[]
  >(MANUAL_WORK_LOGS_STORAGE_KEY, []);

  function addManualWorkLog(input: ManualWorkLogInput) {
    const newEntry: ManualWorkLogEntry = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };

    setManualWorkLogs((currentEntries) => [newEntry, ...currentEntries]);
  }

  function deleteManualWorkLog(id: string) {
    setManualWorkLogs((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== id),
    );
  }

  function clearManualWorkLogs() {
    setManualWorkLogs([]);
  }

  return {
    manualWorkLogs,
    addManualWorkLog,
    deleteManualWorkLog,
    clearManualWorkLogs,
  };
}
