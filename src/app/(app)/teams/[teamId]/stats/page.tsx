"use client";

import { useParams } from "next/navigation";
import { TeamHubStatsContent } from "@/components/teams/team-hub/stats-content";

export default function TeamHubStatsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  return <TeamHubStatsContent teamId={teamId} />;
}
