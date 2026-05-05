"use client";

import { useParams } from "next/navigation";
import { TeamHubEventsContent } from "@/components/teams/team-hub/events-content";

export default function TeamHubCalendarPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  return <TeamHubEventsContent teamId={teamId} />;
}
