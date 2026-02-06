import { Home, Shield } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useLeftSidebarContext } from "../../context";
import { MENU_ITEM_CLASS } from "./constants";

export function LeftSidebarAdminItems() {
  const { isAdmin, isOnAdminPage, navigateTo } = useLeftSidebarContext();

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator className="bg-border/50" />
      {isOnAdminPage ? (
        <DropdownMenuItem onClick={() => navigateTo("/")} className={MENU_ITEM_CLASS}>
          <Home className="mr-2 h-4 w-4" />
          Back to App
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={() => navigateTo("/admin")} className={MENU_ITEM_CLASS}>
          <Shield className="mr-2 h-4 w-4" />
          Admin Panel
        </DropdownMenuItem>
      )}
    </>
  );
}
