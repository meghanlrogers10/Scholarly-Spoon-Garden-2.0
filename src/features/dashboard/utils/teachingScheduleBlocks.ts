import type { CalendarItem } from "../../../shared/types/calendar";
import type { DailyCheckIn, WorkingBlock } from "../../../shared/types/planning";
import type {
  TeachingCourse,
  TeachingMeeting,
} from "../../teaching/types";
import { parseMeetingTimeRange } from "../../teaching/utils/teachingSchedule";
import { getWorkingBlockDurationMinutes } from "./workingBlockCalendar";

export const TEACHING_WORKING_BLOCK_PREFIX = "teaching-meeting-";

export function isTeachingWorkingBlock(block: WorkingBlock) {
  return (
    block.source === "teaching-meeting" ||
    block.id.startsWith(TEACHING_WORKING_BLOCK_PREFIX)
  );
}

function getDayOffsetFromDateKey(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function getCourseMap(courses: TeachingCourse[]) {
  return new Map(courses.map((course) => [course.id, course]));
}

function getMeetingTitle(meeting: TeachingMeeting, course: TeachingCourse) {
  return `${course.code}: ${meeting.topic.trim() || "Class meeting"}`;
}

function getMeetingNotes(meeting: TeachingMeeting, course: TeachingCourse) {
  return [course.title, course.location, meeting.notes]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" · ");
}

function getActiveMeetings(
  meetings: TeachingMeeting[],
  courses: TeachingCourse[],
) {
  const courseMap = getCourseMap(courses);

  return meetings
    .filter((meeting) => !meeting.canceled)
    .map((meeting) => ({ meeting, course: courseMap.get(meeting.courseId) }))
    .filter(
      (entry): entry is { meeting: TeachingMeeting; course: TeachingCourse } =>
        Boolean(entry.course && entry.course.status === "active"),
    );
}

export function getTeachingWorkingBlocksForDate(
  meetings: TeachingMeeting[],
  courses: TeachingCourse[],
  date: string,
  existingBlocks: WorkingBlock[] = [],
) {
  const existingById = new Map(
    existingBlocks
      .filter(isTeachingWorkingBlock)
      .map((block) => [block.id, block]),
  );

  return getActiveMeetings(meetings, courses)
    .filter(({ meeting }) => meeting.date === date)
    .map(({ meeting, course }) => {
      const timeRange = parseMeetingTimeRange(course.meetingPattern);

      if (!timeRange) {
        return undefined;
      }

      const id = `${TEACHING_WORKING_BLOCK_PREFIX}${meeting.id}`;
      const existing = existingById.get(id);

      return {
        id,
        date,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        status: existing?.status ?? "planned",
        source: "teaching-meeting" as const,
        plannedTaskIds: existing?.plannedTaskIds,
        actualSessionIds: existing?.actualSessionIds,
        notes: existing?.notes || `Teaching: ${getMeetingTitle(meeting, course)}`,
      } as WorkingBlock;
    })
    .filter((block): block is WorkingBlock => Boolean(block))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function mergeTeachingWorkingBlocks(
  existingBlocks: WorkingBlock[],
  meetings: TeachingMeeting[],
  courses: TeachingCourse[],
  date: string,
) {
  const manualBlocks = existingBlocks.filter((block) => !isTeachingWorkingBlock(block));

  return [...manualBlocks, ...getTeachingWorkingBlocksForDate(meetings, courses, date, existingBlocks)].sort(
    (a, b) => a.startTime.localeCompare(b.startTime),
  );
}

export function getEffectiveDailyCheckIn(
  checkIn: DailyCheckIn | undefined,
  date: string,
  meetings: TeachingMeeting[],
  courses: TeachingCourse[],
  defaultPlanningMode: DailyCheckIn["planningMode"] = "balanced",
) {
  const workingBlocks = mergeTeachingWorkingBlocks(
    checkIn?.workingBlocks ?? [],
    meetings,
    courses,
    date,
  );

  if (!checkIn && workingBlocks.length === 0) {
    return undefined;
  }

  const baseCheckIn = checkIn ?? {
    id: `teaching-check-in-${date}`,
    date,
    availableSpoons: 3 as const,
    planningMode: defaultPlanningMode,
    workingBlocks: [],
    createdAt: date,
    updatedAt: date,
  };

  return { ...baseCheckIn, workingBlocks };
}

export function mapTeachingMeetingsToCalendarEvents(
  meetings: TeachingMeeting[],
  courses: TeachingCourse[],
): CalendarItem[] {
  return getActiveMeetings(meetings, courses).map(({ meeting, course }) => {
    const timeRange = parseMeetingTimeRange(course.meetingPattern);
    const title = getMeetingTitle(meeting, course);

    return {
      id: `${TEACHING_WORKING_BLOCK_PREFIX}calendar-${meeting.id}`,
      entityId: meeting.id,
      dayOffset: getDayOffsetFromDateKey(meeting.date),
      title,
      category: "Teaching",
      source: "teaching-meeting",
      time: timeRange?.startTime,
      endTime: timeRange?.endTime,
      isAllDay: !timeRange,
      estimatedMinutes: timeRange
        ? getWorkingBlockDurationMinutes({
            id: meeting.id,
            date: meeting.date,
            startTime: timeRange.startTime,
            endTime: timeRange.endTime,
            status: "planned",
          })
        : undefined,
      workingBlockId: timeRange
        ? `${TEACHING_WORKING_BLOCK_PREFIX}${meeting.id}`
        : undefined,
      notes: getMeetingNotes(meeting, course),
    };
  });
}

export function getTeachingMinutes(workingBlocks: WorkingBlock[]) {
  return workingBlocks
    .filter(isTeachingWorkingBlock)
    .reduce(
      (totalMinutes, block) => totalMinutes + getWorkingBlockDurationMinutes(block),
      0,
    );
}
