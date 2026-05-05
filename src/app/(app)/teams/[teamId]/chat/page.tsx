"use client";

import { useParams } from "next/navigation";
import { TeamHubChatContent } from "@/components/teams/team-hub/chat-content";

export default function TeamHubChatPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  return <TeamHubChatContent teamId={teamId} />;
}
