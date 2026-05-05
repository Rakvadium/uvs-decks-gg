import { cn } from "@/lib/utils";
import { ShellTeamNav } from "@/components/shell/shell-team-nav";
import { buildMainNavItems } from "../main-nav-build";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileNavigationSection() {
  const { pathname, handleNavClick, closeSheet } = useMobileProfileSheetContext();
  const navItems = buildMainNavItems();

  return (
    <div className="p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Navigation</p>
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.includes(`/${item.path}`);

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-secondary/15 text-primary" : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <ShellTeamNav variant="profile-sheet" onAfterNavigate={closeSheet} />
      </div>
    </div>
  );
}
