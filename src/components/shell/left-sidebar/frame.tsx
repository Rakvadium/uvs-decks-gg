import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SHELL_CHROME_JUNCTION_EDGE_RIGHT,
  SHELL_SIDEBAR_SURFACE_STYLE,
  SHELL_RAIL_WIDTH,
} from "../shell-chrome";
import { useLeftSidebarContext } from "./context";

interface LeftSidebarFrameProps {
  children: ReactNode;
}

export function LeftSidebarFrame({ children }: LeftSidebarFrameProps) {
  const { collapsed, prefersReducedMotion } = useLeftSidebarContext();
  const width = collapsed ? SHELL_RAIL_WIDTH : 256;

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col overflow-hidden text-sidebar-foreground shadow-none",
        !prefersReducedMotion && "transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
      )}
      style={{ width, ...SHELL_SIDEBAR_SURFACE_STYLE }}
    >
      <div className={SHELL_CHROME_JUNCTION_EDGE_RIGHT} />
      <div className="relative flex h-full flex-col">{children}</div>
    </aside>
  );
}
