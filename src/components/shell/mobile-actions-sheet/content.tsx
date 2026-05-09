import type { PointerEvent as ReactPointerEvent } from "react";
import { ChevronDown } from "lucide-react";
import { useMobileActionsSheetContext } from "./context";
import { MobileActionsSheetHeader } from "./header";
import { MobileActionsSlotGrid } from "./slot-grid";

const mobileSheetCollapseButtonClassName =
  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--control-dual-border)] bg-background/60 text-muted-foreground transition-colors hover:border-[color:var(--control-dual-border-strong)] hover:bg-[color:var(--control-dual-surface-hover)] hover:text-primary";

export interface MobileActionsSheetActionPanelProps {
  onHeaderPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onHeaderPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onHeaderPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onHeaderPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}

export function MobileActionsSheetActionPanel({
  onHeaderPointerDown,
  onHeaderPointerMove,
  onHeaderPointerUp,
  onHeaderPointerCancel,
}: MobileActionsSheetActionPanelProps) {
  const { ActiveComponent, ActiveFooter, closeSheet } = useMobileActionsSheetContext();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background/96 backdrop-blur-md">
        <div
          className="touch-none shrink-0"
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerCancel}
        >
          <MobileActionsSheetHeader />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {ActiveComponent ? <ActiveComponent /> : <MobileActionsSlotGrid />}
        </div>
      </div>
      {ActiveComponent ? (
        <div className="shrink-0 border-t border-border/35 bg-transparent px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {ActiveFooter ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <ActiveFooter />
              </div>
            ) : null}
            <button
              type="button"
              className={mobileSheetCollapseButtonClassName}
              onClick={closeSheet}
              aria-label="Close panel"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-transparent px-4 pt-2">
          <div className="flex items-center justify-end">
            <button
              type="button"
              className={mobileSheetCollapseButtonClassName}
              onClick={closeSheet}
              aria-label="Close panel"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
