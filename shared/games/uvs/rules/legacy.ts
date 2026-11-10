import type {
  DeckRuleCard,
  DeckRuleDeck,
  DeckValidationError,
  DeckValidationInput,
  DeckValidationOutcome,
  DeckValidationPlan,
  DeckValidationWarning,
} from "../../deck";
import { normalizeDeckSetup } from "../setup";
import {
  buildLegalityMap,
  checkSideboardRule,
  effectivePerCardCopyLimit,
  legalityApplies,
  sumQuantityValues,
} from "./common";

// Every non-"standard" format: per-printing copy limits over main + side, identity is a warning.

export function planLegacy(deck: DeckRuleDeck): DeckValidationPlan {
  // Cards come from mainCardIds/sideCardIds (not quantity keys); the starter is not loaded.
  return { cardIds: [...deck.mainCardIds, ...deck.sideCardIds], setupCardIds: [] };
}

export function validateLegacy<TCard extends DeckRuleCard>(
  input: DeckValidationInput<TCard>,
): DeckValidationOutcome<TCard["_id"]> {
  type TId = TCard["_id"];
  const { deck, format, now } = input;
  const cardMap = input.cards;
  const errors: DeckValidationError<TId>[] = [];
  const warnings: DeckValidationWarning<TId>[] = [];
  const setup = normalizeDeckSetup(deck);

  const mainCount = sumQuantityValues(deck.mainQuantities);
  if (mainCount < format.minDeckSize) {
    errors.push({
      code: "DECK_TOO_SMALL",
      message: `Main deck has ${mainCount} cards, minimum is ${format.minDeckSize}`,
    });
  }

  if (format.maxDeckSize !== undefined && mainCount > format.maxDeckSize) {
    errors.push({
      code: "DECK_TOO_LARGE",
      message: `Main deck has ${mainCount} cards, maximum is ${format.maxDeckSize}`,
    });
  }

  const sideCount = sumQuantityValues(deck.sideQuantities);
  errors.push(
    ...checkSideboardRule<TId>(sideCount, format, {
      exact: (exactSize, count) => `Sideboard must have exactly 0 or ${exactSize} cards, has ${count}`,
    }),
  );

  if (format.requiresStartingCharacter && !setup.startingCharacterId) {
    errors.push({
      code: "NO_STARTING_CHARACTER",
      message: "This format requires a starting character",
    });
  }

  if (format.requiresIdentity && !setup.selectedIdentity) {
    errors.push({
      code: "NO_IDENTITY",
      message: "This format requires a symbol selection",
    });
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
    const copyLimit = effectivePerCardCopyLimit(card, format);
    if (copyLimit !== null && totalCount > copyLimit) {
      errors.push({
        code: "EXCEEDS_COPY_LIMIT",
        message: `${card.name} has ${totalCount} copies, maximum is ${copyLimit}`,
        cardId: card._id,
      });
    }
  }

  const legalityMap = buildLegalityMap(input.legality);
  for (const [cardIdStr, totalCount] of Object.entries(combinedCounts)) {
    const legality = legalityMap.get(cardIdStr);
    if (legality?.status === "banned" && legalityApplies(legality, now)) {
      const card = cardMap.get(cardIdStr);
      errors.push({
        code: "BANNED_CARD",
        message: `${card?.name ?? "Unknown card"} is banned in this format`,
        cardId: card?._id,
      });
    } else if (legality?.status === "restricted" && legalityApplies(legality, now)) {
      const card = cardMap.get(cardIdStr);
      const restrictedLimit = legality.copyLimitOverride ?? 1;
      if (totalCount > restrictedLimit) {
        errors.push({
          code: "EXCEEDS_RESTRICTED_LIMIT",
          message: `${card?.name ?? "Unknown card"} is restricted to ${restrictedLimit} cop${restrictedLimit === 1 ? "y" : "ies"}`,
          cardId: card?._id,
        });
      }
    }
  }

  const identity = setup.selectedIdentity;
  if (identity) {
    for (const cardIdStr of Object.keys(combinedCounts)) {
      const card = cardMap.get(cardIdStr);
      if (!card) continue;
      const cardIdentities = card.symbols ? card.symbols.split("|").map((s) => s.trim().toLowerCase()) : [];
      const hasMatchingIdentity =
        cardIdentities.includes(identity.toLowerCase()) || cardIdentities.includes("infinity");
      if (!hasMatchingIdentity && cardIdentities.length > 0) {
        warnings.push({
          code: "IDENTITY_MISMATCH",
          message: `${card.name} does not match deck symbols "${identity}"`,
          cardId: card._id,
        });
      }
    }
  }

  return { errors, warnings };
}
