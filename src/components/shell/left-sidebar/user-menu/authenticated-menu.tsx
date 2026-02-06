import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LeftSidebarUserMenuContent } from "./auth-menu-content";
import { LeftSidebarUserMenuTrigger } from "./auth-trigger";

export function LeftSidebarAuthenticatedUserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <LeftSidebarUserMenuTrigger />
      </DropdownMenuTrigger>
      <LeftSidebarUserMenuContent />
    </DropdownMenu>
  );
}
