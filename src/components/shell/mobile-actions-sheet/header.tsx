import { ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMobileActionsSheetContext } from "./context";

export function MobileActionsSheetHeader() {
  const { activeSlot, ActiveHeader, handleBack, closeSheet } = useMobileActionsSheetContext();

  return (
    <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
      <div className="min-w-0 flex flex-1 items-center gap-2">
        {activeSlot ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : null}

        {ActiveHeader ? (
          <ActiveHeader />
        ) : (
          <SheetTitle className="text-left">
            {activeSlot ? (activeSlot.label ?? activeSlot.id) : "Actions"}
          </SheetTitle>
        )}
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={closeSheet}>
        <X className="h-4 w-4" />
      </Button>
    </SheetHeader>
  );
}
