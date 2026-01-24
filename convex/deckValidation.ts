import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";

export interface ValidationError {
  code: string;
  message: string;
  cardId?: Id<"cards">;
  section?: "main" | "side";
}

export interface ValidationWarning {
  code: string;
  message: string;
  cardId?: Id<"cards">;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

const validationResultValidator = v.object({
  isValid: v.boolean(),
  errors: v.array(v.object({
    code: v.string(),
    message: v.string(),
    cardId: v.optional(v.id("cards")),
    section: v.optional(v.union(v.literal("main"), v.literal("side"))),
  })),
  warnings: v.array(v.object({
    code: v.string(),
    message: v.string(),
    cardId: v.optional(v.id("cards")),
  })),
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
        warnings: [{ code: "NO_FORMAT", message: "No format selected - validation skipped" }],
      };
    }

    const format = await ctx.db
      .query("formats")
      .withIndex("by_key", (q) => 
        q.eq("key", deck.format!)
      )
      .unique();

    if (!format) {
      return {
        isValid: false,
        errors: [{ code: "FORMAT_NOT_FOUND", message: `Format "${deck.format}" not found` }],
        warnings: [],
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const mainCount = Object.values(deck.mainQuantities).reduce((sum, count) => sum + count, 0);
    if (mainCount < format.minDeckSize) {
      errors.push({
        code: "DECK_TOO_SMALL",
        message: `Main deck has ${mainCount} cards, minimum is ${format.minDeckSize}`,
      });
    }

    if (format.maxDeckSize && mainCount > format.maxDeckSize) {
      errors.push({
        code: "DECK_TOO_LARGE",
        message: `Main deck has ${mainCount} cards, maximum is ${format.maxDeckSize}`,
      });
    }

    const sideCount = Object.values(deck.sideQuantities).reduce((sum, count) => sum + count, 0);
    if (format.sideboardRule.startsWith("exact:")) {
      const exactSize = parseInt(format.sideboardRule.split(":")[1], 10);
      if (sideCount !== 0 && sideCount !== exactSize) {
        errors.push({
          code: "INVALID_SIDEBOARD_SIZE",
          message: `Sideboard must have exactly 0 or ${exactSize} cards, has ${sideCount}`,
        });
      }
    } else if (format.sideboardRule.startsWith("max:")) {
      const maxSize = parseInt(format.sideboardRule.split(":")[1], 10);
      if (sideCount > maxSize) {
        errors.push({
          code: "SIDEBOARD_TOO_LARGE",
          message: `Sideboard has ${sideCount} cards, maximum is ${maxSize}`,
        });
      }
    }

    if (format.requiresStartingCharacter && !deck.startingCharacterId) {
      errors.push({
        code: "NO_STARTING_CHARACTER",
        message: "This format requires a starting character",
      });
    }

    if (format.requiresIdentity && !deck.selectedIdentity) {
      errors.push({
        code: "NO_IDENTITY",
        message: "This format requires a symbol selection",
      });
    }

    const allCardIds = [...deck.mainCardIds, ...deck.sideCardIds];
    const cards = await Promise.all(allCardIds.map(id => ctx.db.get(id)));
    const cardMap = new Map<string, Doc<"cards">>();
    for (const card of cards) {
      if (card) {
        cardMap.set(card._id.toString(), card);
      }
    }

    const combinedCounts: Record<string, number> = {};
    for (const [cardId, count] of Object.entries(deck.mainQuantities)) {
      combinedCounts[cardId] = (combinedCounts[cardId] ?? 0) + count;
    }
    for (const [cardId, count] of Object.entries(deck.sideQuantities)) {
      combinedCounts[cardId] = (combinedCounts[cardId] ?? 0) + count;
    }

    for (const [cardIdStr, totalCount] of Object.entries(combinedCounts)) {
      const card = cardMap.get(cardIdStr);
      if (!card) continue;

      const copyLimit = card.copyLimit ?? format.defaultCopyLimit;
      
      if (copyLimit !== null && totalCount > copyLimit) {
        errors.push({
          code: "EXCEEDS_COPY_LIMIT",
          message: `${card.name} has ${totalCount} copies, maximum is ${copyLimit}`,
          cardId: card._id,
        });
      }
    }

    const cardLegalityEntries = await ctx.db
      .query("cardLegality")
      .withIndex("by_format", (q) => 
        q.eq("formatKey", deck.format!)
      )
      .collect();

    const legalityMap = new Map<string, Doc<"cardLegality">>();
    for (const entry of cardLegalityEntries) {
      legalityMap.set(entry.cardId.toString(), entry);
    }

    for (const cardIdStr of Object.keys(combinedCounts)) {
      const legality = legalityMap.get(cardIdStr);
      if (legality?.status === "banned") {
        const card = cardMap.get(cardIdStr);
        errors.push({
          code: "BANNED_CARD",
          message: `${card?.name ?? "Unknown card"} is banned in this format`,
          cardId: card?._id,
        });
      } else if (legality?.status === "restricted") {
        const card = cardMap.get(cardIdStr);
        const count = combinedCounts[cardIdStr];
        const restrictedLimit = legality.copyLimitOverride ?? 1;
        if (count > restrictedLimit) {
          errors.push({
            code: "EXCEEDS_RESTRICTED_LIMIT",
            message: `${card?.name ?? "Unknown card"} is restricted to ${restrictedLimit} copy`,
            cardId: card?._id,
          });
        }
      }
    }

    if (deck.selectedIdentity) {
      for (const [cardIdStr, _count] of Object.entries(combinedCounts)) {
        const card = cardMap.get(cardIdStr);
        if (!card) continue;

        const cardIdentities = card.symbols ?? [];
        const hasMatchingIdentity = cardIdentities.includes(deck.selectedIdentity) || 
          cardIdentities.includes("Infinity");

        if (!hasMatchingIdentity && cardIdentities.length > 0) {
          warnings.push({
            code: "IDENTITY_MISMATCH",
            message: `${card.name} does not match deck symbols "${deck.selectedIdentity}"`,
            cardId: card._id,
          });
        }
      }
    }

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

    const format = await ctx.db
      .query("formats")
      .withIndex("by_key", (q) => 
        q.eq("key", deck.format!)
      )
      .unique();

    if (!format) {
      return { isValid: false, errorCount: 1, warningCount: 0 };
    }

    let errorCount = 0;
    let warningCount = 0;

    const mainCount = Object.values(deck.mainQuantities).reduce((sum, count) => sum + count, 0);
    if (mainCount < format.minDeckSize) errorCount++;
    if (format.maxDeckSize && mainCount > format.maxDeckSize) errorCount++;

    const sideCount = Object.values(deck.sideQuantities).reduce((sum, count) => sum + count, 0);
    if (format.sideboardRule.startsWith("exact:")) {
      const exactSize = parseInt(format.sideboardRule.split(":")[1], 10);
      if (sideCount !== 0 && sideCount !== exactSize) errorCount++;
    }

    if (format.requiresStartingCharacter && !deck.startingCharacterId) errorCount++;
    if (format.requiresIdentity && !deck.selectedIdentity) errorCount++;

    return {
      isValid: errorCount === 0,
      errorCount,
      warningCount,
    };
  },
});

