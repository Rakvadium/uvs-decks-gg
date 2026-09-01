"use client";

import { PageHeading, SectionHeading } from "@/components/ui/typography-headings";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { Calendar, Layers, Loader2, Megaphone, MessageSquare, Plus, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import {
  FLOATING_ACTION_PILL_CLASS,
  FloatingActionPill,
  FloatingPageBar,
  FloatingPageLayout,
  FloatingPageTitle,
} from "@/components/shell/floating-page-bar";
import { CreateTeamButton } from "@/components/teams/create-team-dialog";
import { Surface } from "@/components/ui/card";

function TeamsLandingFloatingBar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { openAuthDialog } = useAuthDialog();

  return (
    <FloatingPageBar
      left={
        <FloatingPageTitle>Teams</FloatingPageTitle>
      }
      right={
        isAuthenticated ? (
          <CreateTeamButton className={FLOATING_ACTION_PILL_CLASS} />
        ) : (
          <FloatingActionPill onClick={() => openAuthDialog()}>
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">Sign in</span>
          </FloatingActionPill>
        )
      }
    />
  );
}

export function TeamsLandingView() {
  const router = useRouter();
  const { openAuthDialog } = useAuthDialog();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const myTeam = useQuery(api.teams.permissions.getMyTeam, isAuthenticated ? {} : "skip");

  useEffect(() => {
    if (!isAuthenticated || myTeam === undefined) return;
    if (myTeam !== null) {
      router.replace(`/teams/${myTeam._id}/announcements`);
    }
  }, [isAuthenticated, myTeam, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated && myTeam === undefined) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated && myTeam !== null) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const featureClass =
    "flex gap-3 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm md:p-5";

  return (
    <FloatingPageLayout bar={<TeamsLandingFloatingBar isAuthenticated={isAuthenticated} />}>
      <div className="relative min-h-0 pb-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="h-full w-full bg-gradient-to-b from-primary/[0.07] via-primary/[0.03] via-40% to-transparent to-100%" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-3 md:hidden">
            <PageHeading size="sm">Teams</PageHeading>
            {isAuthenticated ? (
              <CreateTeamButton className="w-full justify-center" />
            ) : (
              <FloatingActionPill className="w-full" onClick={() => openAuthDialog()}>
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">Sign in</span>
              </FloatingActionPill>
            )}
          </div>

          <Surface className="rounded-3xl border-border/50 bg-card/80 p-5 backdrop-blur-sm md:p-7">
            <SectionHeading size="md">What you get</SectionHeading>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isAuthenticated
                ? "You can belong to one team at a time. Create a team to get a shared hub, or wait for an invite from a captain."
                : "Sign in to create a team or accept an invite. Each account can join one team — a shared space for your squad."}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <li className={featureClass}>
                <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">News</p>
                  <p className="mt-1 text-sm text-muted-foreground">Captains and leads post announcements everyone sees.</p>
                </div>
              </li>
              <li className={featureClass}>
                <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">Team chat</p>
                  <p className="mt-1 text-sm text-muted-foreground">Coordinate lists, rules questions, and scrims in one thread.</p>
                </div>
              </li>
              <li className={featureClass}>
                <Layers className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">Shared decks</p>
                  <p className="mt-1 text-sm text-muted-foreground">Build and share decks visible to the whole team.</p>
                </div>
              </li>
              <li className={featureClass}>
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">Members & roles</p>
                  <p className="mt-1 text-sm text-muted-foreground">Invites, roles, and permissions managed in the hub.</p>
                </div>
              </li>
              <li className={featureClass}>
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">Calendar</p>
                  <p className="mt-1 text-sm text-muted-foreground">Schedule locals, online events, and deadlines.</p>
                </div>
              </li>
            </ul>
          </Surface>
        </div>
      </div>
    </FloatingPageLayout>
  );
}
