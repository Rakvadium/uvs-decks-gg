import type { Doc, Id } from "../_generated/dataModel";
import { deckGameModule } from "./deckGame";
import { docGame } from "./gameScope";
import { legacyUvsSetupFields } from "../../shared/games/uvs/setup";
import type { DeckSetup } from "../../shared/games/deck";

export function duplicateDeckName(name: string): string {
  const trimmed = name.trim();
  return `${trimmed.length > 0 ? trimmed : "Deck"} (copy)`;
}

function cloneCardLayouts(
  layouts: Doc<"decks">["cardLayouts"],
): Doc<"decks">["cardLayouts"] {
  if (!layouts) {
    return undefined;
  }
  const next: NonNullable<Doc<"decks">["cardLayouts"]> = {};
  for (const [key, layout] of Object.entries(layouts)) {
    next[key] = {
      columns: layout.columns.map((column) => ({
        id: column.id,
        name: column.name,
        color: column.color,
        cardIds: [...column.cardIds],
      })),
      unassignedCardIds: [...layout.unassignedCardIds],
    };
  }
  return next;
}

function withLegacySetupFields<TCardId extends string, TSetup extends DeckSetup<TCardId>>(setup: TSetup) {
  return { setup, ...legacyUvsSetupFields<TCardId>(setup) };
}

export function buildDuplicatedDeckFields(source: Doc<"decks">) {
  return {
    name: duplicateDeckName(source.name),
    description: source.description,
    visibility: "private" as const,
    teamCollaboration: "none" as const,
    isPublic: false,
    format: source.format,
    subFormat: source.subFormat,
    // Normalized from `setup` or the legacy fields; legacy fields mirrored for the live frontend.
    ...withLegacySetupFields<Id<"cards">, DeckSetup<Id<"cards">>>(deckGameModule(source).deck.normalizeSetup(source)),
    imageCardId: source.imageCardId,
    mainCardIds: [...source.mainCardIds],
    mainQuantities: { ...source.mainQuantities },
    sideCardIds: [...source.sideCardIds],
    sideQuantities: { ...source.sideQuantities },
    referenceCardIds: [...source.referenceCardIds],
    referenceQuantities: { ...source.referenceQuantities },
    cardLayouts: cloneCardLayouts(source.cardLayouts),
    revision: 0,
    // Copies stay in the source deck's game.
    game: docGame(source),
  };
}
