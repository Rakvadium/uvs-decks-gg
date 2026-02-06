import { useMobileActionsSheetContext } from "./context";

export function MobileActionsSlotGrid() {
  const { sidebarSlots, selectSlot } = useMobileActionsSheetContext();

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {sidebarSlots.map((slot) => {
          const Icon = slot.icon;
          const label = slot.label ?? slot.id;

          return (
            <button
              key={slot.id}
              onClick={() => selectSlot(slot.id)}
              className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {Icon ? (
                  <Icon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{label.slice(0, 1)}</span>
                )}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
