import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

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

function isCharacterCardType(type: string | undefined): boolean {
  if (!type) return false;
  const t = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return t === "Character";
}

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
  card: Doc<"cards">,
  deck: Doc<"decks">,
  startingCharacter: Doc<"cards"> | null,
): boolean {
  const tokens = cardSymbolTokens(card.symbols);
  if (tokens.length === 0) return true;
  if (tokens.some(tokenIsInfinity)) return true;

  const identity = deck.selectedIdentity?.trim().toLowerCase();
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

function oracleGroupKey(card: Doc<"cards">): string {
  const o = card.oracleId?.trim();
  return o && o.length > 0 ? `oracle:${o}` : `id:${card._id}`;
}

function effectivePerCardCopyLimit(
  card: Doc<"cards">,
  format: Doc<"formats">,
): number | null {
  if (card.copyLimit === null) return null;
  return card.copyLimit ?? format.defaultCopyLimit;
}

function groupEffectiveCopyLimit(cards: Doc<"cards">[], format: Doc<"formats">): number | null {
  let unlimited = false;
  let minFinite = format.defaultCopyLimit;
  for (const card of cards) {
    const lim = effectivePerCardCopyLimit(card, format);
    if (lim === null) {
      unlimited = true;
      break;
    }
    minFinite = Math.min(minFinite, lim);
  }
  if (unlimited) return null;
  return minFinite;
}

type LegalityMap = Map<string, Doc<"cardLegality">>;

function legalityApplies(entry: Doc<"cardLegality">, now: number): boolean {
  return entry.effectiveDate === undefined || entry.effectiveDate <= now;
}

function buildMainOracleGroups(
  mainQuantities: Record<string, number>,
  cardMap: Map<string, Doc<"cards">>,
): Map<
  string,
  {
    qty: number;
    name: string;
    cards: Doc<"cards">[];
    printingIds: Id<"cards">[];
  }
> {
  const groups = new Map<
    string,
    {
      qty: number;
      name: string;
      cards: Doc<"cards">[];
      printingIds: Id<"cards">[];
    }
  >();
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

async function validateStandard(
  ctx: QueryCtx,
  deck: Doc<"decks">,
  format: Doc<"formats">,
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!deck.startingCharacterId) {
    errors.push({
      code: "NO_STARTING_CHARACTER",
      message: "Standard requires a starting character",
    });
  }

  const startingCharacter = deck.startingCharacterId
    ? await ctx.db.get(deck.startingCharacterId)
    : null;

  if (deck.startingCharacterId && startingCharacter && !isCharacterCardType(startingCharacter.type)) {
    errors.push({
      code: "INVALID_STARTING_CHARACTER_TYPE",
      message: "Starting character must be a Character card",
    });
  }

  if (!deck.selectedIdentity?.trim()) {
    errors.push({
      code: "NO_IDENTITY",
      message: "Standard requires a symbol selection",
    });
  }

  const starterStr = deck.startingCharacterId ? deck.startingCharacterId.toString() : "";
  let mainCount = Object.values(deck.mainQuantities).reduce((s, n) => s + n, 0);
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

  const sideCount = Object.values(deck.sideQuantities).reduce((s, n) => s + n, 0);
  if (format.sideboardRule.startsWith("exact:")) {
    const exactSize = parseInt(format.sideboardRule.split(":")[1] ?? "", 10);
    if (Number.isFinite(exactSize) && sideCount !== 0 && sideCount !== exactSize) {
      errors.push({
        code: "INVALID_SIDEBOARD_SIZE",
        message: `Sideboard must be exactly 0 or ${exactSize} cards, has ${sideCount}`,
      });
    }
  } else if (format.sideboardRule.startsWith("max:")) {
    const maxSize = parseInt(format.sideboardRule.split(":")[1] ?? "", 10);
    if (Number.isFinite(maxSize) && sideCount > maxSize) {
      errors.push({
        code: "SIDEBOARD_TOO_LARGE",
        message: `Sideboard has ${sideCount} cards, maximum is ${maxSize}`,
      });
    }
  }

  const mainIds = Object.keys(deck.mainQuantities).filter((id) => (deck.mainQuantities[id] ?? 0) > 0);
  const sideIds = Object.keys(deck.sideQuantities).filter((id) => (deck.sideQuantities[id] ?? 0) > 0);
  const allIdStr = [...new Set([...mainIds, ...sideIds])];

  const cards = await Promise.all(
    allIdStr.map((id) => ctx.db.get(id as Id<"cards">)),
  );
  const cardMap = new Map<string, Doc<"cards">>();
  for (const card of cards) {
    if (card) cardMap.set(card._id.toString(), card);
  }

  const now = Date.now();
  const legalityRows = await ctx.db
    .query("cardLegality")
    .withIndex("by_format", (q) => q.eq("formatKey", deck.format!))
    .collect();

  const legalityMap: LegalityMap = new Map();
  for (const row of legalityRows) {
    legalityMap.set(row.cardId.toString(), row);
  }

  for (const cardIdStr of mainIds) {
    const card = cardMap.get(cardIdStr);
    if (!card) continue;
    const entry = legalityMap.get(cardIdStr);
    if (entry?.status === "banned" && legalityApplies(entry, now)) {
      errors.push({
        code: "BANNED_CARD",
        message: `${card.name} is banned in this format`,
        cardId: card._id,
        section: "main",
      });
    }
  }

  for (const cardIdStr of sideIds) {
    const card = cardMap.get(cardIdStr);
    if (!card) continue;
    const entry = legalityMap.get(cardIdStr);
    if (entry?.status === "banned" && legalityApplies(entry, now)) {
      errors.push({
        code: "BANNED_CARD",
        message: `${card.name} is banned in this format`,
        cardId: card._id,
        section: "side",
      });
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
      if (
        leg?.status === "restricted" &&
        legalityApplies(leg, now)
      ) {
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

  if (deck.selectedIdentity?.trim()) {
    for (const cardIdStr of mainIds) {
      const card = cardMap.get(cardIdStr);
      if (!card) continue;
      if (!standardMainCardMatchesIdentity(card, deck, startingCharacter)) {
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

async function validateLegacy(
  ctx: QueryCtx,
  deck: Doc<"decks">,
  format: Doc<"formats">,
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const mainCount = Object.values(deck.mainQuantities).reduce((sum, count) => sum + count, 0);
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

  const sideCount = Object.values(deck.sideQuantities).reduce((sum, count) => sum + count, 0);
  if (format.sideboardRule.startsWith("exact:")) {
    const exactSize = parseInt(format.sideboardRule.split(":")[1] ?? "", 10);
    if (Number.isFinite(exactSize) && sideCount !== 0 && sideCount !== exactSize) {
      errors.push({
        code: "INVALID_SIDEBOARD_SIZE",
        message: `Sideboard must have exactly 0 or ${exactSize} cards, has ${sideCount}`,
      });
    }
  } else if (format.sideboardRule.startsWith("max:")) {
    const maxSize = parseInt(format.sideboardRule.split(":")[1] ?? "", 10);
    if (Number.isFinite(maxSize) && sideCount > maxSize) {
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
  const cards = await Promise.all(allCardIds.map((id) => ctx.db.get(id)));
  const cardMap = new Map<string, Doc<"cards">>();
  for (const card of cards) {
    if (card) cardMap.set(card._id.toString(), card);
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

  const cardLegalityEntries = await ctx.db
    .query("cardLegality")
    .withIndex("by_format", (q) => q.eq("formatKey", deck.format!))
    .collect();

  const legalityMap = new Map<string, Doc<"cardLegality">>();
  for (const entry of cardLegalityEntries) {
    legalityMap.set(entry.cardId.toString(), entry);
  }

  const now = Date.now();
  for (const [cardIdStr, totalCount] of Object.entries(combinedCounts)) {
    const legality = legalityMap.get(cardIdStr);
    if (
      legality?.status === "banned" &&
      (legality.effectiveDate === undefined || legality.effectiveDate <= now)
    ) {
      const card = cardMap.get(cardIdStr);
      errors.push({
        code: "BANNED_CARD",
        message: `${card?.name ?? "Unknown card"} is banned in this format`,
        cardId: card?._id,
      });
    } else if (
      legality?.status === "restricted" &&
      (legality.effectiveDate === undefined || legality.effectiveDate <= now)
    ) {
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

  if (deck.selectedIdentity) {
    for (const [cardIdStr, _count] of Object.entries(combinedCounts)) {
      const card = cardMap.get(cardIdStr);
      if (!card) continue;
      const cardIdentities = card.symbols ? card.symbols.split("|").map((s) => s.trim().toLowerCase()) : [];
      const hasMatchingIdentity =
        cardIdentities.includes(deck.selectedIdentity.toLowerCase()) ||
        cardIdentities.includes("infinity");
      if (!hasMatchingIdentity && cardIdentities.length > 0) {
        warnings.push({
          code: "IDENTITY_MISMATCH",
          message: `${card.name} does not match deck symbols "${deck.selectedIdentity}"`,
          cardId: card._id,
        });
      }
    }
  }

  return { errors, warnings };
}

export async function runDeckValidation(
  ctx: QueryCtx,
  deck: Doc<"decks">,
  format: Doc<"formats">,
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  if (format.key === "standard") {
    return validateStandard(ctx, deck, format);
  }
  return validateLegacy(ctx, deck, format);
}
