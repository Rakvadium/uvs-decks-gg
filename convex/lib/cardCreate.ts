import type { Infer } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { cardInputValidator } from "../validators";
import { syncSetCardCountByCode } from "../setCardCountSync";

export type CardInput = Infer<typeof cardInputValidator>;

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
