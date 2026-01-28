"use client";

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
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

const CardDataContext = createContext<CardDataContextValue | null>(null);

interface CardDataProviderProps {
  children: ReactNode;
}

export function CardDataProvider({ children }: CardDataProviderProps) {
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

export function useCardData() {
  const context = useContext(CardDataContext);
  if (!context) {
    throw new Error("useCardData must be used within a CardDataProvider");
  }
  return context;
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
