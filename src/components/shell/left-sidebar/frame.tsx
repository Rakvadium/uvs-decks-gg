import * as m from "framer-motion/m";
import type { ReactNode } from "react";
import { useLeftSidebarContext } from "./context";

interface LeftSidebarFrameProps {
  children: ReactNode;
}

export function LeftSidebarFrame({ children }: LeftSidebarFrameProps) {
  const { collapsed, prefersReducedMotion } = useLeftSidebarContext();

  const width = collapsed ? 64 : 256;

  return (
    <m.aside
      initial={false}
      animate={{ width }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="render-stable relative flex h-full flex-col overflow-hidden border-sidebar-border/50 bg-sidebar"
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--chrome-shell-sidebar-wash)" }} />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </m.aside>
  );
}
