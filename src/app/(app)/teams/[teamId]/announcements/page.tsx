"use client";

import { useParams } from "next/navigation";
import { TeamHubAnnouncementsContent } from "@/components/teams/team-hub/announcements-content";

export default function TeamHubAnnouncementsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  return <TeamHubAnnouncementsContent teamId={teamId} />;
}
