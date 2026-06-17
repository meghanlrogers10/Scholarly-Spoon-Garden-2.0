import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import type {
  DailyCheckIn,
  PlanningMode,
  WorkingBlock,
} from "../../../shared/types/planning";
import {
  DAILY_CHECK_IN_STORAGE_KEY,
  normalizeDailyCheckIns,
} from "../utils/planningStorage";

type DailyCheckInInput = {
  availableSpoons: DailyCheckIn["availableSpoons"];
  planningMode: PlanningMode;
  workingBlocks: WorkingBlock[];
  avoidNotes?: string;
  protectNotes?: string;
  preferLowEnergyTasks?: boolean;
  avoidHighEmotionTasks?: boolean;
  hardStopTime?: string;
};

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
export function useDailyCheckIn() {
  const [storedCheckIns, setStoredCheckIns] = useLocalStorage<unknown[]>(
    DAILY_CHECK_IN_STORAGE_KEY,
    [],
  );
  const checkIns = normalizeDailyCheckIns(storedCheckIns);
  const todayDate = getTodayDateKey();
  const todayCheckIn = checkIns.find((checkIn) => checkIn.date === todayDate);

  function saveTodayCheckIn(input: DailyCheckInInput) {
    const now = new Date().toISOString();

    setStoredCheckIns((currentValue) => {
      const currentCheckIns = normalizeDailyCheckIns(currentValue);
      const existing = currentCheckIns.find(
        (checkIn) => checkIn.date === todayDate,
      );
      const nextCheckIn: DailyCheckIn = {
        id: existing?.id ?? crypto.randomUUID(),
        date: todayDate,
        availableSpoons: input.availableSpoons,
        planningMode: input.planningMode,
        workingBlocks: input.workingBlocks.map((block) => ({
          ...block,
          date: todayDate,
          status: block.status ?? "planned",
        })),
        avoidNotes: input.avoidNotes,
        protectNotes: input.protectNotes,
        preferLowEnergyTasks: input.preferLowEnergyTasks,
        avoidHighEmotionTasks: input.avoidHighEmotionTasks,
        hardStopTime: input.hardStopTime,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      if (existing) {
        return currentCheckIns.map((checkIn) =>
          checkIn.date === todayDate ? nextCheckIn : checkIn,
        );
      }

      return [nextCheckIn, ...currentCheckIns];
    });
  }

  return {
    checkIns,
    todayDate,
    todayCheckIn,
    hasCompletedTodayCheckIn: Boolean(todayCheckIn),
    saveTodayCheckIn,
  };
}
