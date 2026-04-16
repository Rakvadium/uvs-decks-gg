import { cn } from "@/lib/utils";
import { useCardGridItemContext } from "./context";

export function CardDeckCountBadge() {
  const { isHovered, showDeckCount, deckCount } = useCardGridItemContext();

  if (!showDeckCount) return null;

  return (
    <div
      className={cn(
        "absolute right-1.5 top-1.5 z-10 transition-all duration-200",
        isHovered ? "scale-100 opacity-100" : "scale-95 opacity-85"
      )}
    >
      <div className="flex h-7 min-w-7 items-center justify-center rounded border border-primary bg-primary/90 px-2.5 text-sm font-mono font-bold text-primary-foreground shadow-[var(--chrome-badge-default-shadow)]">
        {deckCount}
      </div>
    </div>
  );
}
