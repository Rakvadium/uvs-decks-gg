"use client";

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useSyncExternalStore,
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

interface CardDataContextValue extends UseUniversusCardsResult {
  sets: CachedSet[];
  setsLoading: boolean;
  formats: CachedFormat[];
  formatsLoading: boolean;
  getSetByCode: (code: string) => CachedSet | undefined;
  getFormatByKey: (key: string) => CachedFormat | undefined;
  isSetLegalInFormat: (setCode: string, formatKey: string) => boolean;
  getFilteredCards: (filters: CardFilters) => CachedCard[];
  getSortedCards: (cards: CachedCard[], options: CardSortOptions) => CachedCard[];
  getPaginatedCards: (cards: CachedCard[], page: number, pageSize: number) => ReturnType<typeof paginateCards>;
  getFilteredAndSortedCards: (filters: CardFilters, sortOptions: CardSortOptions) => CachedCard[];
}

const defaultContextValue: CardDataContextValue = {
  cards: [],
  sets: [],
  setsLoading: true,
  formats: [],
  formatsLoading: true,
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
  getSetByCode: () => undefined,
  getFormatByKey: () => undefined,
  isSetLegalInFormat: () => true,
  getFilteredCards: () => [],
  getSortedCards: (cards) => cards,
  getPaginatedCards: () => ({ cards: [], totalPages: 0, hasMore: false }),
  getFilteredAndSortedCards: () => [],
};

const CardDataContext = createContext<CardDataContextValue>(defaultContextValue);

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

  const value = useMemo((): CardDataContextValue => {
    const isSetLegalInFormat = (setCode: string, formatKey: string): boolean => {
      const set = setsData.getSetByCode(setCode);
      if (!set) return true;
      
      const legalFormats = parseSetLegality(set.legality);
      if (legalFormats.length === 0) return true;
      
      return legalFormats.includes(formatKey);
    };

    const getFilteredCards = (filters: CardFilters) => {
      let cards = filterCards(cardData.cards, filters);
      
      if (filters.format) {
        cards = cards.filter((card) => {
          if (!card.setCode) return true;
          return isSetLegalInFormat(card.setCode, filters.format!);
        });
      }
      
      return cards;
    };

    const getSortedCards = (cards: CachedCard[], options: CardSortOptions) => {
      return sortCards(cards, options);
    };

    const getPaginatedCards = (cards: CachedCard[], page: number, pageSize: number) => {
      return paginateCards(cards, page, pageSize);
    };

    const getFilteredAndSortedCards = (filters: CardFilters, sortOptions: CardSortOptions) => {
      const filtered = getFilteredCards(filters);
      return sortCards(filtered, sortOptions);
    };

    return {
      ...cardData,
      sets: setsData.sets,
      setsLoading: setsData.isLoading,
      formats: stableFormatsData.formats,
      formatsLoading: stableFormatsData.isLoading,
      getSetByCode: setsData.getSetByCode,
      getFormatByKey: stableFormatsData.getFormatByKey,
      isSetLegalInFormat,
      getFilteredCards,
      getSortedCards,
      getPaginatedCards,
      getFilteredAndSortedCards,
    };
  }, [cardData, setsData, stableFormatsData]);

  return (
    <CardDataContext.Provider value={value}>
      {children}
    </CardDataContext.Provider>
  );
}

export function CardDataProvider({ children }: CardDataProviderProps) {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <CardDataContext.Provider value={defaultContextValue}>
        {children}
      </CardDataContext.Provider>
    );
  }

  return <CardDataProviderInner>{children}</CardDataProviderInner>;
}

export function useCardData() {
  return useContext(CardDataContext);
}

export function useFilteredCards(filters: CardFilters): CachedCard[] {
  const { cards } = useCardData();
  return useMemo(() => filterCards(cards, filters), [cards, filters]);
}

export function useFilteredAndSortedCards(
  filters: CardFilters,
  sortOptions: CardSortOptions
): CachedCard[] {
  const { cards } = useCardData();
  return useMemo(() => {
    const filtered = filterCards(cards, filters);
    return sortCards(filtered, sortOptions);
  }, [cards, filters, sortOptions]);
}
