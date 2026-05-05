"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { AppPageHeader } from "@/components/shell/app-page-header";
import { useTeamHub } from "./hook";
import { TeamHubSectionNav } from "./team-hub-section-nav";
import { TeamLogoSection } from "./team-logo-section";

interface TeamHubShellContentProps {
  teamId: string;
  children: ReactNode;
}

const DEFAULT_DESCRIPTION =
  "Shared workspace for your team's decks, chat, announcements, and calendar.";

export function TeamHubShellContent({ teamId, children }: TeamHubShellContentProps) {
  const { team, loading, notFound } = useTeamHub(teamId);
  const id = teamId as Id<"teams"> | undefined;
  const logoPresentation = useQuery(
    api.teams.logo.getTeamLogoPresentation,
    id && !notFound ? { teamId: id } : "skip",
  );

  if (notFound) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">This team was not found or you do not have access.</p>
        <Link
          href="/teams"
          className="text-sm font-mono uppercase tracking-wider text-primary underline-offset-4 hover:underline"
        >
          About teams
        </Link>
      </div>
    );
  }

  const descriptionText = team?.description?.trim() ? team.description.trim() : DEFAULT_DESCRIPTION;

  const tabsScrollWrap = (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TeamHubSectionNav teamId={teamId} />
    </div>
  );

  const branding = loading ? (
    <div className="flex flex-wrap items-start gap-4">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-muted" />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <div className="h-8 w-48 max-w-full animate-pulse rounded-md bg-muted md:h-9" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded-md bg-muted/70" />
      </div>
    </div>
  ) : team && id ? (
    <div className="flex flex-wrap items-start gap-4">
      <TeamLogoSection teamId={id} presentation={logoPresentation} />
      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{team.name}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{descriptionText}</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative min-h-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="h-full w-full bg-gradient-to-b from-primary/[0.06] via-cyan-500/[0.03] via-40% to-transparent to-100%" />
      </div>
      <div className="relative z-10 px-4 py-2 md:px-6 md:py-4">
        <div className="md:hidden">
          <div className="border-b border-border/50 pb-4">
            {branding}
            <div className="mt-4">{tabsScrollWrap}</div>
          </div>
        </div>

        <div className="hidden md:block">
          <AppPageHeader
            className="rounded-none border-x-0"
            innerClassName="!px-0"
            title={branding}
            tabs={tabsScrollWrap}
          />
        </div>

        <div className="flex-1 pt-4 pb-6 md:pt-6 md:pb-8">{children}</div>
      </div>
    </div>
  );
}
