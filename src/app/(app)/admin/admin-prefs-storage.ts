export const ADMIN_LAST_SET_CODE_KEY = "uvs-decks-admin-last-set-code";

export const ADMIN_LAST_SET_CHANGED_EVENT = "uvs-decks-admin-last-set-changed";

export function readAdminLastSetCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(ADMIN_LAST_SET_CODE_KEY);
    return v && v.trim() !== "" ? v.trim() : null;
  } catch {
    return null;
  }
}

export function writeAdminLastSetCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_LAST_SET_CODE_KEY, code);
    window.dispatchEvent(new Event(ADMIN_LAST_SET_CHANGED_EVENT));
  } catch {
    return;
  }
}
