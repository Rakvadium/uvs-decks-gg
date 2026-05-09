"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type UniversusDockPlayback =
  | { kind: "youtube-vod"; videoId: string; title: string }
  | { kind: "youtube-live"; videoId: string; title: string }
  | { kind: "twitch-live"; channelLogin: string; title: string };

export type UniversusDockPanelState = "closed" | "open" | "minimized";

export type UniversusDockPosition = { x: number; y: number };

type UniversusMediaDockContextValue = {
  panelState: UniversusDockPanelState;
  playback: UniversusDockPlayback | null;
  setPlayback: (value: UniversusDockPlayback | null) => void;
  dockPosition: UniversusDockPosition | null;
  setDockPosition: (value: UniversusDockPosition | null) => void;
  openExpanded: () => void;
  minimize: () => void;
  close: () => void;
  toggleLauncher: () => void;
};

const UniversusMediaDockContext = createContext<UniversusMediaDockContextValue | null>(null);

export function UniversusMediaDockProviderInner({ children }: { children: ReactNode }) {
  const [panelState, setPanelState] = useState<UniversusDockPanelState>("closed");
  const [playback, setPlaybackState] = useState<UniversusDockPlayback | null>(null);
  const [dockPosition, setDockPositionState] = useState<UniversusDockPosition | null>(null);

  const setPlayback = useCallback((value: UniversusDockPlayback | null) => {
    setPlaybackState(value);
  }, []);

  const setDockPosition = useCallback((value: UniversusDockPosition | null) => {
    setDockPositionState(value);
  }, []);

  const openExpanded = useCallback(() => {
    setPanelState("open");
  }, []);

  const minimize = useCallback(() => {
    setPanelState("minimized");
  }, []);

  const close = useCallback(() => {
    setPanelState("closed");
  }, []);

  const toggleLauncher = useCallback(() => {
    setPanelState((prev) => {
      if (prev === "closed") return "open";
      if (prev === "minimized") return "open";
      return "closed";
    });
  }, []);

  const value = useMemo(
    (): UniversusMediaDockContextValue => ({
      panelState,
      playback,
      setPlayback,
      dockPosition,
      setDockPosition,
      openExpanded,
      minimize,
      close,
      toggleLauncher,
    }),
    [panelState, playback, setPlayback, dockPosition, setDockPosition, openExpanded, minimize, close, toggleLauncher]
  );

  return <UniversusMediaDockContext.Provider value={value}>{children}</UniversusMediaDockContext.Provider>;
}

export function useUniversusMediaDock() {
  const ctx = useContext(UniversusMediaDockContext);
  if (!ctx) {
    throw new Error("useUniversusMediaDock must be used within UniversusMediaDockProvider");
  }
  return ctx;
}

export function useUniversusMediaDockOptional() {
  return useContext(UniversusMediaDockContext);
}
