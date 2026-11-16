"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  startTransition,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDeckCatalogData, type DeckTab } from "@/hooks/useDeckCatalogData";
import { useLocationSearchParams } from "@/hooks/useLocationSearchParams";
import { applyDeckListView, deckFormatOptions, type DeckListSort } from "@/lib/deck/deck-list-view";

export type DeckCreateIntent = "blank" | "import";

interface DecksState {
  activeTab: DeckTab;
  searchQuery: string;
  isCreateDialogOpen: boolean;
  /** "import" opens the new deck with its Import/Export panel showing. */
  createIntent: DeckCreateIntent;
  sort: DeckListSort;
  formatFilter: string | null;
}

interface DecksActions {
  setActiveTab: (tab: DeckTab) => void;
  setSearchQuery: (query: string) => void;
  setSort: (sort: DeckListSort) => void;
  setFormatFilter: (format: string | null) => void;
  openCreateDialog: (intent?: DeckCreateIntent) => void;
  closeCreateDialog: () => void;
}

interface DecksContextValue {
  state: DecksState;
  actions: DecksActions;
  catalog: ReturnType<typeof useDeckCatalogData>;
  /** `catalog.currentDecks` after the sort and format filter. */
  visibleDecks: ReturnType<typeof useDeckCatalogData>["currentDecks"];
  formatOptions: string[];
}

const DecksContext = createContext<DecksContextValue | null>(null);

function resolveDeckTab(value: string | null): DeckTab | null {
  if (value === "my-decks" || value === "public" || value === "tournament") {
    return value;
  }
  return null;
}

export function DecksProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { params: searchParams, refresh: refreshSearchParams } = useLocationSearchParams();
  const skipUrlReadRef = useRef(false);
  const tabFromUrl = resolveDeckTab(searchParams.get("tab"));
  const searchFromUrl = searchParams.get("q") ?? "";

  const [activeTab, setActiveTabState] = useState<DeckTab>(tabFromUrl ?? "public");
  const [searchQuery, setSearchQueryState] = useState(searchFromUrl);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createIntent, setCreateIntent] = useState<DeckCreateIntent>("blank");
  const [sort, setSort] = useState<DeckListSort>("default");
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const catalog = useDeckCatalogData(searchQuery, activeTab);
  const formatOptions = useMemo(() => deckFormatOptions(catalog.currentDecks), [catalog.currentDecks]);
  const activeFormatFilter = formatFilter && formatOptions.includes(formatFilter) ? formatFilter : null;
  const visibleDecks = useMemo(
    () => applyDeckListView(catalog.currentDecks, sort, activeFormatFilter),
    [catalog.currentDecks, sort, activeFormatFilter]
  );
  const appliedDefaultTabRef = useRef(false);

  const replaceDecksUrl = useCallback(
    (nextTab: DeckTab, nextSearch: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const defaultTab = catalog.isAuthenticated ? "my-decks" : "public";
      if (nextTab === defaultTab) {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }
      const trimmed = nextSearch.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const nextQuery = params.toString();
      const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const currentHref = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      if (nextHref === currentHref) return;
      skipUrlReadRef.current = true;
      startTransition(() => {
        router.replace(nextHref, { scroll: false });
        queueMicrotask(() => refreshSearchParams());
      });
    },
    [searchParams, catalog.isAuthenticated, pathname, router, refreshSearchParams]
  );

  useEffect(() => {
    if (skipUrlReadRef.current) {
      skipUrlReadRef.current = false;
      return;
    }
    if (tabFromUrl) {
      setActiveTabState(tabFromUrl);
    }
    setSearchQueryState(searchFromUrl);
  }, [tabFromUrl, searchFromUrl]);

  useEffect(() => {
    if (catalog.authLoading) return;
    if (tabFromUrl) return;
    if (appliedDefaultTabRef.current) return;
    appliedDefaultTabRef.current = true;
    const nextTab: DeckTab = catalog.isAuthenticated ? "my-decks" : "public";
    setActiveTabState(nextTab);
  }, [catalog.authLoading, catalog.isAuthenticated, tabFromUrl]);

  const setActiveTab = useCallback(
    (tab: DeckTab) => {
      setActiveTabState(tab);
      replaceDecksUrl(tab, searchQuery);
    },
    [replaceDecksUrl, searchQuery]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      replaceDecksUrl(activeTab, query);
    },
    [replaceDecksUrl, activeTab]
  );

  const value = useMemo(
    (): DecksContextValue => ({
      state: {
        activeTab,
        searchQuery,
        isCreateDialogOpen,
        createIntent,
        sort,
        formatFilter: activeFormatFilter,
      },
      actions: {
        setActiveTab,
        setSearchQuery,
        setSort,
        setFormatFilter,
        openCreateDialog: (intent: DeckCreateIntent = "blank") => {
          setCreateIntent(intent);
          setIsCreateDialogOpen(true);
        },
        closeCreateDialog: () => setIsCreateDialogOpen(false),
      },
      catalog,
      visibleDecks,
      formatOptions,
    }),
    [
      activeTab,
      searchQuery,
      isCreateDialogOpen,
      createIntent,
      sort,
      activeFormatFilter,
      catalog,
      visibleDecks,
      formatOptions,
      setActiveTab,
      setSearchQuery,
    ]
  );

  return (
    <DecksContext.Provider value={value}>
      {children}
    </DecksContext.Provider>
  );
}

export function useDecks(): DecksContextValue {
  const context = useContext(DecksContext);
  if (!context) {
    throw new Error("useDecks must be used within DecksProvider");
  }
  return context;
}

export function useDecksOptional(): DecksContextValue | null {
  return useContext(DecksContext);
}
