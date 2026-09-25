import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  deckValidationRules,
  runGameDeckValidation,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from "./lib/deckFormatRules";
import { docGame } from "./lib/gameScope";
import type { QueryCtx } from "./_generated/server";
import type { GameId } from "../shared/games/types";

/** The deck's format within the deck's game. */
async function getDeckFormat(ctx: QueryCtx, formatKey: string, game: GameId) {
  return await ctx.db
    .query("formats")
    .withIndex("by_game_and_key", (q) => q.eq("game", game).eq("key", formatKey))
    .unique();
}

export type { ValidationResult, ValidationError, ValidationWarning };

const validationResultValidator = v.object({
  isValid: v.boolean(),
  errors: v.array(
    v.object({
      code: v.string(),
      message: v.string(),
      cardId: v.optional(v.id("cards")),
      section: v.optional(v.union(v.literal("main"), v.literal("side"))),
    }),
  ),
  warnings: v.array(
    v.object({
      code: v.string(),
      message: v.string(),
      cardId: v.optional(v.id("cards")),
    }),
  ),
});

export const validateDeck = query({
  args: {
    deckId: v.id("decks"),
  },
  returns: validationResultValidator,
  handler: async (ctx, args): Promise<ValidationResult> => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      return {
        isValid: false,
        errors: [{ code: "DECK_NOT_FOUND", message: "Deck not found" }],
        warnings: [],
      };
    }

    if (!deck.format) {
      return {
        isValid: true,
        errors: [],
        warnings: [{ code: "NO_FORMAT", message: "No format selected — validation skipped" }],
      };
    }

    const format = await getDeckFormat(ctx, deck.format, docGame(deck));

    if (!format) {
      return {
        isValid: false,
        errors: [{ code: "FORMAT_NOT_FOUND", message: `Format "${deck.format}" not found` }],
        warnings: [],
      };
    }

    const { errors, warnings } = await runGameDeckValidation(ctx, deckValidationRules(deck), deck, format);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },
});

export const getDeckValidationSummary = query({
  args: {
    deckId: v.id("decks"),
  },
  returns: v.object({
    isValid: v.boolean(),
    errorCount: v.number(),
    warningCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck || !deck.format) {
      return { isValid: true, errorCount: 0, warningCount: 0 };
    }

    const format = await getDeckFormat(ctx, deck.format, docGame(deck));

    if (!format) {
      return { isValid: false, errorCount: 1, warningCount: 0 };
    }

    const { errors, warnings } = await runGameDeckValidation(ctx, deckValidationRules(deck), deck, format);

    return {
      isValid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
    };
  },
});
