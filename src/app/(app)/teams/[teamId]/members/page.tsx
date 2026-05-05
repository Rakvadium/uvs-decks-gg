"use client";

import { useParams } from "next/navigation";
import { TeamHubMembersContent } from "@/components/teams/team-hub/members-content";

export default function TeamHubMembersPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  return <TeamHubMembersContent teamId={teamId} />;
}
