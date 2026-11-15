"use client";

import { PageHeading, SectionHeading } from "@/components/ui/typography-headings";
import { LoadingState } from "@/components/ui/loading-state";
import { Panel } from "@/components/ui/panel";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { Calendar, Layers, Megaphone, MessageSquare, Plus, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useStartAuth } from "@/components/auth/use-start-auth";
import {
  FloatingActionPill,
  FloatingPageBar,
  FloatingPageLayout,
  FloatingPageTitle,
} from "@/components/shell/floating-page-bar";
import { CreateTeamButton } from "@/components/teams/create-team-dialog";
import { Surface } from "@/components/ui/card";

function TeamsLandingFloatingBar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const startAuth = useStartAuth();

  return (
    <FloatingPageBar
      left={
        <FloatingPageTitle>Teams</FloatingPageTitle>
      }
      right={
        isAuthenticated ? (
          <CreateTeamButton placement="header" />
        ) : (
          <FloatingActionPill onClick={() => startAuth()}>
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
  const startAuth = useStartAuth();
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
      <LoadingState size="lg" className="min-h-[30vh]" />
    );
  }

  if (isAuthenticated && myTeam === undefined) {
    return (
      <LoadingState size="lg" className="min-h-[30vh]" />
    );
  }

  if (isAuthenticated && myTeam !== null) {
    return (
      <LoadingState size="lg" className="min-h-[30vh]" />
    );
  }

  return (
    <FloatingPageLayout bar={<TeamsLandingFloatingBar isAuthenticated={isAuthenticated} />} pageWash="fade">
      <div className="space-y-6 pb-10">
        <div className="space-y-3 md:hidden">
          <PageHeading size="sm">Teams</PageHeading>
          {isAuthenticated ? (
            <CreateTeamButton className="w-full justify-center" />
          ) : (
            <FloatingActionPill className="w-full" onClick={() => startAuth()}>
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Sign in</span>
            </FloatingActionPill>
          )}
        </div>

        <Surface className="block p-5 md:p-7">
          <SectionHeading size="md">What you get</SectionHeading>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isAuthenticated
              ? "You can belong to one team at a time. Create a team to get a shared hub, or wait for an invite from a captain."
              : "Sign in to create a team or accept an invite. Each account can join one team — a shared space for your squad."}
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Panel asChild>
            <li className="flex gap-3 p-4 md:p-5">
              <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">News</p>
                <p className="mt-1 text-sm text-muted-foreground">Captains and leads post announcements everyone sees.</p>
              </div>
            </li>
            </Panel>
            <Panel asChild>
            <li className="flex gap-3 p-4 md:p-5">
              <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Team chat</p>
                <p className="mt-1 text-sm text-muted-foreground">Coordinate lists, rules questions, and scrims in one thread.</p>
              </div>
            </li>
            </Panel>
            <Panel asChild>
            <li className="flex gap-3 p-4 md:p-5">
              <Layers className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Shared decks</p>
                <p className="mt-1 text-sm text-muted-foreground">Build and share decks visible to the whole team.</p>
              </div>
            </li>
            </Panel>
            <Panel asChild>
            <li className="flex gap-3 p-4 md:p-5">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Members & roles</p>
                <p className="mt-1 text-sm text-muted-foreground">Invites, roles, and permissions managed in the hub.</p>
              </div>
            </li>
            </Panel>
            <Panel asChild>
            <li className="flex gap-3 p-4 md:p-5">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Calendar</p>
                <p className="mt-1 text-sm text-muted-foreground">Schedule locals, online events, and deadlines.</p>
              </div>
            </li>
            </Panel>
          </ul>
        </Surface>
      </div>
    </FloatingPageLayout>
  );
}
