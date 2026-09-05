import { cn } from "@/lib/utils";
import { useMobileActionsSheetContext } from "./context";

const switcherItemClassName =
  "group flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-95 motion-safe:transition-[color,background-color,transform]";

export function MobileActionsSheetFooter() {
  const { sidebarSlots, activeSlot, ActiveFooter, selectSlot } = useMobileActionsSheetContext();
  const showSwitcher = sidebarSlots.length > 1;

  if (!showSwitcher && !ActiveFooter) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-border/30 px-3 pb-2 pt-2">
      {showSwitcher ? (
        <div role="tablist" aria-label="Panels" className="flex min-w-0 flex-1 items-stretch gap-1">
          {sidebarSlots.map((slot) => {
            const Icon = slot.icon;
            const label = slot.tabLabel ?? slot.label ?? slot.id;
            const isActive = slot.id === activeSlot?.id;
            const isMedia = slot.iconFit === "media";

            return (
              <button
                key={slot.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={label}
                onClick={() => selectSlot(slot.id)}
                className={cn(switcherItemClassName, isActive && "bg-primary/15 text-primary")}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center",
                    isMedia && "overflow-hidden rounded-full",
                    isMedia && isActive && "ring-2 ring-primary/60",
                    "motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-active:scale-90"
                  )}
                >
                  {Icon ? (
                    <Icon className={isMedia ? "size-full" : "size-5"} />
                  ) : (
                    <span className="text-xs font-semibold">{label.slice(0, 1)}</span>
                  )}
                </span>
                <span className="w-full truncate text-center text-[10px] font-medium leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {ActiveFooter ? (
        <div className={cn("flex shrink-0 items-center justify-end gap-2", !showSwitcher && "ml-auto")}>
          <ActiveFooter />
        </div>
      ) : null}
    </div>
  );
}
