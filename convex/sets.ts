import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { gameIdValidator, setDocValidator } from "./validators";
import { requireAdmin } from "./utils/validation";
import { countListCardsForSetCode, syncSetCardCountByCode } from "./setCardCountSync";
import { DEFAULT_GAME_ID } from "../shared/games/types";
import {
  byCreationTime,
  findSetByCode,
  isDocInGame,
  withResolvedGame,
} from "./lib/gameScope";

export const list = query({
  args: { game: v.optional(gameIdValidator) },
  returns: v.array(setDocValidator),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    return await ctx.db
      .query("sets")
      .withIndex("by_game_and_code", (q) => q.eq("game", args.game))
      .collect()
      .then(byCreationTime);
  },
});

export const getByCode = query({
  args: {
    game: v.optional(gameIdValidator),
    code: v.string(),
  },
  returns: v.union(setDocValidator, v.null()),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    return await findSetByCode(ctx, args.game, args.code);
  },
});

export const getById = query({
  args: {
    game: v.optional(gameIdValidator),
    setId: v.id("sets"),
  },
  returns: v.union(setDocValidator, v.null()),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    const set = await ctx.db.get(args.setId);
    return isDocInGame(set, args.game) ? set : null;
  },
});

export const getMostRecent = query({
  args: { game: v.optional(gameIdValidator) },
  returns: v.union(setDocValidator, v.null()),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_game_and_setNumber", (q) => q.eq("game", args.game))
      .order("desc")
      .take(1);
    return sets[0] ?? null;
  },
});

export const listWithCardCountAudit = query({
  args: { game: v.optional(gameIdValidator) },
  returns: v.array(
    v.object({
      set: setDocValidator,
      actualListCardCount: v.number(),
      mismatch: v.boolean(),
    })
  ),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    await requireAdmin(ctx);
    const allSets = await ctx.db
      .query("sets")
      .withIndex("by_game_and_code", (q) => q.eq("game", args.game))
      .collect()
      .then(byCreationTime);
    const out: {
      set: (typeof allSets)[number];
      actualListCardCount: number;
      mismatch: boolean;
    }[] = [];
    for (const s of allSets) {
      const actualListCardCount = await countListCardsForSetCode(ctx, args.game, s.code);
      const mismatch =
        s.cardCount !== undefined && s.cardCount !== actualListCardCount;
      out.push({ set: s, actualListCardCount, mismatch });
    }
    return out;
  },
});

export const isSetCodeAvailable = query({
  args: { game: v.optional(gameIdValidator), code: v.string() },
  returns: v.boolean(),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    await requireAdmin(ctx);
    const trimmed = args.code.trim();
    if (trimmed === "") {
      return true;
    }
    const existing = await findSetByCode(ctx, args.game, trimmed);
    return existing === null;
  },
});

export const getSetCardCountAudit = query({
  args: { game: v.optional(gameIdValidator), code: v.string() },
  returns: v.union(
    v.object({
      set: setDocValidator,
      actualListCardCount: v.number(),
      mismatch: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    await requireAdmin(ctx);
    const set = await findSetByCode(ctx, args.game, args.code);
    if (!set) {
      return null;
    }
    const actualListCardCount = await countListCardsForSetCode(ctx, args.game, set.code);
    const stored = set.cardCount;
    const mismatch = stored !== undefined && stored !== actualListCardCount;
    return { set, actualListCardCount, mismatch };
  },
});

export const reconcileAllSetCardCounts = internalMutation({
  args: { game: v.optional(gameIdValidator) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = args.game ?? DEFAULT_GAME_ID;
    const all = await ctx.db
      .query("sets")
      .withIndex("by_game_and_code", (q) => q.eq("game", game))
      .collect();
    for (const s of all) {
      await syncSetCardCountByCode(ctx, game, s.code);
    }
    return null;
  },
});
