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
  groupEffectiveCopyLimit,
  isCharacterCardType,
  legalityApplies,
  positiveQuantityIds,
  sumQuantityValues,
} from "./common";

// UVS "standard" format: starting character + identity symbol, printings grouped by oracleId.

function cardSymbolTokens(symbols: string | undefined): string[] {
  if (!symbols) return [];
  return symbols
    .split(/[,|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function tokenIsInfinity(token: string): boolean {
  return token === "infinity";
}

function tokenIsAttuned(token: string): boolean {
  return token.startsWith("attuned:") || token.startsWith("attuned-");
}

function attunedBaseSymbol(token: string): string {
  return token.replace(/^attuned[:-]/i, "").trim().toLowerCase();
}

function standardMainCardMatchesIdentity(
  card: DeckRuleCard,
  selectedIdentity: string | undefined,
  startingCharacter: DeckRuleCard | null,
): boolean {
  const tokens = cardSymbolTokens(card.symbols);
  if (tokens.length === 0) return true;
  if (tokens.some(tokenIsInfinity)) return true;

  const identity = selectedIdentity?.trim().toLowerCase();
  if (!identity) return false;

  const normalTokens = tokens.filter((t) => !tokenIsInfinity(t) && !tokenIsAttuned(t));
  const attunedTokens = tokens.filter(tokenIsAttuned);

  const charSymbols = cardSymbolTokens(startingCharacter?.symbols);
  const attunedBases = attunedTokens.map(attunedBaseSymbol).filter(Boolean);
  const attunedOk =
    attunedBases.length === 0 || attunedBases.some((b) => charSymbols.includes(b));

  if (normalTokens.length === 0) {
    return attunedOk;
  }

  const normalOk = normalTokens.includes(identity);
  if (attunedTokens.length === 0) {
    return normalOk;
  }
  return normalOk && attunedOk;
}

function oracleGroupKey(card: DeckRuleCard): string {
  const o = card.oracleId?.trim();
  return o && o.length > 0 ? `oracle:${o}` : `id:${card._id}`;
}

interface OracleGroup<TCard extends DeckRuleCard> {
  qty: number;
  name: string;
  cards: TCard[];
  printingIds: TCard["_id"][];
}

function buildMainOracleGroups<TCard extends DeckRuleCard>(
  mainQuantities: Record<string, number>,
  cardMap: ReadonlyMap<string, TCard>,
): Map<string, OracleGroup<TCard>> {
  const groups = new Map<string, OracleGroup<TCard>>();
  for (const [cardIdStr, qty] of Object.entries(mainQuantities)) {
    if (qty <= 0) continue;
    const card = cardMap.get(cardIdStr);
    if (!card) continue;
    const key = oracleGroupKey(card);
    const existing = groups.get(key);
    if (existing) {
      existing.qty += qty;
      existing.cards.push(card);
      existing.printingIds.push(card._id);
    } else {
      groups.set(key, {
        qty,
        name: card.name,
        cards: [card],
        printingIds: [card._id],
      });
    }
  }
  return groups;
}

export function planStandard(deck: DeckRuleDeck): DeckValidationPlan {
  const setup = normalizeDeckSetup(deck);
  const mainIds = positiveQuantityIds(deck.mainQuantities);
  const sideIds = positiveQuantityIds(deck.sideQuantities);
  return {
    cardIds: [...new Set([...mainIds, ...sideIds])],
    setupCardIds: setup.startingCharacterId ? [setup.startingCharacterId] : [],
  };
}

export function validateStandard<TCard extends DeckRuleCard>(
  input: DeckValidationInput<TCard>,
): DeckValidationOutcome<TCard["_id"]> {
  type TId = TCard["_id"];
  const { deck, format, now } = input;
  const cardMap = input.cards;
  const errors: DeckValidationError<TId>[] = [];
  const warnings: DeckValidationWarning<TId>[] = [];
  const setup = normalizeDeckSetup(deck);

  if (!setup.startingCharacterId) {
    errors.push({
      code: "NO_STARTING_CHARACTER",
      message: "Standard requires a starting character",
    });
  }

  const startingCharacter = setup.startingCharacterId
    ? (input.setupCards.get(setup.startingCharacterId) ?? null)
    : null;

  if (setup.startingCharacterId && startingCharacter && !isCharacterCardType(startingCharacter.type)) {
    errors.push({
      code: "INVALID_STARTING_CHARACTER_TYPE",
      message: "Starting character must be a Character card",
    });
  }

  if (!setup.selectedIdentity?.trim()) {
    errors.push({
      code: "NO_IDENTITY",
      message: "Standard requires a symbol selection",
    });
  }

  const starterStr = setup.startingCharacterId ? setup.startingCharacterId.toString() : "";
  let mainCount = sumQuantityValues(deck.mainQuantities);
  if (starterStr && deck.mainQuantities[starterStr] !== undefined) {
    mainCount -= deck.mainQuantities[starterStr];
  }

  if (mainCount < format.minDeckSize) {
    errors.push({
      code: "DECK_TOO_SMALL",
      message: `Main deck has ${mainCount} cards (excluding starting character), minimum is ${format.minDeckSize}`,
    });
  }

  if (format.maxDeckSize !== undefined && mainCount > format.maxDeckSize) {
    errors.push({
      code: "DECK_TOO_LARGE",
      message: `Main deck has ${mainCount} cards (excluding starting character), maximum is ${format.maxDeckSize}`,
    });
  }

  const sideCount = sumQuantityValues(deck.sideQuantities);
  errors.push(
    ...checkSideboardRule<TId>(sideCount, format, {
      exact: (exactSize, count) => `Sideboard must be exactly 0 or ${exactSize} cards, has ${count}`,
    }),
  );

  const mainIds = positiveQuantityIds(deck.mainQuantities);
  const sideIds = positiveQuantityIds(deck.sideQuantities);
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

  const mainOracleGroups = buildMainOracleGroups(deck.mainQuantities, cardMap);
  for (const group of mainOracleGroups.values()) {
    const limit = groupEffectiveCopyLimit(group.cards, format);
    if (limit !== null && group.qty > limit) {
      errors.push({
        code: "EXCEEDS_COPY_LIMIT",
        message: `${group.name} has ${group.qty} copies in the main deck across printings, maximum is ${limit}`,
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
        message: `${group.name} is restricted to ${restrictedCap} cop${restrictedCap === 1 ? "y" : "ies"} in the main deck`,
        cardId: group.printingIds[0],
        section: "main",
      });
    }
  }

  if (setup.selectedIdentity?.trim()) {
    for (const cardIdStr of mainIds) {
      const card = cardMap.get(cardIdStr);
      if (!card) continue;
      if (!standardMainCardMatchesIdentity(card, setup.selectedIdentity, startingCharacter)) {
        errors.push({
          code: "IDENTITY_MISMATCH",
          message: `${card.name} does not match deck identity or attuned rules`,
          cardId: card._id,
          section: "main",
        });
      }
    }
  }

  for (const cardIdStr of mainIds) {
    if (starterStr && cardIdStr === starterStr) continue;
    const card = cardMap.get(cardIdStr);
    if (!card) continue;
    if (typeof card.difficulty !== "number" || typeof card.control !== "number") {
      errors.push({
        code: "MAIN_CARD_MISSING_STATS",
        message: `${card.name} must have difficulty and check (control) to be in the main deck`,
        cardId: card._id,
        section: "main",
      });
    }
  }

  return { errors, warnings };
}
