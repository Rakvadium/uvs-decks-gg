"use client";

import Link from "next/link";
import { Check, ChevronRight, LayoutGrid } from "lucide-react";
import { getSharedGameModule } from "@shared/games/registry";
import { useGameSwitcher } from "@/games/game-context";
import { cn } from "@/lib/utils";
import { MOBILE_INSET_DIVIDER, MOBILE_INSET_GROUP, MOBILE_INSET_ROW } from "../mobile-glass";
import { MobileProfileSectionLabel } from "../mobile-profile-sheet/section-label";
import { GameBadge } from "./game-badge";

/** Mobile profile sheet "Game" section. Hidden where switching isn't possible. */
export function ProfileSheetGameSection({ onNavigate }: { onNavigate: () => void }) {
  const model = useGameSwitcher();
  if (!model) return null;

  return (
    <section>
      <MobileProfileSectionLabel>Game</MobileProfileSectionLabel>
      <div className={cn(MOBILE_INSET_GROUP, MOBILE_INSET_DIVIDER)}>
        {model.games.map((game) => {
          const content = (
            <>
              <GameBadge shortName={game.shortName} theme={getSharedGameModule(game.id).theme} />
              <span className="flex-1 font-medium">{game.displayName}</span>
              {game.current ? (
                <Check className="size-4 text-primary" aria-hidden />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden />
              )}
            </>
          );
          return game.current ? (
            <Link key={game.id} href={game.href} onClick={onNavigate} aria-current="true" className={MOBILE_INSET_ROW}>
              {content}
            </Link>
          ) : (
            <a key={game.id} href={game.href} className={MOBILE_INSET_ROW}>
              {content}
            </a>
          );
        })}
        <a href={model.allGamesHref} className={MOBILE_INSET_ROW}>
          <LayoutGrid className="size-5 text-muted-foreground" aria-hidden />
          <span className="flex-1 font-medium">All games</span>
          <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden />
        </a>
      </div>
    </section>
  );
}
