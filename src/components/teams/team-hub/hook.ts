"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function useTeamHub(teamId: string | undefined) {
  const id = teamId as Id<"teams"> | undefined;
  const team = useQuery(
    api.teams.permissions.getTeam,
    id ? { teamId: id } : "skip"
  );
  const loading = team === undefined;
  const notFound = team === null && !loading;
  return { team, loading, notFound };
}
