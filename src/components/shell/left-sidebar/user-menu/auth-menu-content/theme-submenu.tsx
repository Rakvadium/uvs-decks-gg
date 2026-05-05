"use client";

import Link from "next/link";
import { Check, Moon, Palette, Sun } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { COLOR_SCHEMES } from "@/lib/theme";
import type { ColorPresetChoice } from "@/lib/theme/appearance-types";
import { useLeftSidebarContext } from "../../context";
import { MENU_ITEM_CLASS } from "./constants";

export function LeftSidebarThemeControls() {
  const { colorPreset, isCustomAppearance, isDark, applyColorPreset, toggleTheme } =
    useLeftSidebarContext();

  return (
    <>
      <DropdownMenuItem onClick={toggleTheme} className={MENU_ITEM_CLASS}>
        {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
        {isDark ? "Light Mode" : "Dark Mode"}
      </DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger className={MENU_ITEM_CLASS}>
          <Palette className="mr-2 h-4 w-4" />
          Color preset
          {isCustomAppearance ? (
            <span className="ml-auto text-xs text-muted-foreground">Custom</span>
          ) : null}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-[12rem]">
          {COLOR_SCHEMES.map((scheme) => {
            const picked = !isCustomAppearance && scheme.value === colorPreset;
            return (
              <DropdownMenuItem
                key={scheme.value}
                className={MENU_ITEM_CLASS}
                onClick={() => applyColorPreset(scheme.value as ColorPresetChoice)}
              >
                <span>{scheme.label}</span>
                {picked ? (
                  <Check className="ml-auto h-3.5 w-3.5 text-primary" aria-hidden />
                ) : (
                  <span className="ml-auto w-3.5" aria-hidden />
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className={MENU_ITEM_CLASS}>
            <Link href="/settings#appearance">Custom colors…</Link>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}
