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
import type { CardFilters } from "@/providers/UIStateProvider";

interface CardDataContextValue extends UseUniversusCardsResult {
  getFilteredCards: (filters: CardFilters) => CachedCard[];
  getSortedCards: (cards: CachedCard[], options: CardSortOptions) => CachedCard[];
  getPaginatedCards: (cards: CachedCard[], page: number, pageSize: number) => ReturnType<typeof paginateCards>;
  getFilteredAndSortedCards: (filters: CardFilters, sortOptions: CardSortOptions) => CachedCard[];
}

const defaultContextValue: CardDataContextValue = {
  cards: [],
  isLoading: true,
  isLoadingMore: false,
  loadProgress: 0,
  totalCards: 0,
  cachedVersion: null,
  serverVersion: null,
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

  const value = useMemo((): CardDataContextValue => {
    const getFilteredCards = (filters: CardFilters) => {
      return filterCards(cardData.cards, filters);
    };

    const getSortedCards = (cards: CachedCard[], options: CardSortOptions) => {
      return sortCards(cards, options);
    };

    const getPaginatedCards = (cards: CachedCard[], page: number, pageSize: number) => {
      return paginateCards(cards, page, pageSize);
    };

    const getFilteredAndSortedCards = (filters: CardFilters, sortOptions: CardSortOptions) => {
      const filtered = filterCards(cardData.cards, filters);
      return sortCards(filtered, sortOptions);
    };

    return {
      ...cardData,
      getFilteredCards,
      getSortedCards,
      getPaginatedCards,
      getFilteredAndSortedCards,
    };
  }, [cardData]);

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
