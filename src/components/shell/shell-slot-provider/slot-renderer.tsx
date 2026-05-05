"use client";

import { useShellSlotSlots } from "./context";
import type { SlotArea } from "./types";

export function SlotRenderer({ area }: { area: SlotArea }) {
  const slots = useShellSlotSlots();
  const areaSlots = slots.get(area) ?? [];

  return (
    <>
      {areaSlots.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </>
  );
}
