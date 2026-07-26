import {
  GOOGLE_CALENDAR_READONLY_SCOPE,
  GOOGLE_CLIENT_ID,
  GOOGLE_IDENTITY_SCRIPT_URL,
} from "./googleCalendarConfig";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: unknown) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (
            config: GoogleTokenClientConfig,
          ) => GoogleTokenClient;
        };
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2?.initTokenClient) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Google Identity Services failed to load."));
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export async function requestGoogleCalendarAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Client ID missing. Add VITE_GOOGLE_CLIENT_ID to enable Google Calendar connection.");
  }

  await loadGoogleIdentityScript();

  const initTokenClient = window.google?.accounts?.oauth2?.initTokenClient;

  if (!initTokenClient) {
    throw new Error("Google Identity Services are not available in this browser session.");
  }

  return new Promise((resolve, reject) => {
    const tokenClient = initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_CALENDAR_READONLY_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(
            new Error(
              response.error_description ||
                `Google access was not granted (${response.error}).`,
            ),
          );
          return;
        }

        if (!response.access_token) {
          reject(new Error("Google access was cancelled before a token was returned."));
          return;
        }

        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(
          error instanceof Error
            ? error
            : new Error("Google Calendar access request did not complete."),
        );
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}
