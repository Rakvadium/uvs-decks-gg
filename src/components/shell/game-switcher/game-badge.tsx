import type { CSSProperties } from "react";
import { getSharedGameModule } from "@shared/games/registry";
import type { GameId } from "@shared/games/types";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "size-7 rounded-md p-1",
  lg: "size-14 rounded-lg p-2",
} as const;

/** Ink-dark tile: keeps light brand marks (Cyberpunk yellow) legible on light themes too. */
const TILE_BACKGROUND = "oklch(0.17 0.025 268)";

/** The game's logo in its theme color on a dark tile. Decorative: pair it with the game name. */
export function GameBadge({
  game,
  size = "sm",
  className,
}: {
  game: GameId;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const { theme, markSrc } = getSharedGameModule(game);
  const tile: CSSProperties = {
    backgroundColor: TILE_BACKGROUND,
    borderColor: `hsl(${theme.primary} / 0.4)`,
  };
  // Prefixed copies: Safari scales an unprefixed-only mask to the box, distorting the mark.
  const logo: CSSProperties = {
    backgroundColor: `hsl(${theme.primary})`,
    maskImage: `url(${markSrc})`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskImage: `url(${markSrc})`,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
  };
  return (
    <span
      aria-hidden
      style={tile}
      className={cn("inline-flex shrink-0 items-center justify-center border", SIZE_CLASS[size], className)}
    >
      <span style={logo} className="size-full" />
    </span>
  );
}
