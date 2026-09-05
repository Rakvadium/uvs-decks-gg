import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShellTeamNav } from "@/components/shell/shell-team-nav";
import { MOBILE_INSET_DIVIDER, MOBILE_INSET_GROUP, MOBILE_INSET_ROW } from "../mobile-glass";
import { buildMainNavItemsMobileOrder } from "../main-nav-build";
import { MobileProfileSectionLabel } from "./section-label";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileNavigationSection() {
  const { pathname, handleNavClick, closeSheet } = useMobileProfileSheetContext();
  const navItems = buildMainNavItemsMobileOrder();

  return (
    <section>
      <MobileProfileSectionLabel>Navigate</MobileProfileSectionLabel>
      <div className={cn(MOBILE_INSET_GROUP, MOBILE_INSET_DIVIDER)}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.includes(`/${item.path}`);

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNavClick(item.path)}
              className={cn(MOBILE_INSET_ROW, isActive && "text-primary")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="flex-1 font-medium">{item.label}</span>
              <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden />
            </button>
          );
        })}
        <ShellTeamNav variant="profile-sheet" onAfterNavigate={closeSheet} />
      </div>
    </section>
  );
}
