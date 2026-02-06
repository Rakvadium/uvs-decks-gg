"use client";

import { LeftSidebarBrand } from "./brand";
import { LeftSidebarCollapseToggle } from "./collapse-toggle";
import { LeftSidebarProvider } from "./context";
import { LeftSidebarDivider } from "./divider";
import { LeftSidebarFrame } from "./frame";
import { LeftSidebarNav } from "./nav";
import { LeftSidebarUserMenu } from "./user-menu";

interface LeftSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function LeftSidebar({ collapsed, onToggle }: LeftSidebarProps) {
  return (
    <LeftSidebarProvider collapsed={collapsed} onToggle={onToggle}>
      <LeftSidebarFrame>
        <LeftSidebarBrand />
        <LeftSidebarDivider />
        <LeftSidebarNav />
        <LeftSidebarDivider />
        <LeftSidebarCollapseToggle />
        <LeftSidebarUserMenu />
      </LeftSidebarFrame>
    </LeftSidebarProvider>
  );
}
