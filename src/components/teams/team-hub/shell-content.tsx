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
import { Skeleton } from "@/components/ui/skeleton";

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
      <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <Skeleton className="h-8 w-48 max-w-full" />
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
        contentClassName="min-w-0"
        pageWash="fade"
      >
        <div className="min-w-0">
          <div className="md:hidden min-w-0 border-b border-surface pb-4">
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
