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
        markIsActive={isActive}
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
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive ? "bg-secondary/15 text-primary" : "text-foreground hover:bg-muted"
      )}
    >
      <TeamMark
        displayUrl={hasTeam ? displayUrl : null}
        logoPending={hasTeam && logoPending}
        hasTeam={hasTeam}
        markIsActive={isActive}
        className="h-5 w-5 rounded-full"
        imgClassName=""
      />
      <span>{label}</span>
    </Link>
  );
}
