import type { CSSProperties } from "react";
import type { GameThemeColors } from "@shared/games/types";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "h-5 min-w-5 rounded-md px-1 text-[10px]",
  lg: "size-12 rounded-lg text-sm",
} as const;

/** Game short name on the game's own theme color (`/20` fill, `/40` border ladder steps). */
export function GameBadge({
  shortName,
  theme,
  size = "sm",
  className,
}: {
  shortName: string;
  theme: GameThemeColors;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const style: CSSProperties = {
    backgroundColor: `hsl(${theme.primary} / 0.2)`,
    borderColor: `hsl(${theme.primary} / 0.4)`,
    color: `hsl(${theme.primary})`,
  };
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "inline-flex shrink-0 items-center justify-center border font-bold leading-none normal-case tracking-normal",
        SIZE_CLASS[size],
        className,
      )}
    >
      {shortName}
    </span>
  );
}
