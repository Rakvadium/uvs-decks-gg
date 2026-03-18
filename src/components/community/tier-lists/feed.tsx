"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Heart, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
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
import { cn } from "@/lib/utils";
import { useCardData } from "@/lib/universus";
import { CardImageDisplay } from "@/components/universus/card-grid-item/image-display";
import { buildCardMap } from "./shared";

interface TierListFeedProps {
  title: string;
  description: string;
  limit?: number;
  compact?: boolean;
  showBrowseLink?: boolean;
  className?: string;
}

export function TierListFeed({
  title,
  description,
  limit = 6,
  compact = false,
  showBrowseLink = true,
  className,
}: TierListFeedProps) {
  const feed = useQuery(api.tierLists.listPublicFeed, { limit });
  const isLoading = feed === undefined;

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-[0.18em]">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {showBrowseLink ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/community/tier-lists">Open Tier Lab</Link>
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className={cn("grid gap-4", compact ? "md:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-2")}>
          {Array.from({ length: compact ? 3 : 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="h-4 w-24 rounded bg-muted/60" />
                <div className="h-6 w-2/3 rounded bg-muted/50" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((__, cardIndex) => (
                    <div key={cardIndex} className="aspect-[2.5/3.5] rounded-lg bg-muted/40" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : feed && feed.length > 0 ? (
        <div className={cn("grid gap-4", compact ? "md:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-2")}>
          {feed.map((entry) => (
            <TierListFeedCard key={entry.tierList._id} compact={compact} {...entry} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <Sparkles className="h-6 w-6 text-primary" />
            <p className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">
              No public tier lists yet
            </p>
            <Button size="sm" asChild>
              <Link href="/community/tier-lists">Be the first to publish one</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function TierListFeedCard({
  tierList,
  author,
  likedByViewer,
  compact,
}: {
  tierList: Doc<"tierLists">;
  author: Doc<"users"> | null;
  likedByViewer: boolean;
  compact: boolean;
}) {
  const { isAuthenticated } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const toggleLike = useMutation(api.tierLists.toggleLike);
  const { cards } = useCardData();
  const cardMap = useMemo(() => buildCardMap(cards), [cards]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewCards = tierList.previewCardIds
    .map((cardId) => cardMap.get(cardId.toString()))
    .filter((card): card is NonNullable<typeof card> => Boolean(card))
    .slice(0, 4);

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
            <Badge variant="cyber">Tier List</Badge>
            <Badge variant="outline">{tierList.isPublic ? "Public" : "Private"}</Badge>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {tierList.itemCount} cards
          </span>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base leading-snug">{tierList.title}</CardTitle>
          <CardDescription>
            by {author?.username ?? author?.email ?? "Unknown duelist"}
          </CardDescription>
        </div>
        {tierList.description ? (
          <p className="text-sm text-muted-foreground">{tierList.description}</p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {previewCards.length > 0
            ? previewCards.map((card) => (
                <div key={card._id} className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg border border-border/50">
                  <CardImageDisplay imageUrl={card.imageUrl} name={card.name} />
                </div>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex aspect-[2.5/3.5] items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Slot
                </div>
              ))}
        </div>

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
