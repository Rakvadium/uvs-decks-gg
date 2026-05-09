import { cn } from "@/lib/utils";
import { ShellFeedbackNav } from "@/components/shell/shell-feedback-nav";
import { ShellTeamNav } from "@/components/shell/shell-team-nav";
import { ShellUniversusNav } from "@/components/shell/shell-universus-nav";
import { useLeftSidebarContext } from "../context";
import { LeftSidebarAuthenticatedUserMenu } from "./authenticated-menu";
import { LeftSidebarGuestSignInButton } from "./guest-sign-in";
import { LeftSidebarGuestThemeToggle } from "./guest-theme-toggle";

export function LeftSidebarUserMenu() {
  const { collapsed, isAuthenticated, isLoading } = useLeftSidebarContext();

  return (
    <div className={cn("flex flex-col gap-2 p-2", collapsed && "items-center")}>
      <ShellFeedbackNav variant="sidebar" />
      <ShellUniversusNav variant="sidebar" />
      <ShellTeamNav variant="sidebar" />
      {!isLoading && !isAuthenticated ? (
        <>
          <LeftSidebarGuestThemeToggle />
          <LeftSidebarGuestSignInButton />
        </>
      ) : (
        <LeftSidebarAuthenticatedUserMenu />
      )}
    </div>
  );
}
