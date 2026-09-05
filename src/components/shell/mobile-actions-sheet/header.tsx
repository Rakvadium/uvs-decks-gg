import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { MOBILE_SHEET_GRABBER } from "../mobile-glass";
import { useMobileActionsSheetContext } from "./context";

type MobileActionsSheetHeaderProps = HTMLAttributes<HTMLDivElement>;

const headerButtonClassName =
  "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-2 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MobileActionsSheetHeader({ className, ...props }: MobileActionsSheetHeaderProps) {
  const { activeSlot, ActiveHeader, closeSheet } = useMobileActionsSheetContext();

  return (
    <div className={cn("flex shrink-0 flex-col", className)} {...props}>
      <div className="flex justify-center pb-1 pt-2">
        <span aria-hidden className={MOBILE_SHEET_GRABBER} />
      </div>
      <div className="grid h-11 grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center border-b border-border/30 px-2">
        <div />
        <div className="flex min-w-0 items-center justify-center">
          {ActiveHeader ? (
            <ActiveHeader />
          ) : (
            <h2 className="chrome-heading-case min-w-0 truncate text-[15px] font-semibold text-foreground">
              {activeSlot ? (activeSlot.label ?? activeSlot.id) : "Page details"}
            </h2>
          )}
        </div>
        <div className="flex items-center justify-end">
          <button type="button" className={headerButtonClassName} onClick={closeSheet}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
