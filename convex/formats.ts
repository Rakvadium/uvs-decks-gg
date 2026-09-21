import { query } from "./_generated/server";
import { v } from "convex/values";
import { formatValidator, cardLegalityValidator, setLegalityValidator } from "./validators";
import {
  STANDARD_FORMAT_KEY,
  buildRotationSnapshot,
  hasRotatedOutOfStandard,
} from "../shared/standard-rotation";

export const list = query({
  args: {},
  returns: v.array(formatValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("formats")
      .collect();
  },
});

export const getByKey = query({
  args: {
    key: v.string(),
  },
  returns: v.union(formatValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("formats")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

export const getDefault = query({
  args: {},
  returns: v.union(formatValidator, v.null()),
  handler: async (ctx) => {
    const formats = await ctx.db
      .query("formats")
      .collect();
    
    return formats.find(f => f.isDefault) ?? formats[0] ?? null;
  },
});

export const getCardLegalityByFormat = query({
  args: {
    formatKey: v.string(),
  },
  returns: v.array(cardLegalityValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cardLegality")
      .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
      .collect();
  },
});

export const getCardLegality = query({
  args: {
    cardId: v.id("cards"),
    formatKey: v.string(),
  },
  returns: v.union(cardLegalityValidator, v.null()),
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("cardLegality")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .collect();
    
    return entries.find(e => e.formatKey === args.formatKey) ?? null;
  },
});

export const getSetLegalityByFormat = query({
  args: {
    formatKey: v.string(),
  },
  returns: v.array(setLegalityValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("setLegality")
      .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
      .collect();
  },
});

export const isSetLegal = query({
  args: {
    formatKey: v.string(),
    setCode: v.string(),
    now: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (args.formatKey === STANDARD_FORMAT_KEY) {
      const sets = await ctx.db.query("sets").take(2000);
      const snapshot = buildRotationSnapshot(sets, args.now);
      const set = sets.find((row) => row.code === args.setCode);
      if (set && hasRotatedOutOfStandard(set, snapshot)) {
        return false;
      }
    }

    const entries = await ctx.db
      .query("setLegality")
      .withIndex("by_format_set", (q) =>
        q.eq("formatKey", args.formatKey).eq("setCode", args.setCode)
      )
      .take(1);

    const entry = entries[0];
    if (!entry) return true;

    if (entry.rotatesOutAt !== undefined && entry.rotatesOutAt < args.now) {
      return false;
    }

    return entry.isLegal;
  },
});
