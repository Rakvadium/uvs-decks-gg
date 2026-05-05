import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { setDocValidator } from "./validators";
import { requireAdmin } from "./utils/validation";
import { countListCardsForSetCode, syncSetCardCountByCode } from "./setCardCountSync";

export const list = query({
  args: {},
  returns: v.array(setDocValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("sets")
      .collect();
  },
});

export const getByCode = query({
  args: {
    code: v.string(),
  },
  returns: v.union(setDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});

export const getById = query({
  args: {
    setId: v.id("sets"),
  },
  returns: v.union(setDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.setId);
  },
});

export const getMostRecent = query({
  args: {},
  returns: v.union(setDocValidator, v.null()),
  handler: async (ctx) => {
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_setNumber")
      .order("desc")
      .take(1);
    return sets[0] ?? null;
  },
});

export const listWithCardCountAudit = query({
  args: {},
  returns: v.array(
    v.object({
      set: setDocValidator,
      actualListCardCount: v.number(),
      mismatch: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const allSets = await ctx.db.query("sets").collect();
    const out: {
      set: (typeof allSets)[number];
      actualListCardCount: number;
      mismatch: boolean;
    }[] = [];
    for (const s of allSets) {
      const actualListCardCount = await countListCardsForSetCode(ctx, s.code);
      const mismatch =
        s.cardCount !== undefined && s.cardCount !== actualListCardCount;
      out.push({ set: s, actualListCardCount, mismatch });
    }
    return out;
  },
});

export const isSetCodeAvailable = query({
  args: { code: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const trimmed = args.code.trim();
    if (trimmed === "") {
      return true;
    }
    const existing = await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", trimmed))
      .unique();
    return existing === null;
  },
});

export const getSetCardCountAudit = query({
  args: { code: v.string() },
  returns: v.union(
    v.object({
      set: setDocValidator,
      actualListCardCount: v.number(),
      mismatch: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const set = await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!set) {
      return null;
    }
    const actualListCardCount = await countListCardsForSetCode(ctx, set.code);
    const stored = set.cardCount;
    const mismatch = stored !== undefined && stored !== actualListCardCount;
    return { set, actualListCardCount, mismatch };
  },
});

export const reconcileAllSetCardCounts = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const all = await ctx.db.query("sets").collect();
    for (const s of all) {
      await syncSetCardCountByCode(ctx, s.code);
    }
    return null;
  },
});
