"use client";

import { useEffect } from "react";
import { UNIVERSUS_CONFIG } from "@/config/universus";

export function ThemeInjector() {
  useEffect(() => {
    const root = document.documentElement;
    const theme = UNIVERSUS_CONFIG.theme;

    root.style.setProperty("--game-primary", theme.primary);
    root.style.setProperty("--game-secondary", theme.secondary);
    root.style.setProperty("--game-accent", theme.accent);

    return () => {
      root.style.removeProperty("--game-primary");
      root.style.removeProperty("--game-secondary");
      root.style.removeProperty("--game-accent");
    };
  }, []);

  return null;
}
