"use client";

import { useSyncExternalStore } from "react";
import { mobileViewportStore } from "@/hooks/useIsMobile";

export type ShellFrame = "mobile" | "desktop";

export const SHELL_SERVER_RENDER_ERROR =
  "The (app) shell picks its desktop or mobile frame from matchMedia, so it must only render on " +
  "the client after hydration. AuthGuard guarantees that today by rendering a skeleton on the " +
  "server and on the first client render. If the shell now renders on the server, the frame " +
  "needs a server-safe choice first (a CSS-only first paint or a viewport hint).";

function getFrameSnapshot(): ShellFrame {
  return mobileViewportStore.getSnapshot() ? "mobile" : "desktop";
}

// React calls this only during SSR and hydration. A guessed frame there would paint the wrong
// layout on phones until hydration swapped it, so fail loudly instead.
function getServerFrameSnapshot(): never {
  throw new Error(SHELL_SERVER_RENDER_ERROR);
}

export function useShellFrame(): ShellFrame {
  return useSyncExternalStore(mobileViewportStore.subscribe, getFrameSnapshot, getServerFrameSnapshot);
}
