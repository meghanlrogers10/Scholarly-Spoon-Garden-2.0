import type { CalendarItem } from "../../../shared/types/calendar";
import type { WorkingBlock } from "../../../shared/types/planning";

function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function getDateFromKey(date: string) {
  const target = new Date(`${date}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  return target;
}

function getDayOffsetFromDateKey(date: string) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (getDateFromKey(date).getTime() - getTodayDate().getTime()) /
      millisecondsPerDay,
  );
}

function getMinutesFromTime(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

export function getWorkingBlockDurationMinutes(block: WorkingBlock) {
  const duration =
    getMinutesFromTime(block.endTime) - getMinutesFromTime(block.startTime);

  return duration > 0 ? duration : 0;
}

export function formatWorkingBlockTimeRange(block: WorkingBlock) {
  return `${block.startTime}-${block.endTime}`;
}

export function formatWorkingBlockDuration(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function getTodaysWorkingBlocks(blocks: WorkingBlock[], todayDate: string) {
  return blocks.filter((block) => block.date === todayDate);
}

export function getNextUpcomingWorkingBlock(blocks: WorkingBlock[]) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return blocks
    .filter((block) => getMinutesFromTime(block.endTime) >= currentMinutes)
    .sort(
      (a, b) => getMinutesFromTime(a.startTime) - getMinutesFromTime(b.startTime),
    )[0];
}

export function mapWorkingBlocksToCalendarEvents(
  blocks: WorkingBlock[],
): CalendarItem[] {
  return blocks.map((block) => ({
    id: `working-block-${block.id}`,
    entityId: block.id,
    dayOffset: getDayOffsetFromDateKey(block.date),
    title:
      block.status === "cancelled"
        ? "Available: cancelled block"
        : "Available: working block",
    category: "Other",
    source: "working-block",
    time: block.startTime,
    endTime: block.endTime,
    workingBlockStatus: block.status,
    notes: block.notes,
    plannedTaskIds: block.plannedTaskIds,
    actualSessionIds: block.actualSessionIds,
  }));
}
