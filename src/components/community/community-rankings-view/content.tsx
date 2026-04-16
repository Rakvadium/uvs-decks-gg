"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { CardImageDisplay } from "@/components/universus/card-grid-item/image-display";
import type { Id } from "../../../../convex/_generated/dataModel";
import { COMMUNITY_TIER_RANKING } from "../../../../shared/app-config";
import { useOptionalCommunityTierListsPageContext } from "@/components/community/tier-lists/page-view/context";
import { useCommunityRankingsModel } from "./hook";
import type { CommunityRankingsViewProps, ScopeType } from "./types";

const TIER_PREVIEW_CARD_LIMIT = 10;

export function CommunityRankingsView({ embedded = false }: CommunityRankingsViewProps) {
  const tierListsPage = useOptionalCommunityTierListsPageContext();
  const {
    scopeType,
    setScopeType,
    selectedSetScopeKey,
    setSelectedSetScopeKey,
    leaderboard,
    cardMap,
    scopeItems,
    setScopes,
  } = useCommunityRankingsModel();

  const [dialogTier, setDialogTier] = useState<{
    label: string;
    color: string;
    cardIds: Id<"cards">[];
    scopeLabel: string;
  } | null>(null);

  const scopeControls = (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <SegmentedControl
        value={scopeType}
        onValueChange={(value) => setScopeType(value as ScopeType)}
        items={scopeItems}
        size="sm"
        className="w-fit max-w-full"
      />

      {scopeType === "set_scope" ? (
        <Select value={selectedSetScopeKey} onValueChange={setSelectedSetScopeKey}>
          <SelectTrigger className="w-full sm:w-[min(100%,18rem)]">
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
  );

  const scopeSubtitle =
    leaderboard?.scopeLabel ??
    (scopeType === "global"
      ? "Global rankings"
      : (setScopes ?? []).find((s) => s.scopeKey === selectedSetScopeKey)?.scopeLabel ?? "Set scope");

  return (
    <div className={cn("relative flex h-full flex-col overflow-y-auto", embedded && "overflow-visible")}>
      {!embedded ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.10),transparent_26%)]" />
      ) : null}

      <div className={cn("relative z-10 flex min-h-full flex-col gap-4", embedded ? "py-2" : "p-4 md:p-6")}>
        {scopeControls}

        <Card
          className={cn(
            "bg-card/75",
            leaderboard ? "border-border/60" : "border-dashed border-border/60",
          )}
        >
          <CardHeader className="space-y-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <CardTitle>Generated Community Tier List</CardTitle>
                {leaderboard ? (
                  <Badge variant="outline" className="shrink-0 text-xs font-normal">
                    {leaderboard.lastComputedAt ? new Date(leaderboard.lastComputedAt).toLocaleString() : "Pending"}
                  </Badge>
                ) : null}
              </div>
              <CardDescription>{scopeSubtitle}</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                This view combines each duelist&apos;s latest public ranked list for the selected scope and turns those
                votes into shared tier bands. When you publish a ranked list, it helps shape what everyone sees here. A
                card needs at least {COMMUNITY_TIER_RANKING.minimumVotesToRank} community rankings in that scope before
                it can appear here, so low-data picks stay out until there&apos;s enough signal.
              </p>
              {tierListsPage ? (
                <Button type="button" className="shrink-0" onClick={tierListsPage.handleOpenCreateDialog}>
                  Create your tier list
                </Button>
              ) : (
                <Button type="button" className="shrink-0" asChild>
                  <Link href="/community/tier-lists">Create your tier list</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!leaderboard ? (
              <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border/40 bg-background/20 px-4 py-8 text-center text-sm text-muted-foreground">
                {scopeType === "set_scope"
                  ? "No ranked set-scoped lists are available yet."
                  : "No ranked global lists are available yet."}
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.tiers.map((tier) => {
                  const previewIds = tier.cardIds.slice(0, TIER_PREVIEW_CARD_LIMIT);
                  const hasMore = tier.cardIds.length > TIER_PREVIEW_CARD_LIMIT;

                  return (
                    <div
                      key={tier.id}
                      className="rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: `${tier.color}55`,
                        backgroundColor: `${tier.color}10`,
                      }}
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
                            {tier.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {hasMore
                              ? `Showing ${TIER_PREVIEW_CARD_LIMIT} of ${tier.cardIds.length}`
                              : `${tier.cardIds.length} cards`}
                          </span>
                        </div>
                        {hasMore ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-border/60 bg-background/40"
                            onClick={() =>
                              setDialogTier({
                                label: tier.label,
                                color: tier.color,
                                cardIds: tier.cardIds,
                                scopeLabel: leaderboard.scopeLabel,
                              })
                            }
                          >
                            View full tier ({tier.cardIds.length} cards)
                          </Button>
                        ) : null}
                      </div>

                      {tier.cardIds.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                          {previewIds.map((cardId) => {
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogTier !== null} onOpenChange={(open) => !open && setDialogTier(null)}>
        <DialogContent size="xl" className="gap-0">
          {dialogTier ? (
            <>
              <DialogHeader className="px-6 pt-6">
                <DialogTitle style={{ color: dialogTier.color }}>{dialogTier.label} tier</DialogTitle>
                <DialogDescription>
                  {dialogTier.cardIds.length} cards in this community tier band for {dialogTier.scopeLabel}.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="px-6 pb-6">
                <div
                  className="rounded-2xl border px-4 py-4"
                  style={{
                    borderColor: `${dialogTier.color}55`,
                    backgroundColor: `${dialogTier.color}08`,
                  }}
                >
                  <div className="grid max-h-[min(60vh,520px)] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {dialogTier.cardIds.map((cardId) => {
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
                </div>
              </DialogBody>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
