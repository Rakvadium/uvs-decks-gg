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
      <div>
        <h1 className="font-display text-lg font-semibold text-foreground">Stats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Team performance metrics and analytics will appear here in a later release.
        </p>
      </div>
      <div
        className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-4 py-12 text-center"
        role="status"
      >
        <p className="text-sm text-muted-foreground">No statistics available yet.</p>
      </div>
    </div>
  );
}
