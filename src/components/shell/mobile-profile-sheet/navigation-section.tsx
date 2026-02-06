import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./constants";
import { useMobileProfileSheetContext } from "./context";

export function MobileProfileNavigationSection() {
  const { pathname, handleNavClick } = useMobileProfileSheetContext();

  return (
    <div className="p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Navigation</p>
      <div className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.includes(`/${item.path}`);

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
