"use client";

import { useEffect, type ComponentType } from "react";
import { useShellSlot } from "./context";
import type { SlotArea, SlotRegistrationOptions } from "./types";

export function useRegisterSlot(
  area: SlotArea,
  id: string,
  Component: ComponentType,
  options?: number | SlotRegistrationOptions
) {
  const { actions } = useShellSlot();

  useEffect(() => {
    const registration =
      typeof options === "number" || options === undefined
        ? { id, component: Component, priority: options }
        : { id, component: Component, ...options };

    actions.registerSlot(area, registration);
    return () => actions.unregisterSlot(area, id);
  }, [area, id, Component, options, actions]);
}
