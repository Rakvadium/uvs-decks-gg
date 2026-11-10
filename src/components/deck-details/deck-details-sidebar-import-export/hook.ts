import { useCallback, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { DeckTextLine } from "@shared/games/deck";
import { useCardIdMap } from "@/hooks/useCardIdMap";
import { useCardData } from "@/lib/universus/card-data-provider";
import { useDeckDetailsOptional } from "@/providers/DeckDetailsProvider";
import { useGameModule } from "@/games/game-context";
import { deckRevisionNumber, isDeckWriteConflictError, isTeamEditableDeck } from "@/lib/deck/visibility";
import { buildCardNameIndex, incrementCount, sumQuantities } from "../uvs-import-export";
import { findCardsByName, setupExportCards, sumDeckLines } from "./setup-text";

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
  const gameModule = useGameModule();
  const gameDeck = gameModule.deck;
  const { formatCardType } = gameModule.ui;
  const deckText = gameDeck.text;
  const setupHelpers = gameModule.ui.deckSetup;
  const setup = gameDeck.normalizeSetup(deck);
  const cardMap = useCardIdMap(cards);
  const cardNameIndex = useMemo(() => buildCardNameIndex(cards), [cards]);

  const exportMainEntries = useMemo(() => {
    if (!deck) return [] as DeckTextLine[];

    const entries: DeckTextLine[] = [];

    for (const [cardId, quantity] of Object.entries(deck.mainQuantities)) {
      if (quantity <= 0) continue;

      const card = cardMap.get(cardId);
      if (!card) continue;

      // Each format decides which types it lists (UVS drops types outside `mainTypeOrder`).
      const type = formatCardType(card.type) ?? card.type ?? "Other";
      entries.push({ name: card.name, quantity, type });
    }

    return entries;
  }, [deck, cardMap, formatCardType]);

  const exportSideEntries = useMemo(() => {
    if (!deck) return [] as DeckTextLine[];

    const entries: DeckTextLine[] = [];

    for (const [cardId, quantity] of Object.entries(deck.sideQuantities)) {
      if (quantity <= 0) continue;

      const card = cardMap.get(cardId);
      if (!card) continue;

      entries.push({ name: card.name, quantity });
    }

    return entries;
  }, [deck, cardMap]);

  const setupCardIdsKey = gameDeck.setupCardIds(setup).join("|");
  const exportSetup = useMemo(
    () => setupExportCards(setupCardIdsKey ? setupCardIdsKey.split("|") : [], (id) => cardMap.get(id)),
    [setupCardIdsKey, cardMap]
  );

  const exportText = useMemo(
    () =>
      deckText.format({
        character: exportSetup.character,
        setupCards: exportSetup.setupCards,
        main: exportMainEntries,
        side: exportSideEntries,
      }),
    [deckText, exportSetup, exportMainEntries, exportSideEntries]
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
      const parsed = deckText.parse(importText);
      const targetMain: Record<string, number> = {};
      const targetSide: Record<string, number> = {};
      const unresolvedNames = new Set<string>();

      const parsedMainCounts = sumDeckLines(parsed.main);
      const parsedSideCounts = sumDeckLines(parsed.side);

      for (const [name, quantity] of Object.entries(parsedMainCounts)) {
        const card = findCardsByName(name, cardNameIndex)[0];
        if (!card) {
          unresolvedNames.add(name);
          continue;
        }
        incrementCount(targetMain, card._id, quantity);
      }

      for (const [name, quantity] of Object.entries(parsedSideCounts)) {
        const card = findCardsByName(name, cardNameIndex)[0];
        if (!card) {
          unresolvedNames.add(name);
          continue;
        }
        incrementCount(targetSide, card._id, quantity);
      }

      // Setup cards (UVS: starting character; Cyberpunk: Legends) become a setup patch.
      const setupImport = setupHelpers.importPatch(parsed, (name) => findCardsByName(name, cardNameIndex));
      for (const name of setupImport.unresolved) unresolvedNames.add(name);

      const matchedCardCount = sumQuantities(targetMain) + sumQuantities(targetSide);
      if (matchedCardCount === 0 && !setupImport.patch) {
        toast.error("No recognizable cards were found in the import text.");
        return;
      }

      const deckId = deck._id as Id<"decks">;
      let rev = deckRevisionNumber(deck);
      const requireRev = isTeamEditableDeck(deck);

      const applyDiff = async (
        section: "main" | "side" | "reference",
        current: Record<string, number>,
        next: Record<string, number>
      ) => {
        for (const [cardId, currentQuantity] of Object.entries(current)) {
          const nextQuantity = next[cardId] ?? 0;
          if (currentQuantity > nextQuantity) {
            const r = await removeCardMutation({
              deckId,
              cardId: cardId as Id<"cards">,
              section,
              quantity: currentQuantity - nextQuantity,
              ...(requireRev ? { expectedRevision: rev } : {}),
            });
            rev = r.revision;
          }
        }

        for (const [cardId, nextQuantity] of Object.entries(next)) {
          const currentQuantity = current[cardId] ?? 0;
          if (nextQuantity > currentQuantity) {
            const r = await addCardMutation({
              deckId,
              cardId: cardId as Id<"cards">,
              section,
              quantity: nextQuantity - currentQuantity,
              ...(requireRev ? { expectedRevision: rev } : {}),
            });
            rev = r.revision;
          }
        }
      };

      await applyDiff("main", deck.mainQuantities, targetMain);
      await applyDiff("side", deck.sideQuantities, targetSide);
      await applyDiff("reference", deck.referenceQuantities, {});

      if (setupImport.patch) {
        await updateDeckMutation({ deckId, setup: setupImport.patch });
      }

      const importedMainCount = sumQuantities(targetMain);
      const importedSideCount = sumQuantities(targetSide);
      const unresolvedCount = unresolvedNames.size;
      const summary = `Imported ${importedMainCount} main / ${importedSideCount} side${
        unresolvedCount > 0 ? ` (${unresolvedCount} unmatched)` : ""
      }.`;

      setLastImportMessage(summary);
      toast.success(summary);

      if (importedSideCount > gameDeck.sideboardLimit) {
        toast.warning(
          gameDeck.sideboardLimit > 0
            ? `Sideboard has more than ${gameDeck.sideboardLimit} cards. A validation warning is shown on deck details.`
            : "This game has no sideboard. A validation warning is shown on deck details."
        );
      }
    } catch (e) {
      if (isDeckWriteConflictError(e)) {
        toast.error("This deck was updated while importing. Try again with the latest list.");
      } else {
        toast.error("Import failed. Check the input format and try again.");
      }
    } finally {
      setIsImporting(false);
    }
  }, [deck, gameDeck, deckText, setupHelpers, importText, cardNameIndex, addCardMutation, removeCardMutation, updateDeckMutation]);

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
