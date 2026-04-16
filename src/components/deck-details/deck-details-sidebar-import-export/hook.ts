import { useCallback, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatUniversusCardType } from "@/config/universus";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import {
  SIDEBAR_SIDEBOARD_LIMIT,
  UVS_MAIN_TYPE_ORDER,
  buildCardNameIndex,
  findCardByName,
  formatUvsUltraDeckExport,
  incrementCount,
  parseUvsUltraDeck,
  sumLineEntries,
  sumQuantities,
  type UvsUltraDeckLine,
} from "../uvs-import-export";

export function useImportExportSidebarModel() {
  const context = useDeckDetailsOptional();
  const { cards } = useCardData();
  const addCardMutation = useMutation(api.decks.addCard);
  const removeCardMutation = useMutation(api.decks.removeCard);
  const updateDeckMutation = useMutation(api.decks.update);

  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [lastImportMessage, setLastImportMessage] = useState<string | null>(null);

  const deck = context?.deck ?? null;
  const cardMap = useCardIdMap(cards);
  const cardNameIndex = useMemo(() => buildCardNameIndex(cards), [cards]);

  const exportMainEntries = useMemo(() => {
    if (!deck) return [] as UvsUltraDeckLine[];

    const entries: UvsUltraDeckLine[] = [];

    for (const [cardId, quantity] of Object.entries(deck.mainQuantities)) {
      if (quantity <= 0) continue;

      const card = cardMap.get(cardId);
      if (!card) continue;

      const type = formatUniversusCardType(card.type) ?? card.type ?? "Other";
      if (!UVS_MAIN_TYPE_ORDER.includes(type as (typeof UVS_MAIN_TYPE_ORDER)[number])) continue;

      entries.push({
        name: card.name,
        quantity,
        type: type as (typeof UVS_MAIN_TYPE_ORDER)[number],
      });
    }

    return entries;
  }, [deck, cardMap]);

  const exportSideEntries = useMemo(() => {
    if (!deck) return [] as UvsUltraDeckLine[];

    const entries: UvsUltraDeckLine[] = [];

    for (const [cardId, quantity] of Object.entries(deck.sideQuantities)) {
      if (quantity <= 0) continue;

      const card = cardMap.get(cardId);
      if (!card) continue;

      entries.push({ name: card.name, quantity });
    }

    return entries;
  }, [deck, cardMap]);

  const exportCharacter = useMemo(() => {
    if (!deck?.startingCharacterId) return null;
    return cardMap.get(deck.startingCharacterId) ?? null;
  }, [deck?.startingCharacterId, cardMap]);

  const exportText = useMemo(
    () =>
      formatUvsUltraDeckExport({
        character: exportCharacter,
        main: exportMainEntries,
        side: exportSideEntries,
      }),
    [exportCharacter, exportMainEntries, exportSideEntries]
  );

  const handleCopyExport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      toast.success("Export copied to clipboard.");
    } catch {
      toast.error("Unable to copy export text.");
    }
  }, [exportText]);

  const handleImport = useCallback(async () => {
    if (!deck) return;

    setIsImporting(true);
    setLastImportMessage(null);

    try {
      const parsed = parseUvsUltraDeck(importText);
      const targetMain: Record<string, number> = {};
      const targetSide: Record<string, number> = {};
      const unresolvedNames = new Set<string>();

      const parsedMainCounts = sumLineEntries(parsed.main);
      const parsedSideCounts = sumLineEntries(parsed.side);

      for (const [name, quantity] of Object.entries(parsedMainCounts)) {
        const card = findCardByName(name, cardNameIndex);
        if (!card) {
          unresolvedNames.add(name);
          continue;
        }
        incrementCount(targetMain, card._id, quantity);
      }

      for (const [name, quantity] of Object.entries(parsedSideCounts)) {
        const card = findCardByName(name, cardNameIndex);
        if (!card) {
          unresolvedNames.add(name);
          continue;
        }
        incrementCount(targetSide, card._id, quantity);
      }

      let importedCharacterId: Id<"cards"> | undefined;
      if (parsed.character) {
        const character = findCardByName(parsed.character.name, cardNameIndex);
        if (character) {
          importedCharacterId = character._id as Id<"cards">;
        } else {
          unresolvedNames.add(parsed.character.name);
        }
      }

      const matchedCardCount = sumQuantities(targetMain) + sumQuantities(targetSide);
      if (matchedCardCount === 0 && !importedCharacterId) {
        toast.error("No recognizable cards were found in the import text.");
        return;
      }

      const deckId = deck._id as Id<"decks">;
      const operations: Promise<unknown>[] = [];

      const applyDiff = (
        section: "main" | "side" | "reference",
        current: Record<string, number>,
        next: Record<string, number>
      ) => {
        for (const [cardId, currentQuantity] of Object.entries(current)) {
          const nextQuantity = next[cardId] ?? 0;
          if (currentQuantity > nextQuantity) {
            operations.push(
              removeCardMutation({
                deckId,
                cardId: cardId as Id<"cards">,
                section,
                quantity: currentQuantity - nextQuantity,
              })
            );
          }
        }

        for (const [cardId, nextQuantity] of Object.entries(next)) {
          const currentQuantity = current[cardId] ?? 0;
          if (nextQuantity > currentQuantity) {
            operations.push(
              addCardMutation({
                deckId,
                cardId: cardId as Id<"cards">,
                section,
                quantity: nextQuantity - currentQuantity,
              })
            );
          }
        }
      };

      applyDiff("main", deck.mainQuantities, targetMain);
      applyDiff("side", deck.sideQuantities, targetSide);
      applyDiff("reference", deck.referenceQuantities, {});

      await Promise.all(operations);

      if (importedCharacterId) {
        await updateDeckMutation({
          deckId,
          startingCharacterId: importedCharacterId,
        });
      }

      const importedMainCount = sumQuantities(targetMain);
      const importedSideCount = sumQuantities(targetSide);
      const unresolvedCount = unresolvedNames.size;
      const summary = `Imported ${importedMainCount} main / ${importedSideCount} side${
        unresolvedCount > 0 ? ` (${unresolvedCount} unmatched)` : ""
      }.`;

      setLastImportMessage(summary);
      toast.success(summary);

      if (importedSideCount > SIDEBAR_SIDEBOARD_LIMIT) {
        toast.warning("Sideboard has more than 10 cards. A validation warning is shown on deck details.");
      }
    } catch {
      toast.error("Import failed. Check the input format and try again.");
    } finally {
      setIsImporting(false);
    }
  }, [deck, importText, cardNameIndex, addCardMutation, removeCardMutation, updateDeckMutation]);

  return {
    deck,
    exportText,
    importText,
    setImportText,
    isImporting,
    lastImportMessage,
    handleCopyExport,
    handleImport,
  };
}

export type ImportExportSidebarModel = ReturnType<typeof useImportExportSidebarModel>;
