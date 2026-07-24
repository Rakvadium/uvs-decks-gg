import type { Infer } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { cardInputValidator } from "../validators";
import { syncSetCardCountByCode } from "../setCardCountSync";

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
  card: CardInput,
  now = Date.now()
): Promise<Id<"cards">> {
  const { searchName, searchText, searchAll } = deriveCardSearchFields({
    name: card.name,
    searchName: card.searchName,
    keywords: card.keywords,
    text: card.text,
    setName: card.setName,
    type: card.type,
    rarity: card.rarity,
  });

  const id = await ctx.db.insert("cards", {
    ...card,
    searchName,
    searchText,
    searchAll,
    contentRevisionAt: now,
  });
  await syncSetCardCountByCode(ctx, card.setCode);
  return id;
}
