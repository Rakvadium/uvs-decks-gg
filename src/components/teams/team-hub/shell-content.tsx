"use client";

import { PageHeading } from "@/components/ui/typography-headings";
import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { FloatingPageLayout } from "@/components/shell/floating-page-bar";
import { useTeamHub } from "./hook";
import { TeamHubFloatingTopBar } from "./floating-top-bar";
import { TeamHubPrimaryActionProvider } from "./primary-action-context";
import { TeamHubSectionNav } from "./team-hub-section-nav";
import { TeamLogoSection } from "./team-logo-section";

interface TeamHubShellContentProps {
  teamId: string;
  children: ReactNode;
}

export function TeamHubShellContent({ teamId, children }: TeamHubShellContentProps) {
  const { team, loading, notFound } = useTeamHub(teamId);
  const id = teamId as Id<"teams"> | undefined;
  const logoPresentation = useQuery(
    api.teams.logo.getTeamLogoPresentation,
    id && !notFound ? { teamId: id } : "skip"
  );

  if (notFound) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">This team was not found or you do not have access.</p>
        <Link
          href="/teams"
          className="chrome-label-case text-sm text-primary underline-offset-4 hover:underline"
        >
          About teams
        </Link>
      </div>
    );
  }

  const description = team?.description?.trim() ?? "";

  const mobileBranding = loading ? (
    <div className="flex flex-wrap items-start gap-4">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-muted" />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <div className="h-8 w-48 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  ) : team && id ? (
    <div className="flex flex-wrap items-start gap-4">
      <TeamLogoSection teamId={id} presentation={logoPresentation} />
      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
        <PageHeading size="sm">{team.name}</PageHeading>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <TeamHubPrimaryActionProvider>
      <FloatingPageLayout
        bar={
          <TeamHubFloatingTopBar
            teamId={teamId}
            teamName={team?.name ?? null}
            logoPresentation={logoPresentation}
            loading={loading}
          />
        }
        contentClassName="relative min-w-0"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="h-full w-full bg-gradient-to-b from-primary/[0.07] via-primary/[0.03] via-40% to-transparent to-100%" />
        </div>
        <div className="relative z-10 min-w-0">
          <div className="md:hidden min-w-0 border-b border-border/50 pb-4">
            {mobileBranding}
            <div className="mt-4 w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:thin]">
              <TeamHubSectionNav teamId={teamId} />
            </div>
          </div>

          <div className="flex-1 pt-4 pb-6 md:pt-0 md:pb-8">{children}</div>
        </div>
      </FloatingPageLayout>
    </TeamHubPrimaryActionProvider>
  );
}
