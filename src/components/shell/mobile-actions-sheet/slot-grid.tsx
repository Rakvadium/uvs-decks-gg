import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileActionsSheetContext } from "./context";

const SLOT_DESCRIPTIONS: Record<string, string> = {
  "active-deck": "Adjust your current build and section counts.",
  decks: "Browse your deck library and switch active deck.",
};

export function MobileActionsSlotGrid() {
  const { sidebarSlots, selectSlot } = useMobileActionsSheetContext();

  return (
    <div className="p-4">
      <div className="mb-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Side Panels</p>
      </div>

      <div className="space-y-3">
        {sidebarSlots.map((slot) => {
          const Icon = slot.icon;
          const label = slot.label ?? slot.id;
          const description = SLOT_DESCRIPTIONS[slot.id] ?? "Open panel";

          return (
            <button
              key={slot.id}
              onClick={() => selectSlot(slot.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3 text-card-foreground transition-all",
                "hover:border-primary/40 hover:bg-primary/10"
              )}
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-primary/30 bg-primary/10 text-primary shadow-[0_0_14px_-8px_var(--primary)]">
                {Icon ? (
                  <span className="flex h-full w-full items-center justify-center">
                    <Icon className={cn("h-full w-full", slot.id === "active-deck" ? "" : "p-1.5")} />
                  </span>
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-semibold">
                    {label.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-display text-sm font-semibold uppercase tracking-wide">{label}</p>
                <p className="line-clamp-2 text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                  {description}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
