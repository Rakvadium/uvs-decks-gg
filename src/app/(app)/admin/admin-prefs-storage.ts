import type { GameId } from "@shared/games/types";
import {
  appEventName,
  gameStorageKey,
  legacyGameKey,
  readStorageWithLegacy,
} from "@/lib/storage-keys";

/** Per-game key (`tcgdecks:{game}:admin-last-set-code`); set codes belong to one game. */
export function adminLastSetCodeKey(game: GameId): string {
  return gameStorageKey(game, "admin-last-set-code");
}

const LEGACY_ADMIN_LAST_SET_CODE_KEY = "uvs-decks-admin-last-set-code";

export const ADMIN_LAST_SET_CHANGED_EVENT = appEventName("admin-last-set-changed");

export function readAdminLastSetCode(game: GameId): string | null {
  if (typeof window === "undefined") return null;
  const v = readStorageWithLegacy(
    adminLastSetCodeKey(game),
    legacyGameKey(game, LEGACY_ADMIN_LAST_SET_CODE_KEY),
  );
  return v && v.trim() !== "" ? v.trim() : null;
}

export function writeAdminLastSetCode(game: GameId, code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(adminLastSetCodeKey(game), code);
    window.dispatchEvent(new Event(ADMIN_LAST_SET_CHANGED_EVENT));
  } catch {
    return;
  }
}
