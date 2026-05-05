"use client";

import { useParams } from "next/navigation";
import { TeamHubDecksContent } from "@/components/teams/team-hub/decks-content";

export default function TeamHubDecksPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  return <TeamHubDecksContent teamId={teamId} />;
}
