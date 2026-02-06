import { cn } from "@/lib/utils";
import { useLeftSidebarContext } from "../context";
import { LeftSidebarAuthenticatedUserMenu } from "./authenticated-menu";
import { LeftSidebarGuestSignInButton } from "./guest-sign-in";

export function LeftSidebarUserMenu() {
  const { collapsed, isAuthenticated, isLoading } = useLeftSidebarContext();

  return (
    <div className={cn("p-2", collapsed && "flex flex-col items-center")}>
      {!isLoading && !isAuthenticated ? <LeftSidebarGuestSignInButton /> : <LeftSidebarAuthenticatedUserMenu />}
    </div>
  );
}
