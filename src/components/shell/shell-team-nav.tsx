"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLeftSidebarContext } from "./left-sidebar/context";

type ShellTeamNavSidebarProps = {
  variant: "sidebar";
};

type ShellTeamNavMobileColumnProps = {
  variant: "mobile-column";
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
  tone = "sidebar",
}: {
  displayUrl: string | null | undefined;
  logoPending: boolean;
  hasTeam: boolean;
  className?: string;
  imgClassName?: string;
  tone?: "sidebar" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border",
        tone === "sidebar"
          ? "border-sidebar-border/60 bg-sidebar-accent/30"
          : "border-border/50 bg-muted/30",
        hasTeam && displayUrl ? "border-primary/25" : "border-border/60",
        className
      )}
    >
      {logoPending ? (
        <div className="h-full w-full animate-pulse bg-muted/50" />
      ) : displayUrl ? (
        <img src={displayUrl} alt="" className={cn("h-full w-full object-cover", imgClassName)} />
      ) : (
        <UsersRound className="h-1/2 w-1/2 min-h-[0.75rem] min-w-[0.75rem] text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}

export function ShellTeamNav(props: ShellTeamNavSidebarProps | ShellTeamNavMobileColumnProps) {
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
    <ShellTeamNavMobileInner
      teamHref={teamHref}
      displayUrl={displayUrl}
      hasTeam={hasTeam}
      logoPending={logoPending}
      isActive={isActive}
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
  const { collapsed, prefersReducedMotion } = useLeftSidebarContext();
  const label = "Teams";
  const link = (
    <Link
      href={teamHref}
      className={cn(
        "render-stable relative flex w-full items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200",
        collapsed && "w-full justify-center px-2 py-2",
        isActive
          ? "border-primary/30 bg-primary/15 text-primary shadow-[var(--chrome-shell-nav-active-shadow)]"
          : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-border/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <TeamMark
        displayUrl={hasTeam ? displayUrl : null}
        logoPending={hasTeam && logoPending}
        hasTeam={hasTeam}
        className={cn("h-7 w-7", collapsed && "h-8 w-8")}
        imgClassName=""
        tone="sidebar"
      />
      {!collapsed ? (
        <span className="whitespace-nowrap font-mono text-xs uppercase tracking-wider">{label}</span>
      ) : null}
      {isActive ? <div className="pointer-events-none absolute inset-0 rounded-md border border-primary/20" /> : null}
    </Link>
  );
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-mono text-xs uppercase tracking-wider">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return <div className="render-stable" style={prefersReducedMotion ? undefined : { animationDelay: "250ms" }}>{link}</div>;
}

function ShellTeamNavMobileInner({
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
  return (
    <Link
      href={teamHref}
      aria-label="Teams"
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-all duration-200",
        isActive
          ? "border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]"
          : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      <TeamMark
        displayUrl={hasTeam ? displayUrl : null}
        logoPending={hasTeam && logoPending}
        hasTeam={hasTeam}
        className="h-full w-full rounded-full border-0 bg-transparent"
        imgClassName="rounded-full"
        tone="neutral"
      />
    </Link>
  );
}
