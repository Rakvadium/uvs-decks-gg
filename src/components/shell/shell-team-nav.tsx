"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Flag } from "lucide-react";
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
}: {
  displayUrl: string | null | undefined;
  logoPending: boolean;
  hasTeam: boolean;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30",
        hasTeam && displayUrl ? "border-primary/25" : "border-border/60",
        className
      )}
    >
      {logoPending ? (
        <div className="h-full w-full animate-pulse bg-muted/50" />
      ) : displayUrl ? (
        <img src={displayUrl} alt="" className={cn("h-full w-full object-cover", imgClassName)} />
      ) : (
        <Flag className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}

function TeamMarkMobile({
  displayUrl,
  logoPending,
  isActive,
}: {
  displayUrl: string | null | undefined;
  logoPending: boolean;
  isActive: boolean;
}) {
  if (logoPending) {
    return <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted/50" />;
  }
  if (displayUrl) {
    return (
      <img
        src={displayUrl}
        alt=""
        className={cn(
          "h-8 w-8 shrink-0 rounded-full object-cover transition-all duration-200",
          isActive
            ? "border border-secondary/55 shadow-[0_0_4px_color-mix(in_oklch,var(--secondary)_40%,transparent)]"
            : "border border-border/60"
        )}
      />
    );
  }
  return (
    <Flag
      className={cn(
        "h-8 w-8 shrink-0 transition-all duration-200",
        isActive ? "text-primary drop-shadow-[0_0_4px_var(--primary)]" : "text-muted-foreground"
      )}
      aria-hidden
    />
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
        "render-stable relative flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed && "w-full justify-center px-2 py-2.5",
        isActive
          ? "border-secondary/40 bg-secondary/15 text-primary shadow-[var(--chrome-shell-nav-active-shadow)]"
          : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-border/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <TeamMark
        displayUrl={hasTeam ? displayUrl : null}
        logoPending={hasTeam && logoPending}
        hasTeam={hasTeam}
        className="h-8 w-8 rounded-full"
        imgClassName=""
      />
      {!collapsed ? (
        <span className="whitespace-nowrap font-mono text-xs uppercase tracking-wider">{label}</span>
      ) : null}
      {isActive ? <div className="pointer-events-none absolute inset-0 rounded-md border border-secondary/30" /> : null}
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
      className={cn(
        "relative flex w-full flex-1 flex-col items-center justify-center gap-1.5 py-2 transition-all duration-200",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {isActive ? (
        <div className="absolute inset-x-2 top-0 h-0.5 bg-secondary shadow-[0_0_3px_color-mix(in_oklch,var(--secondary)_50%,transparent),0_0_12px_color-mix(in_oklch,var(--secondary)_32%,transparent)]" />
      ) : null}
      <TeamMarkMobile
        displayUrl={hasTeam ? displayUrl : null}
        logoPending={hasTeam && logoPending}
        isActive={isActive}
      />
      <span
        className={cn(
          "text-[10px] font-mono uppercase tracking-widest",
          isActive && "font-semibold"
        )}
      >
        Teams
      </span>
    </Link>
  );
}
