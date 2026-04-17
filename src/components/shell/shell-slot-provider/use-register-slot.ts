"use client";

import { createElement, useEffect, useRef, type ComponentType } from "react";
import { useShellSlotActions } from "./context";
import type { SlotArea, SlotRegistrationOptions } from "./types";

export function useRegisterSlot(
  area: SlotArea,
  id: string,
  Component: ComponentType,
  options?: number | SlotRegistrationOptions
) {
  const actions = useShellSlotActions();
  const componentRef = useRef(Component);
  const optionsRef = useRef(options);

  componentRef.current = Component;
  optionsRef.current = options;

  const stableRef = useRef<ComponentType | null>(null);
  if (!stableRef.current) {
    stableRef.current = function StableSlot() {
      return createElement(componentRef.current);
    };
  }

  useEffect(() => {
    const opts = optionsRef.current;
    const registration =
      typeof opts === "number" || opts === undefined
        ? { id, component: stableRef.current!, priority: opts }
        : { id, component: stableRef.current!, ...opts };

    actions.registerSlot(area, registration);
    return () => actions.unregisterSlot(area, id);
  }, [area, id, actions]);
}
