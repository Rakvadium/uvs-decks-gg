"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
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
import { useTeamHub } from "./hook";

const COLLAB_LABEL: Record<string, string> = {
  team_viewable: "View only",
  team_editable: "Editable by team",
  none: "—",
};

type CollabFilter = "all" | "team_viewable" | "team_editable";

interface TeamHubDecksContentProps {
  teamId: string;
}

function collabKey(
  c: "none" | "team_viewable" | "team_editable" | undefined,
): "team_viewable" | "team_editable" {
  if (c === "team_editable") return "team_editable";
  return "team_viewable";
}

export function TeamHubDecksContent({ teamId }: TeamHubDecksContentProps) {
  const { display, viewerUserId } = useProfanityDisplayText();
  const id = teamId as Id<"teams">;
  const { notFound: teamGone } = useTeamHub(teamId);
  const [filter, setFilter] = useState<CollabFilter>("all");
  const data = useQuery(api.teams.teamDecks.listForHub, { teamId: id, collaboration: filter });

  if (teamGone) {
    return null;
  }

  if (data === undefined) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-md bg-muted/80" />
      </div>
    );
  }

  if (data === null) {
    return (
      <p className="text-sm text-muted-foreground">Team decks are not available for this session.</p>
    );
  }

  const { decks, canCreateTeamDeck } = data;
  const isEmpty = decks.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg font-semibold text-foreground">Team decks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Decks shared with this team. View-only means only the owner edits; editable mode allows team
          members with deck permissions to co-edit.
        </p>
      </div>
      <div>
        <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Collaboration
        </p>
        <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as CollabFilter)}>
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="team_viewable">View only</ToggleGroupItem>
          <ToggleGroupItem value="team_editable">Editable by team</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {isEmpty ? (
        <div
          className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center"
          role="status"
        >
          <p className="text-sm text-muted-foreground">
            No team-visible decks in this list yet{filter === "all" ? "" : " for this filter"}.
          </p>
          {canCreateTeamDeck ? (
            <p className="mt-3 text-sm">
              <Link
                href="/decks"
                className="font-mono text-xs uppercase tracking-wider text-primary underline-offset-4 hover:underline"
              >
                Open decks
              </Link>
              <span className="text-muted-foreground"> to create a deck and set its visibility to team.</span>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Deck</TableHead>
                <TableHead className="min-w-[120px]">Mode</TableHead>
                <TableHead className="min-w-[140px]">Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decks.map((d) => {
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
                    <TableCell className="text-sm text-muted-foreground">
                      {COLLAB_LABEL[key] ?? key}
                    </TableCell>
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
