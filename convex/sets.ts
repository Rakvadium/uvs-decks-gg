import { query } from "./_generated/server";
import { v } from "convex/values";
import { setDocValidator } from "./validators";

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
