import type { CalendarItem } from "../types/calendar";
import type { GoogleCalendarEvent } from "../types/googleCalendarSync";

export const GOOGLE_CALENDAR_EVENTS_STORAGE_KEY = "ssg2.googleCalendarEvents";

export type StoredGoogleCalendarEvents = {
  fetchedAt: string;
  windowStart: string;
  windowEnd: string;
  events: GoogleCalendarEvent[];
};

export type ExternalBusyWindow = {
  id: string;
  start: string;
  end: string;
  allDay: boolean;
  title: string;
};

export const emptyStoredGoogleCalendarEvents: StoredGoogleCalendarEvents = {
  fetchedAt: "",
  windowStart: "",
  windowEnd: "",
  events: [],
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayOffsetFromDateKey(dateKey: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(`${dateKey}T00:00:00`);
  date.setHours(0, 0, 0, 0);

  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

function getDayOffsetFromGoogleStart(start: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    return getDayOffsetFromDateKey(start);
  }

  return getDayOffsetFromDateKey(getDateKey(new Date(start)));
}

function formatGoogleEventTime(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function mapGoogleCalendarEventsToCalendarItems(
  events: GoogleCalendarEvent[],
): CalendarItem[] {
  return events.map((event) => ({
    id: `external-google-${event.calendarId}-${event.externalId}`,
    entityId: event.externalId,
    dayOffset: getDayOffsetFromGoogleStart(event.start),
    title: event.importedAsBusyOnly ? "Busy" : event.title,
    category: "Other",
    source: "external-google",
    time: event.allDay ? undefined : formatGoogleEventTime(event.start),
    endTime: event.allDay ? undefined : formatGoogleEventTime(event.end),
    isAllDay: event.allDay,
    notes: event.importedAsBusyOnly
      ? "Read-only busy time imported from Google Calendar."
      : event.description,
    sourceUrl: event.sourceUrl,
    externalCalendarId: event.calendarId,
    importedAsBusyOnly: event.importedAsBusyOnly,
  }));
}

export function getExternalBusyWindowsForDate(
  events: GoogleCalendarEvent[],
  date: string,
): ExternalBusyWindow[] {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return events
    .filter((event) => {
      const start = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(event.start)
          ? `${event.start}T00:00:00`
          : event.start,
      );
      const end = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(event.end)
          ? `${event.end}T00:00:00`
          : event.end,
      );

      return start < dayEnd && end > dayStart;
    })
    .map((event) => ({
      id: event.id,
      start: event.start,
      end: event.end,
      allDay: Boolean(event.allDay),
      title: event.importedAsBusyOnly ? "Busy" : event.title,
    }));
}
