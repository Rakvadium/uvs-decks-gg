"use client";

import { useCallback, useMemo, useState } from "react";
import { getInitialSidebarWidth } from "./storage";
import {
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_KEY,
  type ShellSlotActions,
  type ShellSlotContextValue,
  type SlotArea,
  type SlotRegistration,
} from "./types";

export function useShellSlotModel(): ShellSlotContextValue {
  const [slots, setSlots] = useState<Map<SlotArea, SlotRegistration[]>>(() => new Map());
  const [activeSidebarActionId, setActiveSidebarActionIdState] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidthState] = useState<number>(() => getInitialSidebarWidth());

  const registerSlot = useCallback((area: SlotArea, registration: SlotRegistration) => {
    setSlots((prev) => {
      const next = new Map(prev);
      const areaSlots = next.get(area) ?? [];
      const filtered = areaSlots.filter((slot) => slot.id !== registration.id);
      const updated = [...filtered, registration].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

      next.set(area, updated);
      return next;
    });
  }, []);

  const unregisterSlot = useCallback((area: SlotArea, id: string) => {
    setSlots((prev) => {
      const next = new Map(prev);
      const areaSlots = next.get(area) ?? [];

      next.set(
        area,
        areaSlots.filter((slot) => slot.id !== id)
      );
      return next;
    });
  }, []);

  const setActiveSidebarAction = useCallback((id: string | null) => {
    setActiveSidebarActionIdState(id);
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width));
    setSidebarWidthState(clampedWidth);

    if (typeof window !== "undefined") {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clampedWidth));
    }
  }, []);

  const actions = useMemo(
    (): ShellSlotActions => ({
      registerSlot,
      unregisterSlot,
      setActiveSidebarAction,
      setSidebarWidth,
    }),
    [registerSlot, unregisterSlot, setActiveSidebarAction, setSidebarWidth]
  );

  return useMemo(
    (): ShellSlotContextValue => ({
      state: {
        slots,
        activeSidebarActionId,
        sidebarWidth,
      },
      actions,
    }),
    [slots, activeSidebarActionId, sidebarWidth, actions]
  );
}
