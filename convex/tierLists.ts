import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  tierListRankingScopeValidator,
  tierDefinitionValidator,
  tierListCommentStatusValidator,
  tierListCommentValidator,
  tierListItemValidator,
  tierListValidator,
  publicUserFromDocument,
  userValidator,
} from "./validators";
import { requireAuth, requireUserCanPostContent } from "./utils/validation";
import {
  COMMUNITY_TIER_RANKING,
  buildCanonicalRankedTiers,
  isCanonicalRankedTierDefinitions,
  isRankedTierScope,
  resolveRankingScopeKey,
  type CommunityTierRankingScope,
} from "../shared/app-config";
import { moderateCommentLocal } from "./lib/moderation/localCommentHeuristic";
import { isPublishTextModerationEnabled } from "./lib/moderation/textPublish";
import {
  normalizeTierListPoolScopes,
  TIER_LIST_POOL_ALL_TYPES,
} from "../shared/tier-list-pool";

const tierListSaveItemValidator = v.object({
  cardId: v.id("cards"),
  laneKey: v.string(),
  order: v.number(),
});

const tierListFeedEntryValidator = v.object({
  tierList: tierListValidator,
  author: v.union(userValidator, v.null()),
  likedByViewer: v.boolean(),
});

const tierListCommentWithAuthorValidator = v.object({
  comment: tierListCommentValidator,
  author: v.union(userValidator, v.null()),
});

const tierListEditableValidator = v.object({
  tierList: tierListValidator,
  items: v.array(tierListItemValidator),
});

const tierListDetailValidator = v.object({
  tierList: tierListValidator,
  author: v.union(userValidator, v.null()),
  items: v.array(tierListItemValidator),
  comments: v.array(tierListCommentWithAuthorValidator),
  likedByViewer: v.boolean(),
  canEdit: v.boolean(),
});

function sanitizeText(value: string | undefined, maxLength: number) {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function normalizeSetCodes(setCodes: string[]) {
  const deduped = new Set<string>();
  for (const code of setCodes) {
    const normalized = code.trim();
    if (normalized) {
      deduped.add(normalized);
    }
  }
  return Array.from(deduped);
}

function normalizeTiers(
  tiers: Array<{ id: string; label: string; color: string; order: number }>,
  rankingScope: CommunityTierRankingScope
) {
  if (isRankedTierScope(rankingScope)) {
    return buildCanonicalRankedTiers();
  }

  const seen = new Set<string>();
  return tiers
    .map((tier, index) => {
      const baseId = sanitizeText(tier.id, 48) ?? `tier-${index + 1}`;
      const id = seen.has(baseId) ? `${baseId}-${index + 1}` : baseId;
      seen.add(id);
      return {
        id,
        label: sanitizeText(tier.label, 32) ?? `Tier ${index + 1}`,
        color: sanitizeText(tier.color, 32) ?? "from-primary/25 to-primary/5",
        order: index,
      };
    })
    .slice(0, 12);
}

type RankingScopeRef = {
  scopeType: "global" | "set_scope";
  scopeKey: string;
};

function getEligibleRankingScopeRefs({
  isPublic,
  rankingScope,
  rankingScopeKey,
  selectedSetCodes,
  tiers,
}: {
  isPublic: boolean;
  rankingScope?: CommunityTierRankingScope;
  rankingScopeKey?: string;
  selectedSetCodes: string[];
  tiers: Array<{ id: string; label: string; color: string; order: number }>;
}) {
  const resolvedRankingScope = rankingScope ?? COMMUNITY_TIER_RANKING.scopes.unranked;

  if (!isPublic || !isRankedTierScope(resolvedRankingScope) || !isCanonicalRankedTierDefinitions(tiers)) {
    return [] as RankingScopeRef[];
  }

  if (resolvedRankingScope === COMMUNITY_TIER_RANKING.scopes.global) {
    return [
      {
        scopeType: "global" as const,
        scopeKey: COMMUNITY_TIER_RANKING.globalScopeKey,
      },
    ];
  }

  if (selectedSetCodes.length === 0 || !rankingScopeKey) {
    return [] as RankingScopeRef[];
  }

  return [
    {
      scopeType: "set_scope" as const,
      scopeKey: rankingScopeKey,
    },
  ];
}

async function recomputeAffectedRankingScopes(
  ctx: MutationCtx,
  scopes: RankingScopeRef[]
) {
  const deduped = new Map<string, RankingScopeRef>();
  for (const scope of scopes) {
    deduped.set(`${scope.scopeType}:${scope.scopeKey}`, scope);
  }

  for (const scope of deduped.values()) {
    await ctx.runMutation(internal.communityRankings.recomputeScope, scope);
  }
}

function normalizeItems(
  items: Array<{ cardId: Id<"cards">; laneKey: string; order: number }>,
  validLaneKeys: Set<string>
) {
  const seenCards = new Set<string>();
  const normalized: Array<{ cardId: Id<"cards">; laneKey: string; order: number }> = [];
  const orderedItems = [...items].sort((left, right) => left.order - right.order);

  for (const item of orderedItems) {
    const cardKey = item.cardId.toString();
    if (seenCards.has(cardKey)) {
      continue;
    }
    seenCards.add(cardKey);
    const laneKey = validLaneKeys.has(item.laneKey) ? item.laneKey : "pool";
    normalized.push({
      cardId: item.cardId,
      laneKey,
      order: normalized.filter((entry) => entry.laneKey === laneKey).length,
    });
  }

  return normalized;
}

async function getLikedState(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users"> | null,
  tierListId: Id<"tierLists">
) {
  if (!userId) {
    return false;
  }

  const existing = await ctx.db
    .query("tierListLikes")
    .withIndex("by_user_and_tierList", (q) => q.eq("userId", userId).eq("tierListId", tierListId))
    .unique();

  return existing !== null;
}

export const listPublicFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(tierListFeedEntryValidator),
  handler: async (ctx, args) => {
    const viewerId = await getAuthUserId(ctx);
    const limit = Math.min(Math.max(args.limit ?? 12, 1), 24);
    const tierLists = await ctx.db
      .query("tierLists")
      .withIndex("by_isPublic_and_updatedAt", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit);

    const feed: Array<{
      tierList: Doc<"tierLists">;
      author: ReturnType<typeof publicUserFromDocument> | null;
      likedByViewer: boolean;
    }> = [];
    for (const tierList of tierLists) {
      const authorDoc = await ctx.db.get(tierList.userId);
      const author = authorDoc ? publicUserFromDocument(authorDoc) : null;
      const likedByViewer = await getLikedState(ctx, viewerId, tierList._id);
      feed.push({
        tierList,
        author,
        likedByViewer,
      });
    }

    return feed;
  },
});

export const listMine = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(tierListValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 10, 1), 30);
    return await ctx.db
      .query("tierLists")
      .withIndex("by_user_and_updatedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getEditable = query({
  args: {
    tierListId: v.id("tierLists"),
  },
  returns: v.union(tierListEditableValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const tierList = await ctx.db.get(args.tierListId);
    if (!tierList || tierList.userId !== userId) {
      return null;
    }

    const items = await ctx.db
      .query("tierListItems")
      .withIndex("by_tierList", (q) => q.eq("tierListId", args.tierListId))
      .take(600);

    return {
      tierList,
      items,
    };
  },
});

export const getDetail = query({
  args: {
    tierListId: v.id("tierLists"),
  },
  returns: v.union(tierListDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const viewerId = await getAuthUserId(ctx);
    const tierList = await ctx.db.get(args.tierListId);

    if (!tierList) {
      return null;
    }

    const canEdit = viewerId === tierList.userId;
    if (!tierList.isPublic && !canEdit) {
      return null;
    }

    const [author, items, comments, likedByViewer] = await Promise.all([
      ctx.db.get(tierList.userId),
      ctx.db
        .query("tierListItems")
        .withIndex("by_tierList", (q) => q.eq("tierListId", args.tierListId))
        .take(600),
      ctx.db
        .query("tierListComments")
        .withIndex("by_tierList_and_status_and_createdAt", (q) =>
          q.eq("tierListId", args.tierListId).eq("status", "approved")
        )
        .order("desc")
        .take(50),
      getLikedState(ctx, viewerId, args.tierListId),
    ]);

    const commentsWithAuthors: Array<{
      comment: Doc<"tierListComments">;
      author: ReturnType<typeof publicUserFromDocument> | null;
    }> = [];
    for (const comment of comments) {
      const commentAuthorDoc = await ctx.db.get(comment.userId);
      const commentAuthor = commentAuthorDoc
        ? publicUserFromDocument(commentAuthorDoc)
        : null;
      commentsWithAuthors.push({
        comment,
        author: commentAuthor,
      });
    }

    const authorPublic = author
      ? publicUserFromDocument(author)
      : null;

    return {
      tierList,
      author: authorPublic,
      items,
      comments: commentsWithAuthors,
      likedByViewer,
      canEdit,
    };
  },
});

export const save = mutation({
  args: {
    tierListId: v.optional(v.id("tierLists")),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    rankingScope: tierListRankingScopeValidator,
    selectedSetCodes: v.array(v.string()),
    poolScopes: v.optional(
      v.array(
        v.object({
          setCode: v.string(),
          cardType: v.string(),
        })
      )
    ),
    tiers: v.array(tierDefinitionValidator),
    items: v.array(tierListSaveItemValidator),
  },
  returns: v.object({
    tierListId: v.id("tierLists"),
  }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireUserCanPostContent(ctx, userId);
    const normalizedTitle = sanitizeText(args.title, 80) ?? "Untitled Tier List";
    const normalizedDescription = sanitizeText(args.description, 280);
    const poolScopesFromRequest =
      args.poolScopes !== undefined
        ? normalizeTierListPoolScopes(args.poolScopes)
        : normalizeTierListPoolScopes(
            normalizeSetCodes(args.selectedSetCodes).map((setCode) => ({
              setCode,
              cardType: TIER_LIST_POOL_ALL_TYPES,
            }))
          );
    const normalizedSetCodes = normalizeSetCodes(poolScopesFromRequest.map((scope) => scope.setCode));
    const storedPoolScopes = poolScopesFromRequest.length > 0 ? poolScopesFromRequest : undefined;
    const normalizedRankingScopeKey = resolveRankingScopeKey(args.rankingScope, normalizedSetCodes);
    const normalizedTiers = normalizeTiers(args.tiers, args.rankingScope);

    if (normalizedTiers.length === 0) {
      throw new Error("At least one tier is required");
    }

    if (
      isRankedTierScope(args.rankingScope) &&
      normalizedTiers.length !== COMMUNITY_TIER_RANKING.rankedTierCount
    ) {
      throw new Error("Ranked tier lists must use the canonical S-F lanes");
    }

    const validLaneKeys = new Set<string>(["pool", ...normalizedTiers.map((tier) => tier.id)]);
    const normalizedItems = normalizeItems(args.items, validLaneKeys);
    const assignedItems = normalizedItems.filter((item) => item.laneKey !== "pool");
    const previewSource = assignedItems.length > 0 ? assignedItems : normalizedItems;
    const previewCardIds = previewSource.slice(0, 4).map((item) => item.cardId);
    const featuredCardId = previewCardIds[0];
    const updatedAt = Date.now();

    let tierListId = args.tierListId;
    let previousCommentCount = 0;
    let previousLikeCount = 0;
    let previousScopeRefs: RankingScopeRef[] = [];
    let previousExisting: Doc<"tierLists"> | null = null;

    if (tierListId) {
      const existing = await ctx.db.get(tierListId);
      if (!existing) {
        throw new Error("Tier list not found");
      }
      if (existing.userId !== userId) {
        throw new Error("Not authorized");
      }
      previousExisting = existing;
      previousCommentCount = existing.commentCount;
      previousLikeCount = existing.likeCount;
      previousScopeRefs = getEligibleRankingScopeRefs(existing);
    }

    if (!tierListId) {
      tierListId = await ctx.db.insert("tierLists", {
        userId,
        title: normalizedTitle,
        isPublic: args.isPublic,
        rankingScope: args.rankingScope,
        rankingScopeKey: normalizedRankingScopeKey,
        selectedSetCodes: normalizedSetCodes,
        poolScopes: storedPoolScopes,
        previewCardIds,
        tiers: normalizedTiers,
        itemCount: normalizedItems.length,
        tierCount: normalizedTiers.length,
        likeCount: 0,
        commentCount: 0,
        updatedAt,
        listModerationStatus: "approved",
        ...(normalizedDescription ? { description: normalizedDescription } : {}),
        ...(featuredCardId ? { featuredCardId } : {}),
      });
    } else {
      const existingTierListId = tierListId;
      const pe = previousExisting;
      if (!pe) {
        throw new Error("Tier list not found");
      }
      await ctx.db.replace(existingTierListId, {
        userId,
        title: normalizedTitle,
        isPublic: args.isPublic,
        rankingScope: args.rankingScope,
        rankingScopeKey: normalizedRankingScopeKey,
        selectedSetCodes: normalizedSetCodes,
        poolScopes: storedPoolScopes,
        previewCardIds,
        tiers: normalizedTiers,
        itemCount: normalizedItems.length,
        tierCount: normalizedTiers.length,
        likeCount: previousLikeCount,
        commentCount: previousCommentCount,
        updatedAt,
        listModerationStatus: pe.listModerationStatus ?? "approved",
        ...(normalizedDescription ? { description: normalizedDescription } : {}),
        ...(featuredCardId ? { featuredCardId } : {}),
      });

      for await (const row of ctx.db.query("tierListItems").withIndex("by_tierList", (q) => q.eq("tierListId", existingTierListId))) {
        await ctx.db.delete(row._id);
      }
    }

    const resolvedTierListId = tierListId;
    if (!resolvedTierListId) {
      throw new Error("Unable to resolve tier list");
    }

    for (const item of normalizedItems) {
      await ctx.db.insert("tierListItems", {
        tierListId: resolvedTierListId,
        cardId: item.cardId,
        laneKey: item.laneKey,
        order: item.order,
      });
    }

    const nextScopeRefs = getEligibleRankingScopeRefs({
      isPublic: args.isPublic,
      rankingScope: args.rankingScope,
      rankingScopeKey: normalizedRankingScopeKey,
      selectedSetCodes: normalizedSetCodes,
      tiers: normalizedTiers,
    });

    await recomputeAffectedRankingScopes(ctx, [...previousScopeRefs, ...nextScopeRefs]);

    return { tierListId: resolvedTierListId };
  },
});

export const toggleLike = mutation({
  args: {
    tierListId: v.id("tierLists"),
  },
  returns: v.object({
    liked: v.boolean(),
    likeCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireUserCanPostContent(ctx, userId);
    const tierList = await ctx.db.get(args.tierListId);

    if (!tierList) {
      throw new Error("Tier list not found");
    }

    if (!tierList.isPublic && tierList.userId !== userId) {
      throw new Error("Not authorized");
    }

    const existing = await ctx.db
      .query("tierListLikes")
      .withIndex("by_user_and_tierList", (q) => q.eq("userId", userId).eq("tierListId", args.tierListId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      const likeCount = Math.max(0, tierList.likeCount - 1);
      await ctx.db.patch(args.tierListId, {
        likeCount,
      });
      return {
        liked: false,
        likeCount,
      };
    }

    await ctx.db.insert("tierListLikes", {
      userId,
      tierListId: args.tierListId,
    });

    const likeCount = tierList.likeCount + 1;
    await ctx.db.patch(args.tierListId, {
      likeCount,
    });

    return {
      liked: true,
      likeCount,
    };
  },
});

async function handleAddTierListComment(
  ctx: MutationCtx,
  args: { tierListId: Id<"tierLists">; content: string }
): Promise<{
  status: "approved" | "pending" | "flagged" | "rejected";
  moderationReason?: string;
}> {
  const userId = await requireAuth(ctx);
  await requireUserCanPostContent(ctx, userId);
  const tierList = await ctx.db.get(args.tierListId);

  if (!tierList) {
    throw new Error("Tier list not found");
  }

  if (!tierList.isPublic && tierList.userId !== userId) {
    throw new Error("Not authorized");
  }

  const content = sanitizeText(args.content, 500);
  if (!content) {
    throw new Error("Comment cannot be empty");
  }

  if (tierList.isPublic && isPublishTextModerationEnabled()) {
    throw new Error(
      "Comments on public tier lists use api.publishTierListComment.submitTierListComment when publish-time text moderation is enabled in Convex."
    );
  }

  const moderation = moderateCommentLocal(content);
  return await ctx.runMutation(internal.tierListCommentInternal.insertTierListComment, {
    tierListId: args.tierListId,
    userId,
    content,
    status: moderation.status,
    ...(moderation.moderationReason ? { moderationReason: moderation.moderationReason } : {}),
  });
}

export const addComment = mutation({
  args: {
    tierListId: v.id("tierLists"),
    content: v.string(),
  },
  returns: v.object({
    status: tierListCommentStatusValidator,
    moderationReason: v.optional(v.string()),
  }),
  handler: handleAddTierListComment,
});

export const remove = mutation({
  args: {
    tierListId: v.id("tierLists"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireUserCanPostContent(ctx, userId);
    const tierList = await ctx.db.get(args.tierListId);

    if (!tierList) {
      throw new Error("Tier list not found");
    }

    if (tierList.userId !== userId) {
      throw new Error("Not authorized");
    }

    const previousScopeRefs = getEligibleRankingScopeRefs(tierList);

    for await (const item of ctx.db.query("tierListItems").withIndex("by_tierList", (q) => q.eq("tierListId", args.tierListId))) {
      await ctx.db.delete(item._id);
    }

    for await (const like of ctx.db.query("tierListLikes").withIndex("by_tierList", (q) => q.eq("tierListId", args.tierListId))) {
      await ctx.db.delete(like._id);
    }

    for await (const comment of ctx.db.query("tierListComments").withIndex("by_tierList", (q) => q.eq("tierListId", args.tierListId))) {
      await ctx.db.delete(comment._id);
    }

    await ctx.db.delete(args.tierListId);
    await recomputeAffectedRankingScopes(ctx, previousScopeRefs);
    return null;
  },
});
