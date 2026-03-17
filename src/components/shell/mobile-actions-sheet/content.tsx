import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useMobileActionsSheetContext } from "./context";
import { MobileActionsSlotGrid } from "./slot-grid";

export function MobileActionsSheetContent() {
  const { ActiveComponent, ActiveFooter, closeSheet } = useMobileActionsSheetContext();

  if (!ActiveComponent) {
    return (
      <>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MobileActionsSlotGrid />
        </div>
        <div className="shrink-0 px-4 pt-2">
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={closeSheet}
              aria-label="Close panel"
            >
              <ChevronDown className="size-5" />
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ActiveComponent />
      </div>
      <div className="shrink-0 border-t bg-background px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {ActiveFooter ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ActiveFooter />
            </div>
          ) : null}
          <Button
            variant="outline"
            size="icon"
            onClick={closeSheet}
            aria-label="Close panel"
          >
            <ChevronDown className="size-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
