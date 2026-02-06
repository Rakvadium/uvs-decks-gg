"use client";

import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MobileProfileAdminSection } from "./admin-section";
import { MobileProfileSheetProvider, useMobileProfileSheetContext } from "./context";
import { MobileProfileSheetFooter } from "./footer";
import { MobileProfileSheetHeader } from "./header";
import { MobileProfileNavigationSection } from "./navigation-section";
import { MobileProfilePreferencesSection } from "./preferences-section";

function MobileProfileSheetContent() {
  const { isProfileSheetOpen, setProfileSheetOpen, isAdmin } = useMobileProfileSheetContext();

  return (
    <Sheet open={isProfileSheetOpen} onOpenChange={setProfileSheetOpen}>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col p-0" showCloseButton={false}>
        <MobileProfileSheetHeader />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Separator />
          <MobileProfileNavigationSection />
          <Separator />
          <MobileProfilePreferencesSection />

          {isAdmin ? (
            <>
              <Separator />
              <MobileProfileAdminSection />
            </>
          ) : (
            <div className="pb-24" />
          )}
        </div>

        <MobileProfileSheetFooter />
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
