"use client";

import { TeamsLandingView } from "@/components/teams/teams-landing-view";

export default function TeamsPage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:h-full">
      <TeamsLandingView />
    </div>
  );
}
