"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { useGameId } from "@/games/game-context";
import {
  ADMIN_LAST_SET_CHANGED_EVENT,
  adminLastSetCodeKey,
  readAdminLastSetCode,
} from "./admin-prefs-storage";

function getServerSnapshot() {
  return null as string | null;
}

export function useAdminLastEditedSet(
  sets: Doc<"sets">[] | undefined,
): { code: string; name: string; href: string } | null {
  const game = useGameId();
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const key = adminLastSetCodeKey(game);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) onChange();
      };
      const onCustom = () => onChange();
      window.addEventListener("storage", onStorage);
      window.addEventListener(ADMIN_LAST_SET_CHANGED_EVENT, onCustom);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(ADMIN_LAST_SET_CHANGED_EVENT, onCustom);
      };
    },
    [game],
  );
  const getSnapshot = useCallback(() => readAdminLastSetCode(game), [game]);
  const storedCode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
