"use client";

import { useTeamHub } from "./hook";

interface TeamHubStatsContentProps {
  teamId: string;
}

export function TeamHubStatsContent({ teamId }: TeamHubStatsContentProps) {
  const { team, notFound, loading } = useTeamHub(teamId);

  if (notFound) {
    return null;
  }

  if (loading || !team) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-md bg-muted/80" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-semibold text-foreground md:hidden">Stats</h1>
      <div
        className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-12 text-center"
        role="status"
      >
        <p className="text-sm text-muted-foreground">No statistics available yet.</p>
      </div>
    </div>
  );
}
