import { query, internalMutation } from "./_generated/server";
import { v, type GenericValidator, type Infer, type ObjectType, type VObject } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import schema from "./schema";
import { setDocValidator } from "./validators";
import { requireAdmin } from "./utils/validation";
import { countListCardsForSetCode, syncSetCardCountByCode } from "./setCardCountSync";

/** `sets` columns only admins may see. `updatedBy` is the id of whoever last edited the set. */
export const PRIVATE_SET_FIELDS = ["updatedBy"] as const;

type PrivateSetField = (typeof PRIVATE_SET_FIELDS)[number];

/**
 * Public set shape for a `sets` table validator: every column except the private ones, plus system
 * fields. A new column is public without touching this file; only the fields above are removed.
 */
export function publicSetShape<Fields extends Record<PrivateSetField, GenericValidator>>(
  table: VObject<ObjectType<Fields>, Fields>
) {
  return table.omit(...PRIVATE_SET_FIELDS).extend({
    _id: v.id("sets"),
    _creationTime: v.number(),
  });
}

/** Strict `returns` validator for public set reads. */
export const publicSetValidator = publicSetShape(schema.tables.sets.validator);

export type PublicSet = Infer<typeof publicSetValidator>;

export function publicSetFromDocument(doc: Doc<"sets">): PublicSet {
  const publicDoc: Partial<Doc<"sets">> = { ...doc };
  for (const field of PRIVATE_SET_FIELDS) {
    delete publicDoc[field];
  }
  return publicDoc as PublicSet;
}

export const list = query({
  args: {},
  returns: v.array(publicSetValidator),
  handler: async (ctx) => {
    const sets = await ctx.db
      .query("sets")
      .collect();
    return sets.map(publicSetFromDocument);
  },
});

export const getByCode = query({
  args: {
    code: v.string(),
  },
  returns: v.union(publicSetValidator, v.null()),
  handler: async (ctx, args) => {
    const set = await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    return set ? publicSetFromDocument(set) : null;
  },
});

export const getById = query({
  args: {
    setId: v.id("sets"),
  },
  returns: v.union(publicSetValidator, v.null()),
  handler: async (ctx, args) => {
    const set = await ctx.db.get(args.setId);
    return set ? publicSetFromDocument(set) : null;
  },
});

export const getMostRecent = query({
  args: {},
  returns: v.union(publicSetValidator, v.null()),
  handler: async (ctx) => {
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_setNumber")
      .order("desc")
      .take(1);
    return sets[0] ? publicSetFromDocument(sets[0]) : null;
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
