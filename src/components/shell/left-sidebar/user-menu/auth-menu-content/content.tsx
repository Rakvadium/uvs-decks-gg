import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLeftSidebarContext } from "../../context";
import { LeftSidebarUserIdentity } from "../user-identity";
import { LeftSidebarAdminItems } from "./admin-items";
import { LeftSidebarThemeControls } from "./theme-submenu";

export function LeftSidebarUserMenuContent() {
  const { handleSignOut, navigateTo } = useLeftSidebarContext();

  return (
    <DropdownMenuContent
      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
      side="right"
      align="end"
      sideOffset={4}
    >
      <DropdownMenuLabel className="p-0 font-normal normal-case tracking-normal text-foreground">
        <LeftSidebarUserIdentity className="px-1 py-1.5" />
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <LeftSidebarThemeControls />
      <DropdownMenuItem onClick={() => navigateTo("/settings")}>
        <Settings />
        Settings
      </DropdownMenuItem>
      <LeftSidebarAdminItems />
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
        <LogOut />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
