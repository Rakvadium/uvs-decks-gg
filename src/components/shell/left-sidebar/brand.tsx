import { cn } from "@/lib/utils";
import { AppBrandLink } from "@/components/brand/app-brand-link";
import { SHELL_RAIL_TOP_PADDING_CLASS } from "../shell-chrome";
import { LeftSidebarCollapseToggle } from "./collapse-toggle";
import { useLeftSidebarContext } from "./context";

export function LeftSidebarBrand() {
  const { collapsed } = useLeftSidebarContext();

  return (
    <div
      className={cn(
        "px-3 pb-2",
        SHELL_RAIL_TOP_PADDING_CLASS,
        collapsed
          ? "flex flex-col items-center gap-2"
          : "flex items-center gap-1"
      )}
    >
      <AppBrandLink
        showWordmark={!collapsed}
        wordmarkLayout="stacked"
        markSize="md"
        className={cn(!collapsed && "min-w-0 flex-1")}
      />
      <LeftSidebarCollapseToggle />
    </div>
  );
}
