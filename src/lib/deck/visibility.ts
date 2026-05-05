import type { Doc } from "../../../convex/_generated/dataModel";

export type DeckVisibility = NonNullable<Doc<"decks">["visibility"]>;

export function normalizeDeckVisibility(deck: Doc<"decks">): DeckVisibility {
  if (deck.visibility) return deck.visibility;
  return deck.isPublic ? "public" : "private";
}

export function isTeamEditableDeck(
  deck: Doc<"decks"> | null | undefined
): boolean {
  if (!deck) return false;
  return (
    normalizeDeckVisibility(deck) === "team" &&
    (deck.teamCollaboration ?? "team_viewable") === "team_editable"
  );
}

export function deckRevisionNumber(deck: Doc<"decks"> | null | undefined): number {
  return deck?.revision ?? 0;
}

export function isDeckWriteConflictError(e: unknown): boolean {
  const m =
    e !== null &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : "";
  return m.startsWith("CONFLICT");
}

export function deckVisibilityLabel(visibility: DeckVisibility): string {
  switch (visibility) {
    case "private":
      return "Private";
    case "share":
      return "Share";
    case "unlisted":
      return "Unlisted";
    case "public":
      return "Public";
    case "tournament":
      return "Tournament";
    case "team":
      return "Team";
  }
}
