"use client";

import Link from "next/link";
import { Check, LayoutGrid } from "lucide-react";
import { getSharedGameModule } from "@shared/games/registry";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { GameSwitcherModel } from "@/games/game-links";
import { GameBadge } from "./game-badge";

/** Game list + "All games" (apex picker). Current game links host-relative; others are cross-host. */
export function GameSwitcherMenuContent({ model }: { model: GameSwitcherModel }) {
  return (
    <DropdownMenuContent className="min-w-56 rounded-lg" side="right" align="start" sideOffset={4}>
      <DropdownMenuLabel>Games</DropdownMenuLabel>
      {model.games.map((game) => {
        const content = (
          <>
            <GameBadge shortName={game.shortName} theme={getSharedGameModule(game.id).theme} />
            <span className="flex-1">{game.displayName}</span>
            {game.current ? <Check className="text-primary" aria-hidden /> : null}
          </>
        );
        return (
          <DropdownMenuItem key={game.id} asChild>
            {game.current ? (
              <Link href={game.href} aria-current="true">
                {content}
              </Link>
            ) : (
              <a href={game.href}>{content}</a>
            )}
          </DropdownMenuItem>
        );
      })}
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <a href={model.allGamesHref}>
          <LayoutGrid aria-hidden />
          All games
        </a>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
