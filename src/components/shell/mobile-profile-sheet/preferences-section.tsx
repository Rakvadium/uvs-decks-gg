"use client";

import Link from "next/link";
import { COLOR_SCHEMES } from "@/lib/theme";
import type { ColorPresetChoice } from "@/lib/theme/appearance-types";
import { cn } from "@/lib/utils";
import { Moon, Palette, Settings, Sun } from "lucide-react";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfilePreferencesSection() {
  const {
    isDark,
    colorPreset,
    isCustomAppearance,
    applyColorPreset,
    handleToggleTheme,
    handleSettingsClick,
    closeSheet,
  } = useMobileProfileSheetContext();

  return (
    <div className="p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Preferences
      </p>
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </button>

        <div className="space-y-2 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-3 text-sm font-medium text-foreground">
            <Palette className="h-5 w-5" />
            <span>Color preset</span>
            {isCustomAppearance ? (
              <span className="text-xs font-normal text-muted-foreground">Custom palette</span>
            ) : null}
          </div>
          <div className="ml-8 flex flex-wrap gap-2">
            <Link
              href="/settings#appearance"
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/80",
                isCustomAppearance ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted",
              )}
              onClick={closeSheet}
            >
              Custom
            </Link>
            {COLOR_SCHEMES.map((scheme) => (
              <button
                type="button"
                key={scheme.value}
                onClick={() => applyColorPreset(scheme.value as ColorPresetChoice)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  !isCustomAppearance && colorPreset === scheme.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80",
                )}
              >
                {scheme.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSettingsClick}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
