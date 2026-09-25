import type { Infer } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { cardInputValidator } from "../validators";
import { syncSetCardCountByCode } from "../setCardCountSync";
import { normalizeAbilityText } from "./normalizeAbilityText";
import type { GameId } from "../../shared/games/types";

export type CardInput = Infer<typeof cardInputValidator>;

const CARD_INPUT_KEYS = [
  "oracleId",
  "name",
  "imageUrl",
  "backCardId",
  "frontCardId",
  "isFrontFace",
  "isVariant",
  "setCode",
  "setName",
  "setNumber",
  "collectorNumber",
  "rarity",
  "type",
  "difficulty",
  "control",
  "speed",
  "damage",
  "blockModifier",
  "handSize",
  "health",
  "stamina",
  "attackZone",
  "blockZone",
  "text",
  "keywords",
  "symbols",
  "searchName",
  "searchText",
  "searchAll",
  "copyLimit",
  "legality",
  "revealedAt",
  "isRevealHidden",
] as const;

export function sanitizeCardImportInput(raw: unknown): CardInput | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (typeof source.name !== "string" || source.name.length === 0) {
    return null;
  }
  const out: Record<string, unknown> = { name: source.name };
  if (typeof source.abilities === "string" && source.text === undefined) {
    out.text = source.abilities;
  }
  for (const key of CARD_INPUT_KEYS) {
    if (key === "name") continue;
    const value = source[key];
    if (value !== undefined && value !== null) {
      out[key] = value;
    }
  }
  if (typeof out.text === "string") {
    const normalized = normalizeAbilityText(out.text);
    if (normalized) out.text = normalized;
    else delete out.text;
  }
  return out as CardInput;
}

export function sanitizeCardImportList(raw: unknown[]): CardInput[] {
  return raw
    .map(sanitizeCardImportInput)
    .filter((card): card is CardInput => card !== null);
}

export function deriveCardSearchFields(card: {
  name: string;
  searchName?: string;
  keywords?: string;
  text?: string;
  setName?: string;
  type?: string;
  rarity?: string;
}) {
  const searchName = card.searchName ?? card.name;
  const searchText = [card.name, card.keywords ?? "", card.text ?? ""].join(" ");
  const searchAll = [
    searchName,
    searchText,
    card.setName ?? "",
    card.type ?? "",
    card.rarity ?? "",
  ].join(" ");
  return { searchName, searchText, searchAll };
}

export async function createCardWithDerivedFields(
  ctx: MutationCtx,
  game: GameId,
  card: CardInput,
  now = Date.now()
): Promise<Id<"cards">> {
  const text = typeof card.text === "string" ? normalizeAbilityText(card.text) || undefined : card.text;
  const normalizedCard = { ...card, text };
  const { searchName, searchText, searchAll } = deriveCardSearchFields({
    name: normalizedCard.name,
    searchName: normalizedCard.searchName,
    keywords: normalizedCard.keywords,
    text: normalizedCard.text,
    setName: normalizedCard.setName,
    type: normalizedCard.type,
    rarity: normalizedCard.rarity,
  });

  const id = await ctx.db.insert("cards", {
    ...normalizedCard,
    searchName,
    searchText,
    searchAll,
    contentRevisionAt: now,
    game,
  });
  await syncSetCardCountByCode(ctx, game, card.setCode);
  return id;
}
