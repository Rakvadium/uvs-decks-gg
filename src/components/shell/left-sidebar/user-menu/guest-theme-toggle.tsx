"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useColorScheme } from "@/lib/theme";
import type { ThemePreference } from "@/lib/theme/appearance-types";
import { cn } from "@/lib/utils";
import { useLeftSidebarContext } from "../context";

const OPTIONS: readonly {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

export function LeftSidebarGuestThemeToggle() {
  const { collapsed } = useLeftSidebarContext();
  const { theme, setTheme, resolvedTheme, toggleThemeLightDark } = useColorScheme();

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "h-10 w-10 shrink-0 border-border/70 bg-background",
            )}
            aria-label={
              resolvedTheme === "dark"
                ? "Switch to light appearance"
                : "Switch to dark appearance"
            }
            onClick={toggleThemeLightDark}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Toggle light / dark
          {theme === "system" ? " (currently following system)" : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Appearance while signed out"
      className="flex w-full items-center rounded-lg border border-border/70 bg-muted/25 p-0.5 gap-0.5"
    >
      {OPTIONS.map(({ value: v, label, icon: Icon }) => (
        <Button
          key={v}
          type="button"
          role="radio"
          aria-checked={theme === v}
          variant={theme === v ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "h-9 flex-1 gap-1 px-1 font-mono text-[10px] uppercase tracking-wider",
            theme === v && "shadow-sm",
          )}
          onClick={() => setTheme(v)}
          title={v === "system" ? "Match system appearance" : `${label} mode`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </Button>
      ))}
    </div>
  );
}
