export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";

export const GOOGLE_CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

export const GOOGLE_IDENTITY_SCRIPT_URL =
  "https://accounts.google.com/gsi/client";

export const GOOGLE_CALENDAR_API_BASE_URL =
  "https://www.googleapis.com/calendar/v3";
