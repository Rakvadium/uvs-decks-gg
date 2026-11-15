"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useCommunityRankingsModel } from "./hook";
import { useGameModule } from "@/games/game-context";

const TIER_PREVIEW_CARD_LIMIT = 10;

export function CommunityRankingsView() {
  const { CardImageDisplay } = useGameModule().ui;
  const {
    scopeType,
    leaderboard,
    cardMap,
  } = useCommunityRankingsModel();

  const [dialogTier, setDialogTier] = useState<{
    label: string;
    color: string;
    cardIds: Id<"cards">[];
    scopeLabel: string;
  } | null>(null);

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative z-10 flex min-h-full flex-col gap-4 py-2">
        <Card>
          {leaderboard ? (
            <CardHeader className="space-y-1">
              <Badge variant="outline" className="w-fit shrink-0 text-xs font-normal">
                {leaderboard.lastComputedAt ? new Date(leaderboard.lastComputedAt).toLocaleString() : "Pending"}
              </Badge>
            </CardHeader>
          ) : null}
          <CardContent>
            {!leaderboard ? (
              <EmptyState
                icon={Trophy}
                title={
                  scopeType === "set_scope"
                    ? "No ranked set-scoped lists are available yet."
                    : "No ranked global lists are available yet."
                }
              />
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
                          <Badge size="sm" variant="outline">
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
                            className="shrink-0 border-border/50 bg-background/50"
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
                        <EmptyState variant="inline" title="No cards have landed in this community tier yet." />
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
        <DialogContent size="xl" contentPadding="none" className="gap-0">
          {dialogTier ? (
            <>
              <DialogHeader className="px-6">
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
