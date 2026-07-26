export type DisplayNameUser = {
  displayName?: string | null;
  email?: string | null;
};

export function normalizePreferredName(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getEmailDisplayName(email?: string | null) {
  const localPart = email?.split("@")[0]?.trim();

  if (!localPart) {
    return "Signed in";
  }

  return localPart
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function getAppDisplayName(
  user: DisplayNameUser | null | undefined,
  preferredName?: unknown,
) {
  return (
    normalizePreferredName(preferredName) ??
    normalizePreferredName(user?.displayName) ??
    getEmailDisplayName(user?.email)
  );
}
