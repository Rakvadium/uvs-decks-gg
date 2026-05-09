"use client";

import type { ReactNode } from "react";
import { UniversusMediaDockProviderInner } from "./universus-media-dock/context";
import { UniversusMediaDock } from "./universus-media-dock/dock";

export function UniversusMediaDockProvider({ children }: { children: ReactNode }) {
  return (
    <UniversusMediaDockProviderInner>
      {children}
      <UniversusMediaDock />
    </UniversusMediaDockProviderInner>
  );
}

export { useUniversusMediaDock, useUniversusMediaDockOptional } from "./universus-media-dock/context";
export type { UniversusDockPlayback, UniversusDockPanelState, UniversusDockPosition } from "./universus-media-dock/context";
