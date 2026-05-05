import { cn } from "@/lib/utils";
import { ShellTeamNav } from "@/components/shell/shell-team-nav";
import { useLeftSidebarContext } from "../context";
import { LeftSidebarAuthenticatedUserMenu } from "./authenticated-menu";
import { LeftSidebarGuestSignInButton } from "./guest-sign-in";

export function LeftSidebarUserMenu() {
  const { collapsed, isAuthenticated, isLoading } = useLeftSidebarContext();

  return (
    <div className={cn("flex flex-col gap-2 p-2", collapsed && "items-center")}>
      <ShellTeamNav variant="sidebar" />
      {!isLoading && !isAuthenticated ? <LeftSidebarGuestSignInButton /> : <LeftSidebarAuthenticatedUserMenu />}
    </div>
  );
}
