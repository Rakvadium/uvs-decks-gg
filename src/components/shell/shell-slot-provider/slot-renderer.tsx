"use client";

import { useShellSlot } from "./context";
import type { SlotArea } from "./types";

export function SlotRenderer({ area }: { area: SlotArea }) {
  const { state } = useShellSlot();
  const areaSlots = state.slots.get(area) ?? [];

  return (
    <>
      {areaSlots.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </>
  );
}
