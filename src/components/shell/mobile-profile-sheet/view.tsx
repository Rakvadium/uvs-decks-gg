"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MOBILE_SHEET_GRABBER, MOBILE_SHEET_PANEL } from "../mobile-glass";
import { MobileProfileAdminSection } from "./admin-section";
import { MobileProfileSheetProvider, useMobileProfileSheetContext } from "./context";
import { MobileProfileSheetFooter } from "./footer";
import { MobileProfileSheetHeader } from "./header";
import { MobileProfileNavigationSection } from "./navigation-section";
import { MobileProfilePreferencesSection } from "./preferences-section";
import { useGrabberDismiss } from "./use-grabber-dismiss";

function MobileProfileSheetContent() {
  const { isProfileSheetOpen, setProfileSheetOpen, closeSheet, isAdmin, user } = useMobileProfileSheetContext();
  const { panelRef, resetTranslate, grabberProps } = useGrabberDismiss(closeSheet);

  return (
    <Sheet
      open={isProfileSheetOpen}
      onOpenChange={(open) => {
        if (open) {
          resetTranslate();
        }
        setProfileSheetOpen(open);
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "flex max-h-[92dvh] flex-col gap-0 border-0 bg-transparent p-0 shadow-none",
          "data-[state=open]:duration-300 data-[state=closed]:duration-200"
        )}
      >
        <SheetTitle className="sr-only">{user?.username ? `${user.username} profile` : "Profile"}</SheetTitle>
        <div ref={panelRef} className={cn("flex min-h-0 flex-col gap-0", MOBILE_SHEET_PANEL)}>
          <div className="flex min-h-8 touch-none select-none justify-center pb-2 pt-3" {...grabberProps}>
            <span aria-hidden className={MOBILE_SHEET_GRABBER} />
          </div>
          <MobileProfileSheetHeader />

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">
            <MobileProfileNavigationSection />
            <MobileProfilePreferencesSection />
            {isAdmin ? <MobileProfileAdminSection /> : null}
          </div>

          <MobileProfileSheetFooter />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileProfileSheet() {
  return (
    <MobileProfileSheetProvider>
      <MobileProfileSheetContent />
    </MobileProfileSheetProvider>
  );
}
