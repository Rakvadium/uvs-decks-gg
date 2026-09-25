"use client";

import { useEffect } from "react";
import { useGameModule } from "@/games/game-context";

export function ThemeInjector() {
  const theme = useGameModule().theme;

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--game-primary", theme.primary);
    root.style.setProperty("--game-secondary", theme.secondary);
    root.style.setProperty("--game-accent", theme.accent);

    return () => {
      root.style.removeProperty("--game-primary");
      root.style.removeProperty("--game-secondary");
      root.style.removeProperty("--game-accent");
    };
  }, [theme]);

  return null;
}
