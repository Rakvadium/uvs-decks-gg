import { readStorageWithLegacy } from "@/lib/storage-keys";
import {
  DEFAULT_SIDEBAR_WIDTH,
  LEGACY_SIDEBAR_WIDTH_KEY,
  MAX_SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_KEY,
} from "./types";

export function getInitialSidebarWidth(): number {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;

  const stored = readStorageWithLegacy(SIDEBAR_WIDTH_KEY, LEGACY_SIDEBAR_WIDTH_KEY);
  if (stored === null) return DEFAULT_SIDEBAR_WIDTH;

  const parsed = parseInt(stored, 10);
  if (isNaN(parsed)) return DEFAULT_SIDEBAR_WIDTH;

  return Math.max(DEFAULT_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed));
}
