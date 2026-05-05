import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { TeamHubShellContent } from "@/components/teams/team-hub/shell-content";

type Props = {
  children: ReactNode;
  params: Promise<{ teamId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId } = await params;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return {
      title: "Team",
      description: "Team workspace on UVSDECKS.GG.",
    };
  }
  try {
    const team = await fetchQuery(api.teams.permissions.getTeam, {
      teamId: teamId as Id<"teams">,
    });
    if (!team) {
      return {
        title: "Team",
        description: "This team could not be found or is unavailable.",
      };
    }
    return {
      title: team.name,
      description:
        team.description?.trim() ||
        `Team “${team.name}” on UVSDECKS.GG — workspace hub.`,
    };
  } catch {
    return {
      title: "Team",
      description: "Team workspace on UVSDECKS.GG.",
    };
  }
}

export default async function TeamHubLayout({ children, params }: Props) {
  const { teamId } = await params;
  return <TeamHubShellContent teamId={teamId}>{children}</TeamHubShellContent>;
}
