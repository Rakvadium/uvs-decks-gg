import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { GameId } from "../../shared/games/types";

export const CARD_TEXT_HISTORY_SOURCES = ["admin_edit", "import", "printed"] as const;
export type CardTextHistorySource = (typeof CARD_TEXT_HISTORY_SOURCES)[number];

function normalizeComparableText(text: string | undefined): string {
  return (text ?? "").trim();
}

export async function recordCardTextHistoryIfChanged(
  ctx: MutationCtx,
  args: {
    cardId: Id<"cards">;
    /** The card's game (`docGame(card)`); copied onto the history row. */
    game: GameId;
    previousText: string | undefined;
    nextText: string | undefined;
    source: CardTextHistorySource;
    now?: number;
  }
): Promise<boolean> {
  const previous = normalizeComparableText(args.previousText);
  const next = normalizeComparableText(args.nextText);
  if (!previous || previous === next) {
    return false;
  }

  await ctx.db.insert("cardTextHistory", {
    cardId: args.cardId,
    text: args.previousText ?? previous,
    recordedAt: args.now ?? Date.now(),
    source: args.source,
    game: args.game,
  });
  return true;
}
