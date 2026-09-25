import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  formatValidator,
  cardLegalityValidator,
  gameIdValidator,
  setLegalityValidator,
} from "./validators";
import {
  byCreationTime,
  findFormatByKey,
  isDocInGame,
  withResolvedGame,
} from "./lib/gameScope";

export const list = query({
  args: { game: v.optional(gameIdValidator) },
  returns: v.array(formatValidator),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    return await ctx.db
      .query("formats")
      .withIndex("by_game_and_key", (q) => q.eq("game", args.game))
      .collect()
      .then(byCreationTime);
  },
});

export const getByKey = query({
  args: {
    game: v.optional(gameIdValidator),
    key: v.string(),
  },
  returns: v.union(formatValidator, v.null()),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    return await findFormatByKey(ctx, args.game, args.key);
  },
});

export const getDefault = query({
  args: { game: v.optional(gameIdValidator) },
  returns: v.union(formatValidator, v.null()),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    const formats = await ctx.db
      .query("formats")
      .withIndex("by_game_and_key", (q) => q.eq("game", args.game))
      .collect()
      .then(byCreationTime);

    return formats.find(f => f.isDefault) ?? formats[0] ?? null;
  },
});

export const getCardLegalityByFormat = query({
  args: {
    game: v.optional(gameIdValidator),
    formatKey: v.string(),
  },
  returns: v.array(cardLegalityValidator),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    return await ctx.db
      .query("cardLegality")
      .withIndex("by_game_and_format", (q) =>
        q.eq("game", args.game).eq("formatKey", args.formatKey)
      )
      .collect();
  },
});

export const getCardLegality = query({
  args: {
    game: v.optional(gameIdValidator),
    cardId: v.id("cards"),
    formatKey: v.string(),
  },
  returns: v.union(cardLegalityValidator, v.null()),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    const entries = await ctx.db
      .query("cardLegality")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .collect();

    return (
      entries.find((e) => e.formatKey === args.formatKey && isDocInGame(e, args.game)) ?? null
    );
  },
});

export const getSetLegalityByFormat = query({
  args: {
    game: v.optional(gameIdValidator),
    formatKey: v.string(),
  },
  returns: v.array(setLegalityValidator),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    return await ctx.db
      .query("setLegality")
      .withIndex("by_game_and_format", (q) =>
        q.eq("game", args.game).eq("formatKey", args.formatKey)
      )
      .collect();
  },
});

export const isSetLegal = query({
  args: {
    game: v.optional(gameIdValidator),
    formatKey: v.string(),
    setCode: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, rawArgs) => {
    const args = withResolvedGame(rawArgs);
    const entry = await ctx.db
      .query("setLegality")
      .withIndex("by_game_and_format_set", (q) =>
        q.eq("game", args.game).eq("formatKey", args.formatKey).eq("setCode", args.setCode)
      )
      .first();
    if (!entry) return true;

    if (entry.rotatesOutAt && entry.rotatesOutAt < Date.now()) {
      return false;
    }

    return entry.isLegal;
  },
});
