"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Heart, Loader2, MessageCircle, MoveLeft, PencilLine } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";
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
import { Textarea } from "@/components/ui/textarea";
import { useCardData } from "@/lib/universus";
import { CardGridItem } from "@/components/universus";
import { CardNavigationProvider } from "@/components/universus/card-details/navigation-context";
import { buildCardMap, buildLaneMapFromItems, getBackCard, type BuilderTier, POOL_LANE_KEY } from "./shared";

function withAlpha(color: string, alpha: string) {
  if (color.startsWith("#") && color.length === 7) {
    return `${color}${alpha}`;
  }

  return color;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

export function CommunityTierListDetailView({ tierListId }: { tierListId: string }) {
  const detail = useQuery(api.tierLists.getDetail, { tierListId: tierListId as Id<"tierLists"> });
  const toggleLike = useMutation(api.tierLists.toggleLike);
  const addComment = useMutation(api.tierLists.addComment);
  const { isAuthenticated } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const { cards } = useCardData();
  const [commentContent, setCommentContent] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const cardMap = useMemo(() => buildCardMap(cards), [cards]);
  const selectedCards = useMemo(() => {
    if (!detail) {
      return [];
    }

    return detail.items
      .map((item) => cardMap.get(item.cardId.toString()))
      .filter((card): card is NonNullable<typeof card> => Boolean(card));
  }, [cardMap, detail]);

  if (detail === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Tier list unavailable</CardTitle>
            <CardDescription>
              This link is private, missing, or not visible to the current account.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/community/tier-lists">Return to tier lists</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const tiers: BuilderTier[] = detail.tierList.tiers.map((tier) => ({
    id: tier.id,
    label: tier.label,
    color: tier.color,
  }));
  const laneMap = buildLaneMapFromItems(
    detail.items.map((item) => ({
      cardId: item.cardId,
      laneKey: item.laneKey,
      order: item.order,
    })),
    tiers
  );

  const handleLike = async () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }

    if (isLiking) {
      return;
    }

    try {
      setIsLiking(true);
      await toggleLike({ tierListId: detail.tierList._id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update reaction";
      toast.error(message);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }

    if (!commentContent.trim() || isCommenting) {
      return;
    }

    try {
      setIsCommenting(true);
      const result = await addComment({
        tierListId: detail.tierList._id,
        content: commentContent,
      });
      if (result.status === "approved") {
        toast.success("Comment posted.");
      } else {
        toast.info(result.moderationReason ?? "Comment saved for review.");
      }
      setCommentContent("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to post comment";
      toast.error(message);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.12),transparent_30%)]" />

      <div className="relative z-10 space-y-8 p-6">
        <Card className="border-primary/20">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/community/tier-lists">
                    <MoveLeft className="h-4 w-4" />
                    Back
                  </Link>
                </Button>
                <Badge variant="cyber">Tier List</Badge>
                <Badge variant="outline">{detail.tierList.isPublic ? "Public" : "Private"}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={detail.likedByViewer ? "default" : "outline"} size="sm" onClick={handleLike} disabled={isLiking}>
                  {isLiking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                  {detail.tierList.likeCount}
                </Button>
                {detail.canEdit ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/community/tier-lists?edit=${detail.tierList._id}`}>
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-3xl">{detail.tierList.title}</CardTitle>
              <CardDescription>
                by {detail.author?.username ?? detail.author?.email ?? "Unknown duelist"} · {detail.tierList.itemCount} cards ·{" "}
                {detail.tierList.tierCount} tiers
              </CardDescription>
            </div>
            {detail.tierList.description ? (
              <p className="max-w-3xl text-sm text-muted-foreground">{detail.tierList.description}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {detail.tierList.selectedSetCodes.map((setCode) => (
                <Badge key={setCode} variant="outline">
                  {setCode}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-6 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
            <span>{formatDate(detail.tierList.updatedAt)}</span>
            <span>{detail.tierList.commentCount} comments</span>
            <span>{detail.tierList.likeCount} likes</span>
          </CardFooter>
        </Card>

        <CardNavigationProvider cards={selectedCards} getBackCard={(card) => getBackCard(cardMap, card)}>
          <section className="space-y-4">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: withAlpha(tier.color, "55"),
                  backgroundColor: withAlpha(tier.color, "10"),
                }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold uppercase tracking-[0.18em]"
                    style={{
                      borderColor: withAlpha(tier.color, "77"),
                      color: tier.color,
                    }}
                  >
                    {tier.label}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    {(laneMap[tier.id] ?? []).length} cards
                  </span>
                </div>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {(laneMap[tier.id] ?? []).map((cardId) => {
                    const card = cardMap.get(cardId.toString());
                    if (!card) {
                      return null;
                    }

                    return (
                      <div key={card._id} className="w-28 shrink-0 md:w-32">
                        <CardGridItem card={card} backCard={getBackCard(cardMap, card)} showDeckActions={false} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {(laneMap[POOL_LANE_KEY] ?? []).length > 0 ? (
              <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Unranked Pool</Badge>
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    {(laneMap[POOL_LANE_KEY] ?? []).length} cards
                  </span>
                </div>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {(laneMap[POOL_LANE_KEY] ?? []).map((cardId) => {
                    const card = cardMap.get(cardId.toString());
                    if (!card) {
                      return null;
                    }

                    return (
                      <div key={card._id} className="w-28 shrink-0 md:w-32">
                        <CardGridItem card={card} backCard={getBackCard(cardMap, card)} showDeckActions={false} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        </CardNavigationProvider>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add a Comment</CardTitle>
              <CardDescription>
                Comments are checked before going live. If a message trips moderation rules it is stored for review instead of
                being shown publicly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
                placeholder="Share why you agree, disagree, or what you'd change."
                className="min-h-32"
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleComment} disabled={isCommenting || !commentContent.trim()}>
                {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Post comment
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Discussion</CardTitle>
              <CardDescription>Visible comments that passed moderation and are attached to this shared tier list.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.comments.length > 0 ? (
                detail.comments.map(({ comment, author }) => (
                  <div key={comment._id} className="rounded-xl border border-border/50 bg-background/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{author?.username ?? author?.email ?? "Unknown duelist"}</p>
                        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">Approved</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/50 bg-background/30 p-6 text-sm text-muted-foreground">
                  No approved comments yet.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
