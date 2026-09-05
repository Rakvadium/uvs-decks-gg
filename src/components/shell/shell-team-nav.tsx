"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ChevronRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLeftSidebarContext } from "./left-sidebar/context";
import { MOBILE_INSET_ROW } from "./mobile-glass";
import {
  SHELL_NAV_ITEM_ACTIVE,
  SHELL_NAV_ITEM_IDLE,
  SHELL_RAIL_ITEM_COLLAPSED_CLASS,
} from "./shell-chrome";

type ShellTeamNavSidebarProps = {
  variant: "sidebar";
};

type ShellTeamNavProfileSheetProps = {
  variant: "profile-sheet";
  onAfterNavigate?: () => void;
};

function useTeamNavTarget() {
  const { isAuthenticated } = useConvexAuth();
  const myTeam = useQuery(api.teams.permissions.getMyTeam, isAuthenticated ? {} : "skip");
  const firstTeam = myTeam === undefined ? undefined : myTeam;
  const teamId = firstTeam?._id;
  const logoPresentation = useQuery(
    api.teams.logo.getTeamLogoPresentation,
    isAuthenticated && teamId ? { teamId } : "skip"
  );
  const hasTeam = Boolean(firstTeam);
  const teamHref = hasTeam && firstTeam ? `/teams/${firstTeam._id}/announcements` : "/teams";
  const displayUrl = logoPresentation === undefined ? undefined : (logoPresentation?.displayUrl ?? null);
  return {
    hasTeam,
    teamHref,
    firstTeam: firstTeam ?? null,
    displayUrl: hasTeam ? displayUrl : null,
    logoPending: Boolean(isAuthenticated && hasTeam && teamId && logoPresentation === undefined),
  };
}

function useTeamNavActive(teamBasePath: string, hasTeam: boolean) {
  const pathname = usePathname();
  if (!hasTeam) {
    return pathname === "/teams" || pathname.startsWith("/teams/");
  }
  return pathname.startsWith(teamBasePath);
}

function TeamMark({
  displayUrl,
  logoPending,
  hasTeam,
  className,
  imgClassName,
  markIsActive,
}: {
  displayUrl: string | null | undefined;
  logoPending: boolean;
  hasTeam: boolean;
  className?: string;
  imgClassName?: string;
  markIsActive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent",
        hasTeam && displayUrl ? "border-accent/30" : "border-sidebar-border",
        className
      )}
    >
      {logoPending ? (
        <div className="h-full w-full animate-pulse bg-muted/50" />
      ) : displayUrl ? (
        <img src={displayUrl} alt="" className={cn("h-full w-full object-cover", imgClassName)} />
      ) : (
        <Flag
          className={cn(
            "h-4 w-4 shrink-0",
            markIsActive ? "text-primary" : "text-muted-foreground"
          )}
          aria-hidden
        />
      )}
    </div>
  );
}

export function ShellTeamNav(props: ShellTeamNavSidebarProps | ShellTeamNavProfileSheetProps) {
  const { teamHref, displayUrl, hasTeam, logoPending, firstTeam } = useTeamNavTarget();
  const teamBasePath = hasTeam && firstTeam ? `/teams/${firstTeam._id}` : "";
  const isActive = useTeamNavActive(teamBasePath, hasTeam);
  if (props.variant === "sidebar") {
    return (
      <ShellTeamNavSidebarInner
        teamHref={teamHref}
        displayUrl={displayUrl}
        hasTeam={hasTeam}
        logoPending={logoPending}
        isActive={isActive}
      />
    );
  }
  return (
    <ShellTeamNavProfileSheetInner
      teamHref={teamHref}
      displayUrl={displayUrl}
      hasTeam={hasTeam}
      logoPending={logoPending}
      isActive={isActive}
      onAfterNavigate={props.onAfterNavigate}
    />
  );
}

function ShellTeamNavSidebarInner({
  teamHref,
  displayUrl,
  hasTeam,
  logoPending,
  isActive,
}: {
  teamHref: string;
  displayUrl: string | null | undefined;
  hasTeam: boolean;
  logoPending: boolean;
  isActive: boolean;
}) {
  const { collapsed } = useLeftSidebarContext();
  const label = "Teams";
  const link = (
    <Link
      href={teamHref}
      className={cn(
        "relative flex items-center rounded-md border text-sm font-medium transition-colors duration-200",
        collapsed ? cn(SHELL_RAIL_ITEM_COLLAPSED_CLASS, "overflow-hidden") : "w-full gap-3 px-3 py-2.5",
        isActive ? SHELL_NAV_ITEM_ACTIVE : SHELL_NAV_ITEM_IDLE
      )}
    >
      <TeamMark
        displayUrl={hasTeam ? displayUrl : null}
        logoPending={hasTeam && logoPending}
        hasTeam={hasTeam}
        markIsActive={isActive}
        className={collapsed ? "size-full rounded-md border-0" : "h-8 w-8 rounded-full"}
        imgClassName=""
      />
      {!collapsed ? (
        <span className="chrome-label-case whitespace-nowrap text-xs">{label}</span>
      ) : null}
      {isActive ? <div className="pointer-events-none absolute inset-0 rounded-md border border-accent/50" /> : null}
    </Link>
  );
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="chrome-label-case text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

function ShellTeamNavProfileSheetInner({
  teamHref,
  displayUrl,
  hasTeam,
  logoPending,
  isActive,
  onAfterNavigate,
}: {
  teamHref: string;
  displayUrl: string | null | undefined;
  hasTeam: boolean;
  logoPending: boolean;
  isActive: boolean;
  onAfterNavigate?: () => void;
}) {
  const label = "Teams";
  return (
    <Link
      href={teamHref}
      onClick={() => onAfterNavigate?.()}
      aria-current={isActive ? "page" : undefined}
      className={cn(MOBILE_INSET_ROW, isActive && "text-primary")}
    >
      <TeamMark
        displayUrl={hasTeam ? displayUrl : null}
        logoPending={hasTeam && logoPending}
        hasTeam={hasTeam}
        markIsActive={isActive}
        className="size-5 rounded-full border-0 bg-transparent"
        imgClassName=""
      />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground/70" aria-hidden />
    </Link>
  );
}
