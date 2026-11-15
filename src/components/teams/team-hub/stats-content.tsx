"use client";

import { PageHeading } from "@/components/ui/typography-headings";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useTeamHub } from "./hook";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeading size="sm" className="md:hidden">Stats</PageHeading>
      <EmptyState role="status" icon={BarChart3} title="No statistics available yet." />
    </div>
  );
}
