import type {
  DeckRuleCard,
  DeckRuleDeck,
  DeckValidationError,
  DeckValidationInput,
  DeckValidationOutcome,
  DeckValidationPlan,
  DeckValidationWarning,
} from "../../deck";
import {
  buildLegalityMap,
  checkSideboardRule,
  legalityApplies,
  positiveQuantityIds,
  strictestPrintingCopyLimit,
  sumQuantityValues,
} from "../../rules-common";
import { isCyberpunkLegendType, normalizeCyberpunkColor } from "../card-types";
import { CYBERPUNK_LEGEND_COUNT, normalizeCyberpunkSetup } from "../setup";

// Cyberpunk TCG deck construction (docs/games/cyberpunk.md "Rules we encode"). Error codes:
// WRONG_LEGEND_COUNT, LEGEND_NOT_FOUND, INVALID_LEGEND_TYPE, DUPLICATE_LEGEND_NAME,
// DECK_TOO_SMALL, DECK_TOO_LARGE, SIDEBOARD_TOO_LARGE / INVALID_SIDEBOARD_SIZE, LEGEND_IN_MAIN_DECK,
// MAIN_CARD_MISSING_TYPE, COLOR_NOT_PROVIDED, RAM_EXCEEDS_BUDGET, BANNED_CARD, EXCEEDS_COPY_LIMIT,
// EXCEEDS_RESTRICTED_LIMIT. Warning: LEGEND_MISSING_COLOR.

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Printings of one card share `oracleId`; without one, cards with the same name are grouped. */
export function cyberpunkCopyGroupKey(card: Pick<DeckRuleCard, "oracleId" | "name">): string {
  const oracle = card.oracleId?.trim();
  return oracle ? `oracle:${oracle}` : `name:${nameKey(card.name)}`;
}

/** Per-color RAM budget: the sum of the Legends' RAM of each color. */
export function cyberpunkRamBudget(legends: readonly Pick<DeckRuleCard, "color" | "ram">[]): Map<string, number> {
  const budget = new Map<string, number>();
  for (const legend of legends) {
    const color = normalizeCyberpunkColor(legend.color);
    if (!color) continue;
    const ram = typeof legend.ram === "number" && Number.isFinite(legend.ram) ? legend.ram : 0;
    budget.set(color, (budget.get(color) ?? 0) + ram);
  }
  return budget;
}

export function planCyberpunk(deck: DeckRuleDeck): DeckValidationPlan {
  const setup = normalizeCyberpunkSetup(deck);
  const mainIds = positiveQuantityIds(deck.mainQuantities);
  const sideIds = positiveQuantityIds(deck.sideQuantities);
  return {
    cardIds: [...new Set([...mainIds, ...sideIds])],
    setupCardIds: [...new Set(setup.legendIds)],
  };
}

interface CopyGroup<TCard extends DeckRuleCard> {
  qty: number;
  name: string;
  cards: TCard[];
  printingIds: TCard["_id"][];
}

export function validateCyberpunk<TCard extends DeckRuleCard>(
  input: DeckValidationInput<TCard>,
): DeckValidationOutcome<TCard["_id"]> {
  type TId = TCard["_id"];
  const { deck, format, now } = input;
  const cardMap = input.cards;
  const errors: DeckValidationError<TId>[] = [];
  const warnings: DeckValidationWarning<TId>[] = [];
  const setup = normalizeCyberpunkSetup(deck);

  // --- Legends -------------------------------------------------------------
  if (setup.legendIds.length !== CYBERPUNK_LEGEND_COUNT) {
    errors.push({
      code: "WRONG_LEGEND_COUNT",
      message: `A deck needs exactly ${CYBERPUNK_LEGEND_COUNT} Legends, has ${setup.legendIds.length}`,
    });
  }

  const legends: TCard[] = [];
  const seenLegendNames = new Set<string>();
  for (const legendId of setup.legendIds) {
    const legend = input.setupCards.get(legendId) ?? null;
    if (!legend) {
      errors.push({ code: "LEGEND_NOT_FOUND", message: "A selected Legend no longer exists" });
      continue;
    }
    if (!isCyberpunkLegendType(legend.type)) {
      errors.push({
        code: "INVALID_LEGEND_TYPE",
        message: `${legend.name} is not a Legend`,
        cardId: legend._id,
      });
      continue;
    }
    const key = nameKey(legend.name);
    if (seenLegendNames.has(key)) {
      errors.push({
        code: "DUPLICATE_LEGEND_NAME",
        message: `Legends must have different names (${legend.name} is chosen twice)`,
        cardId: legend._id,
      });
      continue;
    }
    seenLegendNames.add(key);
    legends.push(legend);
    if (!normalizeCyberpunkColor(legend.color)) {
      warnings.push({
        code: "LEGEND_MISSING_COLOR",
        message: `${legend.name} has no color, so it provides no RAM`,
        cardId: legend._id,
      });
    }
  }

  // --- Deck size / sideboard ---------------------------------------------------
  const mainCount = sumQuantityValues(deck.mainQuantities);
  if (mainCount < format.minDeckSize) {
    errors.push({
      code: "DECK_TOO_SMALL",
      message: `Main deck has ${mainCount} cards (excluding Legends), minimum is ${format.minDeckSize}`,
    });
  }
  if (format.maxDeckSize !== undefined && mainCount > format.maxDeckSize) {
    errors.push({
      code: "DECK_TOO_LARGE",
      message: `Main deck has ${mainCount} cards (excluding Legends), maximum is ${format.maxDeckSize}`,
    });
  }

  const sideCount = sumQuantityValues(deck.sideQuantities);
  errors.push(
    ...checkSideboardRule<TId>(sideCount, format, {
      exact: (exactSize, count) => `Sideboard must be exactly 0 or ${exactSize} cards, has ${count}`,
    }),
  );

  // --- Main deck cards: type, color/RAM ------------------------------------------
  const mainIds = positiveQuantityIds(deck.mainQuantities);
  const sideIds = positiveQuantityIds(deck.sideQuantities);
  const budget = cyberpunkRamBudget(legends);

  for (const cardIdStr of mainIds) {
    const card = cardMap.get(cardIdStr);
    if (!card) continue;
    if (isCyberpunkLegendType(card.type)) {
      errors.push({
        code: "LEGEND_IN_MAIN_DECK",
        message: `${card.name} is a Legend; Legends go in the Legends slots, not the main deck`,
        cardId: card._id,
        section: "main",
      });
      continue;
    }
    if (!card.type?.trim()) {
      errors.push({
        code: "MAIN_CARD_MISSING_TYPE",
        message: `${card.name} has no card type and cannot be in the main deck`,
        cardId: card._id,
        section: "main",
      });
    }
    const color = normalizeCyberpunkColor(card.color);
    if (!color) continue; // colorless: no RAM check
    const available = budget.get(color) ?? 0;
    const ram = typeof card.ram === "number" && Number.isFinite(card.ram) ? card.ram : 0;
    if (available <= 0) {
      errors.push({
        code: "COLOR_NOT_PROVIDED",
        message: `${card.name} is ${color}, but no Legend provides ${color} RAM`,
        cardId: card._id,
        section: "main",
      });
    } else if (ram > available) {
      errors.push({
        code: "RAM_EXCEEDS_BUDGET",
        message: `${card.name} needs ${ram} ${color} RAM, Legends provide ${available}`,
        cardId: card._id,
        section: "main",
      });
    }
  }

  // --- Legality: banned (per card), copy + restricted limits (per oracle/name group) ------------
  const legalityMap = buildLegalityMap(input.legality);
  for (const [ids, section] of [
    [mainIds, "main"],
    [sideIds, "side"],
  ] as const) {
    for (const cardIdStr of ids) {
      const card = cardMap.get(cardIdStr);
      if (!card) continue;
      const entry = legalityMap.get(cardIdStr);
      if (entry?.status === "banned" && legalityApplies(entry, now)) {
        errors.push({
          code: "BANNED_CARD",
          message: `${card.name} is banned in this format`,
          cardId: card._id,
          section,
        });
      }
    }
  }

  const groups = new Map<string, CopyGroup<TCard>>();
  for (const cardIdStr of mainIds) {
    const card = cardMap.get(cardIdStr);
    if (!card) continue;
    const qty = deck.mainQuantities[cardIdStr] ?? 0;
    const key = cyberpunkCopyGroupKey(card);
    const group = groups.get(key);
    if (group) {
      group.qty += qty;
      group.cards.push(card);
      group.printingIds.push(card._id);
    } else {
      groups.set(key, { qty, name: card.name, cards: [card], printingIds: [card._id] });
    }
  }

  for (const group of groups.values()) {
    const limit = strictestPrintingCopyLimit(group.cards, format);
    if (limit !== null && group.qty > limit) {
      errors.push({
        code: "EXCEEDS_COPY_LIMIT",
        message: `${group.name} has ${group.qty} copies, maximum is ${limit}`,
        cardId: group.printingIds[0],
        section: "main",
      });
    }

    let restrictedCap: number | null = null;
    for (const cid of group.printingIds) {
      const leg = legalityMap.get(cid.toString());
      if (leg?.status === "restricted" && legalityApplies(leg, now)) {
        const cap = leg.copyLimitOverride ?? 1;
        restrictedCap = restrictedCap === null ? cap : Math.min(restrictedCap, cap);
      }
    }
    if (restrictedCap !== null && group.qty > restrictedCap) {
      errors.push({
        code: "EXCEEDS_RESTRICTED_LIMIT",
        message: `${group.name} is restricted to ${restrictedCap} cop${restrictedCap === 1 ? "y" : "ies"}`,
        cardId: group.printingIds[0],
        section: "main",
      });
    }
  }

  // Banned Legends are illegal too.
  for (const legend of legends) {
    const entry = legalityMap.get(legend._id.toString());
    if (entry?.status === "banned" && legalityApplies(entry, now)) {
      errors.push({
        code: "BANNED_CARD",
        message: `${legend.name} is banned in this format`,
        cardId: legend._id,
      });
    }
  }

  return { errors, warnings };
}
