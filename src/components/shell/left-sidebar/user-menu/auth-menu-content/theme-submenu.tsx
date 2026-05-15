"use client";

import Link from "next/link";
import { Check, Layers, Moon, Palette, Sun } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { CHROME_OPTIONS, COLOR_SCHEMES, useColorScheme } from "@/lib/theme";
import type { ColorPresetChoice } from "@/lib/theme/appearance-types";
import { useLeftSidebarContext } from "../../context";
import { MENU_ITEM_CLASS } from "./constants";

export function LeftSidebarThemeControls() {
  const { colorPreset, isCustomAppearance, isDark, applyColorPreset, toggleTheme } =
    useLeftSidebarContext();
  const { chrome, setChrome } = useColorScheme();
  const chromeLabel = CHROME_OPTIONS.find((o) => o.id === chrome)?.label ?? chrome;

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

      <DropdownMenuSub>
        <DropdownMenuSubTrigger className={MENU_ITEM_CLASS}>
          <Layers className="mr-2 h-4 w-4" />
          Chrome
          <span className="ml-auto max-w-[5.5rem] truncate text-xs text-muted-foreground">
            {chromeLabel}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-[14rem]">
          {CHROME_OPTIONS.map((opt) => {
            const picked = opt.id === chrome;
            return (
              <DropdownMenuItem
                key={opt.id}
                className={MENU_ITEM_CLASS}
                onClick={() => setChrome(opt.id)}
              >
                <span>{opt.label}</span>
                {picked ? (
                  <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <span className="ml-auto w-3.5 shrink-0" aria-hidden />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}
