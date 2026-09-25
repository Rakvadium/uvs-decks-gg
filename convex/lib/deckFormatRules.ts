import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import type {
  DeckValidationError,
  DeckValidationWarning,
  GameDeckValidationRules,
} from "../../shared/games/deck";
import { deckGameModule } from "./deckGame";

// Game-specific rules live in `shared/games/<game>/rules`; this file only loads their data.

export type ValidationError = DeckValidationError<Id<"cards">>;
export type ValidationWarning = DeckValidationWarning<Id<"cards">>;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/** Game rules for a deck (decks without `game` are treated as the default game). */
export function deckValidationRules(deck: Doc<"decks">): GameDeckValidationRules {
  return deckGameModule(deck).deck.validation;
}

/** Loads the cards/legality a game's rules ask for, then runs them (pure). */
export async function runGameDeckValidation(
  ctx: QueryCtx,
  rules: GameDeckValidationRules,
  deck: Doc<"decks">,
  format: Doc<"formats">,
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const plan = rules.plan(deck, format);

  const setupCards = new Map<string, Doc<"cards"> | null>();
  for (const id of plan.setupCardIds) {
    setupCards.set(id, await ctx.db.get(id as Id<"cards">));
  }

  const loaded = await Promise.all(plan.cardIds.map((id) => ctx.db.get(id as Id<"cards">)));
  const cards = new Map<string, Doc<"cards">>();
  for (const card of loaded) {
    if (card) cards.set(card._id.toString(), card);
  }

  const legality = await ctx.db
    .query("cardLegality")
    .withIndex("by_format", (q) => q.eq("formatKey", deck.format!))
    .collect();

  return rules.validate({ deck, format, cards, setupCards, legality, now: Date.now() });
}

/** Validates a deck against its format using the deck's game rules. */
export async function runDeckValidation(
  ctx: QueryCtx,
  deck: Doc<"decks">,
  format: Doc<"formats">,
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  return runGameDeckValidation(ctx, deckValidationRules(deck), deck, format);
}
