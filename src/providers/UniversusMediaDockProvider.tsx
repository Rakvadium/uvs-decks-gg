"use client";

import type { ReactNode } from "react";
import { useGameFeatures } from "@/games/game-context";
import { UniversusMediaDockProviderInner } from "./universus-media-dock/context";
import { UniversusMediaDock } from "./universus-media-dock/dock";

/**
 * Curated media dock. Games without `features.communityMedia` get no provider, so the dock and its
 * shell toggles (`useUniversusMediaDockOptional()` → `null`) don't render or query anything.
 */
export function UniversusMediaDockProvider({ children }: { children: ReactNode }) {
  const { communityMedia } = useGameFeatures();
  if (!communityMedia) return children;
  return (
    <UniversusMediaDockProviderInner>
      {children}
      <UniversusMediaDock />
    </UniversusMediaDockProviderInner>
  );
}

export { useUniversusMediaDock, useUniversusMediaDockOptional } from "./universus-media-dock/context";
export type { UniversusDockPlayback, UniversusDockPanelState, UniversusDockPosition } from "./universus-media-dock/context";
