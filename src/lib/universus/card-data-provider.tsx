"use client";

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useSyncExternalStore,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  useUniversusCards,
  filterCards,
  sortCards,
  paginateCards,
  UseUniversusCardsResult,
  CardSortOptions,
  CachedCard,
} from "./use-universus-cards";
import { useSets, CachedSet, parseSetLegality } from "./use-sets";
import { useFormats, CachedFormat } from "./use-formats";
import type { CardFilters } from "@/providers/UIStateProvider";
import { useGameId, useGameModule } from "@/games/game-context";

export type CardReferenceContextValue = {
  sets: CachedSet[];
  setsLoading: boolean;
  formats: CachedFormat[];
  formatsLoading: boolean;
  getSetByCode: (code: string) => CachedSet | undefined;
  getFormatByKey: (key: string) => CachedFormat | undefined;
  isSetLegalInFormat: (setCode: string, formatKey: string) => boolean;
  isCardBannedInFormat: (formatKey: string, cardId: string) => boolean;
  getBannedFormatNames: (cardId: string) => string[];
};

export type CardCatalogContextValue = UseUniversusCardsResult & {
  /**
   * Cards outside the gallery catalog (variant printings) that a deck or the printings carousel
   * needed, keyed by id. They resolve by id (`index.byId`, `useCardIdMap`) but never show in the
   * gallery, filters or `cards`.
   */
  extraCards: ReadonlyMap<string, CachedCard>;
  /** Fetches any of `ids` that aren't in the catalog or `extraCards` yet. */
  ensureCards: (ids: readonly string[]) => void;
  /** Adds already-loaded card docs (e.g. the printings carousel's query result) to `extraCards`. */
  registerCards: (cards: readonly CachedCard[]) => void;
  getFilteredCards: (filters: CardFilters) => CachedCard[];
  getSortedCards: (cards: CachedCard[], options: CardSortOptions) => CachedCard[];
  getPaginatedCards: (
    cards: CachedCard[],
    page: number,
    pageSize: number
  ) => ReturnType<typeof paginateCards>;
  getFilteredAndSortedCards: (
    filters: CardFilters,
    sortOptions: CardSortOptions
  ) => CachedCard[];
};

export type CardDataContextValue = CardCatalogContextValue & CardReferenceContextValue;

const defaultReference: CardReferenceContextValue = {
  sets: [],
  setsLoading: true,
  formats: [],
  formatsLoading: true,
  getSetByCode: () => undefined,
  getFormatByKey: () => undefined,
  isSetLegalInFormat: () => true,
  isCardBannedInFormat: () => false,
  getBannedFormatNames: () => [],
};

const defaultCatalog: CardCatalogContextValue = {
  cards: [],
  isLoading: true,
  isCatalogDataLoading: true,
  isCatalogIndexReady: false,
  isLoadingMore: false,
  loadProgress: 0,
  totalCards: 0,
  cachedVersion: null,
  serverVersion: null,
  isCheckingVersion: true,
  isSyncing: false,
  error: null,
  index: null,
  uniqueValues: null,
  isHydrated: false,
  refreshCache: async () => {},
  extraCards: new Map(),
  ensureCards: () => {},
  registerCards: () => {},
  getFilteredCards: () => [],
  getSortedCards: (cards) => cards,
  getPaginatedCards: () => ({ cards: [], totalPages: 0, hasMore: false }),
  getFilteredAndSortedCards: () => [],
};

const CardReferenceContext = createContext<CardReferenceContextValue>(defaultReference);
const CardCatalogContext = createContext<CardCatalogContextValue>(defaultCatalog);

interface CardDataProviderProps {
  children: ReactNode;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

const EXTRA_CARD_ID_CHUNK = 200;

/** Variant printings referenced by decks or picked in the printings carousel (not in the catalog). */
function useExtraCards(catalogById: ReadonlyMap<string, CachedCard> | undefined) {
  const convex = useConvex();
  const game = useGameId();
  const [extra, setExtra] = useState<{ game: string; cards: Map<string, CachedCard> }>({
    game,
    cards: new Map(),
  });
  const extraCards = extra.game === game ? extra.cards : EMPTY_EXTRA_CARDS;
  const requestedRef = useRef<{ game: string; ids: Set<string> }>({ game, ids: new Set() });

  const registerCards = useCallback(
    (cards: readonly CachedCard[]) => {
      const fresh = cards.filter((card) => !catalogById?.has(card._id));
      if (fresh.length === 0) return;
      setExtra((prev) => {
        const base = prev.game === game ? prev.cards : new Map<string, CachedCard>();
        if (fresh.every((card) => base.get(card._id) === card)) return prev;
        const next = new Map(base);
        for (const card of fresh) next.set(card._id, card);
        return { game, cards: next };
      });
    },
    [catalogById, game]
  );

  const ensureCards = useCallback(
    (ids: readonly string[]) => {
      if (!catalogById) return;
      if (requestedRef.current.game !== game) requestedRef.current = { game, ids: new Set() };
      const requested = requestedRef.current.ids;
      const missing = [...new Set(ids)].filter(
        (id) => id && !catalogById.has(id) && !requested.has(id)
      );
      if (missing.length === 0) return;
      for (const id of missing) requested.add(id);
      void (async () => {
        for (let i = 0; i < missing.length; i += EXTRA_CARD_ID_CHUNK) {
          const chunk = missing.slice(i, i + EXTRA_CARD_ID_CHUNK);
          try {
            const cards = await convex.query(api.cards.batchGetCardsByIds, {
              game,
              ids: chunk as Id<"cards">[],
            });
            registerCards(cards as CachedCard[]);
          } catch (error) {
            for (const id of chunk) requested.delete(id);
            console.error("Could not load deck cards outside the catalog", error);
          }
        }
      })();
    },
    [catalogById, convex, game, registerCards]
  );

  return { extraCards, ensureCards, registerCards };
}

const EMPTY_EXTRA_CARDS: ReadonlyMap<string, CachedCard> = new Map();

function CardDataProviderInner({ children }: CardDataProviderProps) {
  const cardData = useUniversusCards();
  const { extraCards, ensureCards, registerCards } = useExtraCards(cardData.index?.byId);
  // Extra cards resolve by id only; the name/type/set indexes stay gallery-only.
  const index = useMemo(() => {
    if (!cardData.index || extraCards.size === 0) return cardData.index;
    const byId = new Map(cardData.index.byId);
    for (const [id, card] of extraCards) if (!byId.has(id)) byId.set(id, card);
    return { ...cardData.index, byId };
  }, [cardData.index, extraCards]);
  const setsData = useSets({ serverVersion: cardData.serverVersion });
  const formatsData = useFormats();
  const { filters: filterDefinition } = useGameModule();

  const stableFormatsData = useMemo(
    () => formatsData,
    [
      formatsData.formats,
      formatsData.setLegalities,
      formatsData.cardLegalities,
      formatsData.isLoading,
      formatsData.error,
      formatsData.getFormatByKey,
      formatsData.isSetLegalInFormat,
      formatsData.isCardBannedInFormat,
      formatsData.getBannedFormatNames,
      formatsData.isHydrated,
    ]
  );

  const isSetLegalInFormat = useCallback(
    (setCode: string, formatKey: string): boolean => {
      const set = setsData.getSetByCode(setCode);
      if (!set) return true;

      const legalFormats = parseSetLegality(set.legality);
      if (legalFormats.length === 0) return true;

      return legalFormats.includes(formatKey);
    },
    [setsData.getSetByCode]
  );

  const referenceValue = useMemo((): CardReferenceContextValue => {
    return {
      sets: setsData.sets,
      setsLoading: setsData.isLoading,
      formats: stableFormatsData.formats,
      formatsLoading: stableFormatsData.isLoading,
      getSetByCode: setsData.getSetByCode,
      getFormatByKey: stableFormatsData.getFormatByKey,
      isSetLegalInFormat,
      isCardBannedInFormat: stableFormatsData.isCardBannedInFormat,
      getBannedFormatNames: stableFormatsData.getBannedFormatNames,
    };
  }, [setsData, stableFormatsData, isSetLegalInFormat]);

  const catalogValue = useMemo((): CardCatalogContextValue => {
    const getFilteredCards = (filters: CardFilters) => {
      const formatKey = filters.format;
      return filterCards(cardData.cards, filters, {
        passesFormatLegality: formatKey
          ? (setCode) => !setCode || isSetLegalInFormat(setCode, formatKey)
          : undefined,
        isCardBannedInFormat: formatKey
          ? (cardId) => stableFormatsData.isCardBannedInFormat(formatKey, cardId)
          : undefined,
      }, filterDefinition);
    };

    const getSortedCards = (cards: CachedCard[], options: CardSortOptions) => {
      return sortCards(cards, options, filterDefinition);
    };

    const getPaginatedCards = (cards: CachedCard[], page: number, pageSize: number) => {
      return paginateCards(cards, page, pageSize);
    };

    const getFilteredAndSortedCards = (
      filters: CardFilters,
      sortOptions: CardSortOptions
    ) => {
      const filtered = getFilteredCards(filters);
      return sortCards(filtered, sortOptions, filterDefinition);
    };

    return {
      ...cardData,
      index,
      extraCards,
      ensureCards,
      registerCards,
      getFilteredCards,
      getSortedCards,
      getPaginatedCards,
      getFilteredAndSortedCards,
    };
  }, [cardData, index, extraCards, ensureCards, registerCards, isSetLegalInFormat, stableFormatsData, filterDefinition]);

  return (
    <CardReferenceContext.Provider value={referenceValue}>
      <CardCatalogContext.Provider value={catalogValue}>{children}</CardCatalogContext.Provider>
    </CardReferenceContext.Provider>
  );
}

export function CardDataProvider({ children }: CardDataProviderProps) {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <CardReferenceContext.Provider value={defaultReference}>
        <CardCatalogContext.Provider value={defaultCatalog}>{children}</CardCatalogContext.Provider>
      </CardReferenceContext.Provider>
    );
  }

  return <CardDataProviderInner>{children}</CardDataProviderInner>;
}

export function useCardReferenceData(): CardReferenceContextValue {
  return useContext(CardReferenceContext);
}

export function useCardCatalog(): CardCatalogContextValue {
  return useContext(CardCatalogContext);
}

export function useCardIndex() {
  const { index } = useCardCatalog();
  return index;
}

export function useCardData(): CardDataContextValue {
  const catalog = useContext(CardCatalogContext);
  const reference = useContext(CardReferenceContext);
  return useMemo(
    () => ({
      ...catalog,
      ...reference,
    }),
    [catalog, reference]
  );
}

export function useFilteredCards(filters: CardFilters): CachedCard[] {
  const { cards } = useCardCatalog();
  const { filters: filterDefinition } = useGameModule();
  return useMemo(
    () => filterCards(cards, filters, undefined, filterDefinition),
    [cards, filters, filterDefinition]
  );
}

export function useFilteredAndSortedCards(
  filters: CardFilters,
  sortOptions: CardSortOptions
): CachedCard[] {
  const { cards } = useCardCatalog();
  const { filters: filterDefinition } = useGameModule();
  return useMemo(() => {
    const filtered = filterCards(cards, filters, undefined, filterDefinition);
    return sortCards(filtered, sortOptions, filterDefinition);
  }, [cards, filters, sortOptions, filterDefinition]);
}

/** Loads deck cards that aren't in the gallery catalog (variant printings) so they resolve by id. */
export function useEnsureCards(ids: readonly string[]) {
  const { ensureCards, isCatalogIndexReady } = useCardCatalog();
  const key = [...new Set(ids)].filter(Boolean).sort().join("|");
  useEffect(() => {
    if (!isCatalogIndexReady || !key) return;
    ensureCards(key.split("|"));
  }, [ensureCards, isCatalogIndexReady, key]);
}
