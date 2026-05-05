"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

const COLLAB_LABEL: Record<string, string> = {
  team_viewable: "View only",
  team_editable: "Editable by team",
  none: "—",
};

type CollabFilter = "all" | "team_viewable" | "team_editable";

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
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-4 h-32 w-full animate-pulse rounded-md bg-muted/80" />
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
            className="font-mono text-xs uppercase tracking-wider text-primary underline-offset-4 hover:underline"
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
        <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-full max-w-sm animate-pulse rounded-md bg-muted/70" />
        <div className="h-32 w-full animate-pulse rounded-md bg-muted/80" />
      </div>
    );
  }

  const isEmpty = !rows || rows.length === 0;

  return (
    <div>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Collaboration</p>
          <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as CollabFilter)}>
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="team_viewable">View only</ToggleGroupItem>
            <ToggleGroupItem value="team_editable">Editable by team</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      {isEmpty ? (
        <div
          className="mt-6 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center"
          role="status"
        >
          <p className="text-sm text-muted-foreground">No team-visible decks yet for this filter.</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Create a deck, set its visibility to team, and pick your team in the deck editor.
          </p>
          <p className="mt-3 text-sm">
            <Link
              href="/decks"
              className="font-mono text-xs uppercase tracking-wider text-primary underline-offset-4 hover:underline"
            >
              Open decks
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border/60">
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
