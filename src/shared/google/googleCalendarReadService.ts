import type {
  GoogleCalendarEvent,
  GoogleCalendarSource,
} from "../types/googleCalendarSync";
import { GOOGLE_CALENDAR_API_BASE_URL } from "./googleCalendarConfig";

type GoogleCalendarListResponse = {
  items?: Array<{
    id?: string;
    summary?: string;
    backgroundColor?: string;
    primary?: boolean;
    accessRole?: string;
  }>;
};

type GoogleCalendarEventsResponse = {
  items?: GoogleCalendarApiEvent[];
};

type GoogleCalendarApiEvent = {
  id?: string;
  summary?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
  location?: string;
  description?: string;
  status?: string;
  updated?: string;
  htmlLink?: string;
};

type FetchGoogleCalendarEventsOptions = {
  importAsBusyOnly?: boolean;
};

async function fetchGoogleJson<TResponse>(
  accessToken: string,
  url: string,
): Promise<TResponse> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Google Calendar access expired or was denied. Reconnect and try again.");
    }

    throw new Error(`Google Calendar request failed (${response.status}).`);
  }

  return response.json() as Promise<TResponse>;
}

export async function fetchGoogleCalendarList(
  accessToken: string,
): Promise<GoogleCalendarSource[]> {
  const data = await fetchGoogleJson<GoogleCalendarListResponse>(
    accessToken,
    `${GOOGLE_CALENDAR_API_BASE_URL}/users/me/calendarList`,
  );

  return (data.items ?? [])
    .filter((calendar) => Boolean(calendar.id))
    .map((calendar) => ({
      id: calendar.id!,
      accountId: "google-calendar",
      provider: "google" as const,
      name: calendar.summary || "Google Calendar",
      color: calendar.backgroundColor,
      isPrimary: calendar.primary,
      isSelected: false,
      canWrite: calendar.accessRole === "owner" || calendar.accessRole === "writer",
    }));
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  options: FetchGoogleCalendarEventsOptions = {},
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin,
    timeMax,
    maxResults: "250",
  });

  const data = await fetchGoogleJson<GoogleCalendarEventsResponse>(
    accessToken,
    `${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${encodeURIComponent(
      calendarId,
    )}/events?${params.toString()}`,
  );

  return (data.items ?? [])
    .filter((event) => Boolean(event.id && (event.start?.dateTime || event.start?.date)))
    .map((event) => mapGoogleCalendarEvent(calendarId, event, options));
}

function mapGoogleCalendarEvent(
  calendarId: string,
  event: GoogleCalendarApiEvent,
  options: FetchGoogleCalendarEventsOptions,
): GoogleCalendarEvent {
  const start = event.start?.dateTime ?? event.start?.date ?? "";
  const end = event.end?.dateTime ?? event.end?.date ?? start;
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  const importedAsBusyOnly = options.importAsBusyOnly ?? true;

  return {
    id: `google-${calendarId}-${event.id}`,
    provider: "google",
    externalId: event.id!,
    calendarId,
    title: importedAsBusyOnly ? "Google Calendar busy" : event.summary || "(busy)",
    start,
    end,
    allDay,
    location: importedAsBusyOnly ? undefined : event.location,
    description: importedAsBusyOnly ? undefined : event.description,
    status: event.status,
    updatedAt: event.updated,
    sourceUrl: importedAsBusyOnly ? undefined : event.htmlLink,
    importedAsBusyOnly,
  };
}
