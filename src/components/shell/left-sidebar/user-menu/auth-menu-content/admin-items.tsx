import { Home, Shield } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useLeftSidebarContext } from "../../context";

export function LeftSidebarAdminItems() {
  const { isAdmin, isOnAdminPage, navigateTo } = useLeftSidebarContext();

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator />
      {isOnAdminPage ? (
        <DropdownMenuItem onClick={() => navigateTo("/")}>
          <Home />
          Back to app
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={() => navigateTo("/admin")}>
          <Shield />
          Admin panel
        </DropdownMenuItem>
      )}
    </>
  );
}
