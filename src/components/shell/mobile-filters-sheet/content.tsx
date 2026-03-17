"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMobileFiltersSheetModel } from "./hook";
import { MobileFiltersButton } from "./button";
import type { MobileFiltersSheetProps } from "./types";

export function MobileFiltersSheet({
  children,
  title = "Filters",
  onApply,
  onClear,
  showClearButton = true,
}: MobileFiltersSheetProps) {
  const model = useMobileFiltersSheetModel(onApply, onClear);

  return (
    <>
      <MobileFiltersButton onClick={model.openSheet} />

      <Sheet open={model.isOpen} onOpenChange={model.setIsOpen}>
        <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0" showCloseButton={false}>
          <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-background p-4">
            <Button variant="outline" onClick={model.closeSheet}>
              Close
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {showClearButton ? (
                <Button variant="outline" onClick={model.handleClear}>
                  Clear All
                </Button>
              ) : null}
              <Button onClick={model.handleApply}>Apply Filters</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
