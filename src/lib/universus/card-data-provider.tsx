"use client";

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useSyncExternalStore,
  useCallback,
} from "react";
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

export type CardReferenceContextValue = {
  sets: CachedSet[];
  setsLoading: boolean;
  formats: CachedFormat[];
  formatsLoading: boolean;
  getSetByCode: (code: string) => CachedSet | undefined;
  getFormatByKey: (key: string) => CachedFormat | undefined;
  isSetLegalInFormat: (setCode: string, formatKey: string) => boolean;
};

export type CardCatalogContextValue = UseUniversusCardsResult & {
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
};

const defaultCatalog: CardCatalogContextValue = {
  cards: [],
  isLoading: true,
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

function CardDataProviderInner({ children }: CardDataProviderProps) {
  const cardData = useUniversusCards();
  const setsData = useSets({ serverVersion: cardData.serverVersion });
  const formatsData = useFormats();

  const stableFormatsData = useMemo(
    () => formatsData,
    [
      formatsData.formats,
      formatsData.setLegalities,
      formatsData.isLoading,
      formatsData.error,
      formatsData.getFormatByKey,
      formatsData.isSetLegalInFormat,
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
    };
  }, [setsData, stableFormatsData, isSetLegalInFormat]);

  const catalogValue = useMemo((): CardCatalogContextValue => {
    const getFilteredCards = (filters: CardFilters) => {
      const formatKey = filters.format;
      return filterCards(cardData.cards, filters, {
        passesFormatLegality: formatKey
          ? (setCode) => !setCode || isSetLegalInFormat(setCode, formatKey)
          : undefined,
      });
    };

    const getSortedCards = (cards: CachedCard[], options: CardSortOptions) => {
      return sortCards(cards, options);
    };

    const getPaginatedCards = (cards: CachedCard[], page: number, pageSize: number) => {
      return paginateCards(cards, page, pageSize);
    };

    const getFilteredAndSortedCards = (
      filters: CardFilters,
      sortOptions: CardSortOptions
    ) => {
      const filtered = getFilteredCards(filters);
      return sortCards(filtered, sortOptions);
    };

    return {
      ...cardData,
      getFilteredCards,
      getSortedCards,
      getPaginatedCards,
      getFilteredAndSortedCards,
    };
  }, [cardData, isSetLegalInFormat]);

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
  return useMemo(() => filterCards(cards, filters), [cards, filters]);
}

export function useFilteredAndSortedCards(
  filters: CardFilters,
  sortOptions: CardSortOptions
): CachedCard[] {
  const { cards } = useCardCatalog();
  return useMemo(() => {
    const filtered = filterCards(cards, filters);
    return sortCards(filtered, sortOptions);
  }, [cards, filters, sortOptions]);
}
