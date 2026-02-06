import { LogOut, Settings } from "lucide-react";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useLeftSidebarContext } from "../../context";
import { LeftSidebarAdminItems } from "./admin-items";
import { MENU_ITEM_CLASS } from "./constants";
import { LeftSidebarThemeControls } from "./theme-submenu";

export function LeftSidebarUserMenuContent() {
  const { collapsed, handleSignOut, navigateTo } = useLeftSidebarContext();

  return (
    <DropdownMenuContent
      className="w-56 rounded-lg border-primary/20 bg-popover/95 backdrop-blur-lg"
      align="start"
      side={collapsed ? "right" : "top"}
      sideOffset={4}
    >
      <LeftSidebarThemeControls />

      <DropdownMenuItem onClick={() => navigateTo("/settings")} className={MENU_ITEM_CLASS}>
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </DropdownMenuItem>

      <LeftSidebarAdminItems />

      <DropdownMenuSeparator className="bg-border/50" />
      <DropdownMenuItem
        onClick={() => void handleSignOut()}
        className="font-mono text-xs uppercase tracking-wider hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
