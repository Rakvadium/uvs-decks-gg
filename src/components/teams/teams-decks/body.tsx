"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfanityDisplayText } from "@/lib/moderation/use-profanity-display-text";
import { useTeamsIndex } from "../teams-index/hook";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const COLLAB_LABEL: Record<string, string> = {
  team_viewable: "View only",
  team_editable: "Editable by team",
  none: "—",
};

type CollabFilter = "all" | "team_viewable" | "team_editable";

const COLLAB_FILTER_ITEMS: { value: CollabFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "team_viewable", label: COLLAB_LABEL.team_viewable },
  { value: "team_editable", label: COLLAB_LABEL.team_editable },
];

function collabKey(
  c: "none" | "team_viewable" | "team_editable" | undefined,
): "team_viewable" | "team_editable" {
  if (c === "team_editable") return "team_editable";
  return "team_viewable";
}

export function TeamsDecksBody() {
  const { display, viewerUserId } = useProfanityDisplayText();
  const { teams: myTeams, isLoading: loadingTeams } = useTeamsIndex();
  const [filter, setFilter] = useState<CollabFilter>("all");
  const rows = useQuery(
    api.teams.teamDecks.listAggregatedForMyTeams,
    !loadingTeams && myTeams && myTeams.length > 0 ? { collaboration: filter } : "skip",
  );
  const loadingDecks = rows === undefined;
  const loading = loadingTeams || (myTeams && myTeams.length > 0 && loadingDecks);

  if (loadingTeams) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    );
  }

  if (!myTeams || myTeams.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">Join or create a team to see shared decks here.</p>
        <p className="mt-3 text-sm">
          <Link
            href="/teams"
            className="chrome-label-case text-xs text-primary underline-offset-4 hover:underline"
          >
            About teams
          </Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const isEmpty = !rows || rows.length === 0;

  return (
    <div>
      <div className="space-y-4">
        <div>
          <p className="chrome-label-case mb-2 text-xs text-muted-foreground">Collaboration</p>
          <SegmentedControl
            size="sm"
            aria-label="Collaboration"
            value={filter}
            onValueChange={(value) => setFilter(value as CollabFilter)}
            items={COLLAB_FILTER_ITEMS}
          />
        </div>
      </div>
      {isEmpty ? (
        <EmptyState
          role="status"
          className="mt-6"
          icon={Layers}
          title="No team-visible decks yet for this filter."
          description="Create a deck, set its visibility to team, and pick your team in the deck editor."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/decks">Open decks</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-surface">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Deck</TableHead>
                <TableHead className="min-w-[140px]">Team</TableHead>
                <TableHead className="min-w-[120px]">Mode</TableHead>
                <TableHead className="min-w-[140px]">Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => {
                const key = collabKey(d.teamCollaboration);
                const isOwn = viewerUserId != null && d.userId === viewerUserId;
                const deckName = display(d.name, isOwn);
                return (
                  <TableRow key={d._id}>
                    <TableCell>
                      <Link
                        href={`/decks/${d._id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {deckName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/teams/${d.teamId}/announcements`}
                        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {d.teamName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{COLLAB_LABEL[key] ?? key}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.ownerUsername?.trim() || "Player"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
