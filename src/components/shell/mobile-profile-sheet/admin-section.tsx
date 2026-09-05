import { ChevronRight, Home, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_INSET_DIVIDER, MOBILE_INSET_GROUP, MOBILE_INSET_ROW } from "../mobile-glass";
import { MobileProfileSectionLabel } from "./section-label";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileAdminSection() {
  const { isOnAdminPage, handleAdminToggle } = useMobileProfileSheetContext();

  return (
    <section>
      <MobileProfileSectionLabel>Admin</MobileProfileSectionLabel>
      <div className={cn(MOBILE_INSET_GROUP, MOBILE_INSET_DIVIDER)}>
        <button type="button" onClick={handleAdminToggle} className={MOBILE_INSET_ROW}>
          {isOnAdminPage ? (
            <Home className="size-5 text-muted-foreground" aria-hidden />
          ) : (
            <Shield className="size-5 text-muted-foreground" aria-hidden />
          )}
          <span className="flex-1 font-medium">{isOnAdminPage ? "Back to App" : "Admin Panel"}</span>
          <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden />
        </button>
      </div>
    </section>
  );
}
