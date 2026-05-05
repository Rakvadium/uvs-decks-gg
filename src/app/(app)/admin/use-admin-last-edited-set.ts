"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  ADMIN_LAST_SET_CHANGED_EVENT,
  ADMIN_LAST_SET_CODE_KEY,
  readAdminLastSetCode,
} from "./admin-prefs-storage";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_LAST_SET_CODE_KEY || e.key === null) onChange();
  };
  const onCustom = () => onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(ADMIN_LAST_SET_CHANGED_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ADMIN_LAST_SET_CHANGED_EVENT, onCustom);
  };
}

function getServerSnapshot() {
  return null as string | null;
}

export function useAdminLastEditedSet(
  sets: Doc<"sets">[] | undefined,
): { code: string; name: string; href: string } | null {
  const storedCode = useSyncExternalStore(
    subscribe,
    readAdminLastSetCode,
    getServerSnapshot,
  );

  return useMemo(() => {
    if (!sets || sets.length === 0) return null;
    if (storedCode) {
      const match = sets.find((s) => s.code === storedCode);
      if (match) {
        return {
          code: match.code,
          name: match.name,
          href: `/admin/sets/${encodeURIComponent(match.code)}`,
        };
      }
    }
    let best = sets[0]!;
    for (const s of sets) {
      if (s._creationTime > best._creationTime) best = s;
    }
    return {
      code: best.code,
      name: best.name,
      href: `/admin/sets/${encodeURIComponent(best.code)}`,
    };
  }, [sets, storedCode]);
}
