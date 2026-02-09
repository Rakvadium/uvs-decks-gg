import { ChevronRight } from "lucide-react";
import { useDeckGridItemContext } from "../context";

export function DeckGridItemMeta() {
  const {
    deck: { description, format, name, subFormat },
    startingCharacterName,
  } = useDeckGridItemContext();

  return (
    <>
      <div className="mb-1 flex items-start justify-between gap-1.5 sm:mb-1.5 sm:gap-2">
        <h3 className="truncate font-display text-sm font-bold uppercase tracking-wide transition-colors group-hover:text-primary sm:text-base">
          {name}
        </h3>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      {format ? (
        <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2">
          <div className="h-1 w-1 rounded-full bg-primary shadow-[0_0_4px_var(--primary)]" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary/80 sm:text-[11px]">
            {format}
            {subFormat ? <span className="text-muted-foreground"> / {subFormat}</span> : null}
          </span>
        </div>
      ) : null}

      {description ? (
        <p className="mb-auto line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-[12px]">
          {description}
        </p>
      ) : startingCharacterName ? (
        <div className="mb-auto flex items-center gap-1.5">
          <div className="h-3 w-0.5 rounded-full bg-secondary/60" />
          <span className="truncate font-mono text-[10px] text-muted-foreground sm:text-[11px]">
            {startingCharacterName}
          </span>
        </div>
      ) : (
        <div className="mb-auto" />
      )}
    </>
  );
}
