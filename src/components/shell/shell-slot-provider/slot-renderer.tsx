"use client";

import { useShellSlots } from "./context";
import type { SlotArea } from "./types";

export function SlotRenderer({ area }: { area: SlotArea }) {
  const slots = useShellSlots();
  const areaSlots = slots.get(area) ?? [];

  return (
    <>
      {areaSlots.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </>
  );
}
