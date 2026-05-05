"use client";

import { TeamsLandingView } from "@/components/teams/teams-landing-view";

export default function TeamsPage() {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden md:h-full">
      <TeamsLandingView />
    </div>
  );
}