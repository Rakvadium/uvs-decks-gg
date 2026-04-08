"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { BarChart3, Layers3, Sparkles, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCardData } from "@/lib/universus";
import { CardImageDisplay } from "@/components/universus/card-grid-item/image-display";

type ScopeType = "global" | "set_scope";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatScore(value: number) {
  return value.toFixed(3);
}

export function CommunityRankingsView() {
  const { cards } = useCardData();
  const setScopes = useQuery(api.communityRankings.listSetScopes, {});
  const [scopeType, setScopeType] = useState<ScopeType>("global");
  const [selectedSetScopeKey, setSelectedSetScopeKey] = useState("");

  useEffect(() => {
    if (scopeType !== "set_scope") {
      return;
    }

    if (!selectedSetScopeKey && setScopes && setScopes.length > 0) {
      setSelectedSetScopeKey(setScopes[0].scopeKey);
    }
  }, [scopeType, selectedSetScopeKey, setScopes]);

  const leaderboard = useQuery(api.communityRankings.getScopeLeaderboard, {
    scopeType,
    scopeKey: scopeType === "global" ? "global" : selectedSetScopeKey || "__missing__",
  });

  const cardMap = useMemo(() => new Map(cards.map((card) => [card._id.toString(), card])), [cards]);

  const scopeItems = [
    { value: "global", label: "Global" },
    { value: "set_scope", label: "Set Scope", badge: setScopes?.length || undefined },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.10),transparent_26%)]" />

      <div className="relative z-10 flex min-h-full flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="cyber">Community Rankings</Badge>
            <div>
              <h1 className="text-2xl font-display font-bold uppercase tracking-[0.18em]">Tier Statistics</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Aggregated community rankings based on the latest public ranked list per user and scope.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:min-w-[26rem]">
            <SegmentedControl
              value={scopeType}
              onValueChange={(value) => setScopeType(value as ScopeType)}
              items={scopeItems}
              size="sm"
            />

            {scopeType === "set_scope" ? (
              <Select value={selectedSetScopeKey} onValueChange={setSelectedSetScopeKey}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a set scope" />
                </SelectTrigger>
                <SelectContent>
                  {(setScopes ?? []).map((scope) => (
                    <SelectItem key={scope.scopeKey} value={scope.scopeKey}>
                      {scope.scopeLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        {!leaderboard ? (
          <Card className="border-dashed border-border/60 bg-card/65">
            <CardContent className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
              {scopeType === "set_scope"
                ? "No ranked set-scoped lists are available yet."
                : "No ranked global lists are available yet."}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/60 bg-card/75">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Contributors
                  </CardDescription>
                  <CardTitle>{leaderboard.contributorCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-border/60 bg-card/75">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Ranked Cards
                  </CardDescription>
                  <CardTitle>{leaderboard.rankedCardCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-border/60 bg-card/75">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-primary" />
                    Insufficient Data
                  </CardDescription>
                  <CardTitle>{leaderboard.insufficientCardCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-border/60 bg-card/75">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Generated Community Tier List</CardTitle>
                    <CardDescription>{leaderboard.scopeLabel}</CardDescription>
                  </div>
                  <Badge variant="outline">{leaderboard.lastComputedAt ? new Date(leaderboard.lastComputedAt).toLocaleString() : "Pending"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {leaderboard.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      borderColor: `${tier.color}55`,
                      backgroundColor: `${tier.color}10`,
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
                          {tier.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{tier.cardIds.length} cards</span>
                      </div>
                    </div>

                    {tier.cardIds.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                        {tier.cardIds.map((cardId) => {
                          const card = cardMap.get(cardId.toString());
                          if (!card) {
                            return null;
                          }

                          return (
                            <div key={cardId} className="space-y-2">
                              <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg border border-border/50">
                                <CardImageDisplay imageUrl={card.imageUrl} name={card.name} />
                              </div>
                              <p className="line-clamp-2 text-xs text-muted-foreground">{card.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/40 bg-background/20 px-4 py-5 text-sm text-muted-foreground">
                        No cards have landed in this community tier yet.
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/75">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <CardTitle>Ranked Card Leaderboard</CardTitle>
                    <CardDescription>
                      Adjusted score uses Bayesian smoothing with the shared ranking config.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Card</TableHead>
                      <TableHead className="text-right">Adjusted</TableHead>
                      <TableHead className="text-right">Raw Mean</TableHead>
                      <TableHead className="text-right">Votes</TableHead>
                      <TableHead className="text-right">Top Lane</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.rankedStats.map((entry, index) => {
                      const card = cardMap.get(entry.cardId.toString());
                      if (!card) {
                        return null;
                      }

                      return (
                        <TableRow key={entry.cardId}>
                          <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                            #{index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative h-14 w-10 overflow-hidden rounded-md border border-border/50">
                                <CardImageDisplay imageUrl={card.imageUrl} name={card.name} />
                              </div>
                              <div>
                                <p className="font-medium">{card.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {card.setCode ?? "Unknown set"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatScore(entry.adjustedScore)}</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {formatScore(entry.rawMeanScore)}
                          </TableCell>
                          <TableCell className="text-right font-mono">{entry.voteCount}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatPercent(entry.topLaneRate)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/75">
              <CardHeader>
                <CardTitle>Insufficient Data</CardTitle>
                <CardDescription>
                  These cards have been ranked, but not often enough to appear in the leaderboard yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.insufficientStats.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {leaderboard.insufficientStats.map((entry) => {
                      const card = cardMap.get(entry.cardId.toString());
                      if (!card) {
                        return null;
                      }

                      return (
                        <div key={entry.cardId} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3">
                          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-border/50">
                            <CardImageDisplay imageUrl={card.imageUrl} name={card.name} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{card.name}</p>
                            <p className="text-xs text-muted-foreground">{entry.voteCount} votes so far</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/40 bg-background/20 px-4 py-5 text-sm text-muted-foreground">
                    Every scored card in this scope has enough votes to be ranked.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
