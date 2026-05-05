"use client";

import { useLayoutEffect, useEffectEvent, type ComponentType } from "react";
import { useShellSlotActions } from "./context";
import type { SlotArea, SlotRegistration, SlotRegistrationOptions } from "./types";

function toRegistration(
  id: string,
  component: ComponentType,
  options: number | SlotRegistrationOptions | undefined
): SlotRegistration {
  if (typeof options === "number" || options === undefined) {
    return { id, component, priority: options };
  }
  return { id, component, ...options };
}

export function useRegisterSlot(
  area: SlotArea,
  id: string,
  Component: ComponentType,
  options?: number | SlotRegistrationOptions
) {
  const actions = useShellSlotActions();

  const commitRegistration = useEffectEvent(() => {
    actions.registerSlot(area, toRegistration(id, Component, options));
  });

  useLayoutEffect(() => {
    return () => {
      actions.unregisterSlot(area, id);
    };
  }, [actions, area, id]);

  useLayoutEffect(() => {
    commitRegistration();
  }, [area, id, Component, options, actions]);
}
