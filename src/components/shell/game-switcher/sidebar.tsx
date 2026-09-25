"use client";

import { ChevronsUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGameModule, useGameSwitcher } from "@/games/game-context";
import { cn } from "@/lib/utils";
import { useLeftSidebarContext } from "../left-sidebar/context";
import {
  SHELL_NAV_ITEM_BASE,
  SHELL_NAV_ITEM_IDLE,
  SHELL_RAIL_ITEM_COLLAPSED_CLASS,
  SHELL_RAIL_STACK_CLASS,
} from "../shell-chrome";
import { GameBadge } from "./game-badge";
import { GameSwitcherMenuContent } from "./menu-content";

/** Desktop sidebar game switcher (under the wordmark). Hidden where switching isn't possible. */
export function SidebarGameSwitcher() {
  const { collapsed } = useLeftSidebarContext();
  const gameModule = useGameModule();
  const model = useGameSwitcher();
  if (!model) return null;

  const label = `${gameModule.displayName} · Switch game`;
  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label={collapsed ? label : undefined}
        className={cn(
          SHELL_NAV_ITEM_BASE,
          SHELL_NAV_ITEM_IDLE,
          collapsed ? SHELL_RAIL_ITEM_COLLAPSED_CLASS : "w-full py-2"
        )}
      >
        <GameBadge shortName={gameModule.shortName} theme={gameModule.theme} />
        {!collapsed ? (
          <>
            <span className="chrome-label-case min-w-0 flex-1 truncate text-left text-xs">{gameModule.displayName}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/70" aria-hidden />
          </>
        ) : null}
      </button>
    </DropdownMenuTrigger>
  );

  return (
    <div className={collapsed ? SHELL_RAIL_STACK_CLASS : "px-2"}>
      <DropdownMenu>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right" className="chrome-label-case text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
        <GameSwitcherMenuContent model={model} />
      </DropdownMenu>
    </div>
  );
}
