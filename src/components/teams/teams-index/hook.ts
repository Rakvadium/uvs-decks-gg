"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function useTeamsIndex() {
  const { isAuthenticated } = useConvexAuth();
  const team = useQuery(api.teams.permissions.getMyTeam, isAuthenticated ? {} : "skip");
  const isLoading = isAuthenticated && team === undefined;
  const teams = team === undefined ? undefined : team === null ? [] : [team];
  return { team, teams, isLoading, isAuthenticated };
}
