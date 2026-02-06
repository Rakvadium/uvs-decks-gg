"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MobileActionsSheetContent } from "./content";
import { MobileActionsSheetProvider, useMobileActionsSheetContext } from "./context";
import { MobileActionsSheetHeader } from "./header";

function MobileActionsSheetView() {
  const { isActionsSheetOpen, sidebarSlots, handleOpenChange } = useMobileActionsSheetContext();

  if (sidebarSlots.length === 0) {
    return null;
  }

  return (
    <Sheet open={isActionsSheetOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="!h-auto !max-h-[100dvh] overflow-hidden p-0" showCloseButton={false}>
        <div className="flex h-full flex-col overflow-hidden">
          <MobileActionsSheetHeader />
          <MobileActionsSheetContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileActionsSheet() {
  return (
    <MobileActionsSheetProvider>
      <MobileActionsSheetView />
    </MobileActionsSheetProvider>
  );
}
