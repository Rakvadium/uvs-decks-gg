"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation } from "convex/react";
import { Heart, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import type { CachedCard } from "@/lib/universus/card-store";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TierListPreviewGrid } from "../preview-grid";
import { getTierListScopeLabel } from "../utils";

interface TierListFeedCardProps {
  tierList: Doc<"tierLists">;
  author: Doc<"users"> | null;
  likedByViewer: boolean;
  compact: boolean;
  cardMap: Map<string, CachedCard>;
}

export function TierListFeedCard({
  tierList,
  author,
  likedByViewer,
  compact,
  cardMap,
}: TierListFeedCardProps) {
  const { isAuthenticated } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const toggleLike = useMutation(api.tierLists.toggleLike);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewCards = useMemo(
    () =>
      tierList.previewCardIds
        .map((cardId) => cardMap.get(cardId.toString()))
        .filter((card): card is CachedCard => Boolean(card))
        .slice(0, 4),
    [cardMap, tierList.previewCardIds]
  );

  const handleLike = async () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await toggleLike({ tierListId: tierList._id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update reaction";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="entity">Tier List</Badge>
            <Badge variant="outline">{tierList.isPublic ? "Public" : "Private"}</Badge>
            <Badge variant="outline">{getTierListScopeLabel(tierList.rankingScope)}</Badge>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {tierList.itemCount} cards
          </span>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base leading-snug">{tierList.title}</CardTitle>
          <CardDescription>by {author?.username ?? author?.email ?? "Unknown duelist"}</CardDescription>
        </div>
        {tierList.description ? <p className="text-sm text-muted-foreground">{tierList.description}</p> : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <TierListPreviewGrid cards={previewCards} emptyLabel="Slot" />

        <div className="flex flex-wrap gap-2">
          {tierList.tiers.slice(0, compact ? 3 : 5).map((tier) => (
            <span
              key={tier.id}
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em]"
              style={{
                borderColor: `${tier.color}66`,
                backgroundColor: `${tier.color}14`,
                color: tier.color,
              }}
            >
              {tier.label}
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={likedByViewer ? "default" : "outline"}
            size="sm"
            onClick={handleLike}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
            {tierList.likeCount}
          </Button>
          <span className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" />
            {tierList.commentCount}
          </span>
        </div>

        <Button variant="ghost" size="sm" asChild>
          <Link href={`/community/tier-lists/${tierList._id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
