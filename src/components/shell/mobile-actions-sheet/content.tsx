import type { PointerEvent as ReactPointerEvent } from "react";
import { useMobileActionsSheetContext } from "./context";
import { MobileActionsSheetFooter } from "./footer";
import { MobileActionsSheetHeader } from "./header";

export interface MobileActionsSheetActionPanelProps {
  onGrabberPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onGrabberPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onGrabberPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onGrabberPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}

export function MobileActionsSheetActionPanel({
  onGrabberPointerDown,
  onGrabberPointerMove,
  onGrabberPointerUp,
  onGrabberPointerCancel,
}: MobileActionsSheetActionPanelProps) {
  const { activeSlot, ActiveComponent } = useMobileActionsSheetContext();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        className="touch-none shrink-0"
        onPointerDown={onGrabberPointerDown}
        onPointerMove={onGrabberPointerMove}
        onPointerUp={onGrabberPointerUp}
        onPointerCancel={onGrabberPointerCancel}
      >
        <MobileActionsSheetHeader />
      </div>
      <div key={activeSlot?.id} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
      <MobileActionsSheetFooter />
    </div>
  );
}
