"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type StatOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte";

export interface StatFilterValue {
  operator: StatOperator;
  value: number;
}

export interface CardFilters {
  search?: string;
  searchMode?: "name" | "text" | "all";
  rarity?: string[];
  type?: string[];
  set?: string[];
  format?: string;
  symbols?: string[];
  attuned?: string[];
  symbolMatchAll?: boolean;
  includeInfinity?: boolean;
  keywords?: string[];
  keywordMatchAll?: boolean;
  difficultyMin?: number;
  difficultyMax?: number;
  controlMin?: number;
  controlMax?: number;
  speedMin?: number;
  speedMax?: number;
  damageMin?: number;
  damageMax?: number;
  blockModifierMin?: number;
  blockModifierMax?: number;
  handSizeMin?: number;
  handSizeMax?: number;
  healthMin?: number;
  healthMax?: number;
  staminaMin?: number;
  staminaMax?: number;
  difficulty?: StatFilterValue;
  control?: StatFilterValue;
  speed?: StatFilterValue;
  damage?: StatFilterValue;
  blockModifier?: StatFilterValue;
  handSize?: StatFilterValue;
  health?: StatFilterValue;
  stamina?: StatFilterValue;
  hasAttack?: boolean;
  hasBlock?: boolean;
  isCharacter?: boolean;
  attackZone?: string[];
  blockZone?: string[];
  hasAbilities?: boolean;
  abilityTiming?: string[];
  isDualFaced?: boolean;
  isReleased?: boolean;
}

export type GalleryViewMode = "grid" | "list" | "details";

export interface UIState {
  activeDeckId?: string;
  galleryFilters?: CardFilters;
  galleryViewMode?: GalleryViewMode;
  galleryCardsPerRow?: number;
  galleryCardsPerRowOpen?: number;
  galleryCardsPerRowClosed?: number;
  rightSidebarAction?: string;
  galleryFormat?: string;
  gallerySets?: string[];
  gallerySortField?: string;
  gallerySortDirection?: "asc" | "desc";
}

interface UIStateContextValue {
  uiState: UIState;
  updateUIState: (updates: Partial<UIState>) => void;
  setGalleryFilters: (filters: CardFilters) => void;
  setGalleryViewMode: (mode: GalleryViewMode) => void;
  setGalleryCardsPerRow: (count: number | undefined, isSidebarOpen?: boolean) => void;
  setActiveDeckId: (deckId: string | undefined) => void;
  setRightSidebarAction: (actionId: string | undefined) => void;
  setGalleryFormat: (format: string | undefined) => void;
  setGallerySets: (setCodes: string[] | undefined) => void;
  setGallerySortField: (field: string | undefined) => void;
  setGallerySortDirection: (direction: "asc" | "desc" | undefined) => void;
}

const UIStateContext = createContext<UIStateContextValue | null>(null);

const STORAGE_KEY_PREFIX = "uvs-decks";

function getStorageKey(key: string): string {
  return `${STORAGE_KEY_PREFIX}:${key}`;
}

function loadPersistedUIState(): UIState {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const activeDeckId = localStorage.getItem(getStorageKey("activeDeckId")) ?? undefined;
    const filtersRaw = localStorage.getItem(getStorageKey("galleryFilters"));
    const galleryFilters = filtersRaw ? JSON.parse(filtersRaw) : undefined;
    const galleryViewMode = (localStorage.getItem(getStorageKey("galleryViewMode")) as GalleryViewMode) ?? undefined;
    const galleryCardsPerRowRaw = localStorage.getItem(getStorageKey("galleryCardsPerRow"));
    const galleryCardsPerRow = galleryCardsPerRowRaw ? parseInt(galleryCardsPerRowRaw, 10) : undefined;
    const galleryCardsPerRowOpenRaw = localStorage.getItem(getStorageKey("galleryCardsPerRowOpen"));
    const galleryCardsPerRowClosedRaw = localStorage.getItem(getStorageKey("galleryCardsPerRowClosed"));
    const galleryCardsPerRowOpen = galleryCardsPerRowOpenRaw
      ? parseInt(galleryCardsPerRowOpenRaw, 10)
      : galleryCardsPerRow;
    const galleryCardsPerRowClosed = galleryCardsPerRowClosedRaw
      ? parseInt(galleryCardsPerRowClosedRaw, 10)
      : galleryCardsPerRow;
    const rightSidebarAction = localStorage.getItem(getStorageKey("rightSidebarAction")) ?? undefined;
    const galleryFormat = localStorage.getItem(getStorageKey("galleryFormat")) ?? undefined;
    const gallerySetsRaw = localStorage.getItem(getStorageKey("gallerySets"));
    const gallerySets = gallerySetsRaw ? JSON.parse(gallerySetsRaw) : undefined;
    const gallerySortField = localStorage.getItem(getStorageKey("gallerySortField")) ?? undefined;
    const gallerySortDirection = (localStorage.getItem(getStorageKey("gallerySortDirection")) as "asc" | "desc") ?? undefined;

    return {
      activeDeckId,
      galleryFilters,
      galleryViewMode,
      galleryCardsPerRow,
      galleryCardsPerRowOpen,
      galleryCardsPerRowClosed,
      rightSidebarAction,
      galleryFormat,
      gallerySets,
      gallerySortField,
      gallerySortDirection,
    };
  } catch {
    return {};
  }
}

function persistUIState(state: UIState) {
  if (typeof window === "undefined") return;
  try {
    if (state.activeDeckId) {
      localStorage.setItem(getStorageKey("activeDeckId"), state.activeDeckId);
    } else {
      localStorage.removeItem(getStorageKey("activeDeckId"));
    }

    if (state.galleryFilters) {
      localStorage.setItem(getStorageKey("galleryFilters"), JSON.stringify(state.galleryFilters));
    } else {
      localStorage.removeItem(getStorageKey("galleryFilters"));
    }

    if (state.galleryViewMode) {
      localStorage.setItem(getStorageKey("galleryViewMode"), state.galleryViewMode);
    } else {
      localStorage.removeItem(getStorageKey("galleryViewMode"));
    }

    if (state.galleryCardsPerRowOpen) {
      localStorage.setItem(getStorageKey("galleryCardsPerRowOpen"), state.galleryCardsPerRowOpen.toString());
    } else {
      localStorage.removeItem(getStorageKey("galleryCardsPerRowOpen"));
    }

    if (state.galleryCardsPerRowClosed) {
      localStorage.setItem(getStorageKey("galleryCardsPerRowClosed"), state.galleryCardsPerRowClosed.toString());
    } else {
      localStorage.removeItem(getStorageKey("galleryCardsPerRowClosed"));
    }

    if (state.rightSidebarAction) {
      localStorage.setItem(getStorageKey("rightSidebarAction"), state.rightSidebarAction);
    } else {
      localStorage.removeItem(getStorageKey("rightSidebarAction"));
    }

    if (state.galleryFormat) {
      localStorage.setItem(getStorageKey("galleryFormat"), state.galleryFormat);
    } else {
      localStorage.removeItem(getStorageKey("galleryFormat"));
    }

    if (state.gallerySets && state.gallerySets.length > 0) {
      localStorage.setItem(getStorageKey("gallerySets"), JSON.stringify(state.gallerySets));
    } else {
      localStorage.removeItem(getStorageKey("gallerySets"));
    }

    if (state.gallerySortField) {
      localStorage.setItem(getStorageKey("gallerySortField"), state.gallerySortField);
    } else {
      localStorage.removeItem(getStorageKey("gallerySortField"));
    }

    if (state.gallerySortDirection) {
      localStorage.setItem(getStorageKey("gallerySortDirection"), state.gallerySortDirection);
    } else {
      localStorage.removeItem(getStorageKey("gallerySortDirection"));
    }
  } catch {
  }
}

interface UIStateProviderProps {
  children: ReactNode;
}

export function UIStateProvider({ children }: UIStateProviderProps) {
  const [uiState, setUIState] = useState<UIState>(() =>
    typeof window === "undefined" ? {} : loadPersistedUIState()
  );
  const isHydrated = typeof window !== "undefined";
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const serverActiveDeckId = useQuery(api.sessions.getActiveDeckId, isAuthenticated ? {} : "skip");
  const setActiveDeckMutation = useMutation(api.sessions.setActiveDeck);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !authLoading && serverActiveDeckId !== undefined) {
      const nextActiveDeckId = serverActiveDeckId ?? undefined;
      if (uiState.activeDeckId === nextActiveDeckId) {
        return;
      }
      queueMicrotask(() => {
        setUIState((prev) => ({ ...prev, activeDeckId: nextActiveDeckId }));
        if (serverActiveDeckId) localStorage.setItem(getStorageKey("activeDeckId"), serverActiveDeckId);
        else localStorage.removeItem(getStorageKey("activeDeckId"));
      });
    }
  }, [isHydrated, isAuthenticated, authLoading, serverActiveDeckId, uiState.activeDeckId]);

  useEffect(() => {
    if (isHydrated) {
      persistUIState(uiState);
    }
  }, [isHydrated, uiState]);

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setGalleryFilters = useCallback((filters: CardFilters) => {
    setUIState((prev) => ({ ...prev, galleryFilters: filters }));
  }, []);

  const setActiveDeckId = useCallback(
    (deckId: string | undefined) => {
      setUIState((prev) => ({ ...prev, activeDeckId: deckId }));
      if (isAuthenticated) {
        setActiveDeckMutation({
          deckId: deckId ? (deckId as Id<"decks">) : undefined,
        });
      }
    },
    [setActiveDeckMutation, isAuthenticated]
  );

  const setGalleryViewMode = useCallback((mode: GalleryViewMode) => {
    setUIState((prev) => ({ ...prev, galleryViewMode: mode }));
  }, []);

  const setGalleryCardsPerRow = useCallback((count: number | undefined, isSidebarOpen?: boolean) => {
    setUIState((prev) => ({
      ...prev,
      galleryCardsPerRow: count,
      ...(isSidebarOpen
        ? { galleryCardsPerRowOpen: count }
        : { galleryCardsPerRowClosed: count }),
    }));
  }, []);

  const setRightSidebarAction = useCallback((actionId: string | undefined) => {
    setUIState((prev) => ({ ...prev, rightSidebarAction: actionId }));
  }, []);

  const setGalleryFormat = useCallback((format: string | undefined) => {
    setUIState((prev) => ({ ...prev, galleryFormat: format }));
  }, []);

  const setGallerySets = useCallback((setCodes: string[] | undefined) => {
    setUIState((prev) => ({ ...prev, gallerySets: setCodes }));
  }, []);

  const setGallerySortField = useCallback((field: string | undefined) => {
    setUIState((prev) => ({ ...prev, gallerySortField: field }));
  }, []);

  const setGallerySortDirection = useCallback((direction: "asc" | "desc" | undefined) => {
    setUIState((prev) => ({ ...prev, gallerySortDirection: direction }));
  }, []);

  const value = useMemo(
    () => ({
      uiState,
      updateUIState,
      setGalleryFilters,
      setGalleryViewMode,
      setGalleryCardsPerRow,
      setActiveDeckId,
      setRightSidebarAction,
      setGalleryFormat,
      setGallerySets,
      setGallerySortField,
      setGallerySortDirection,
    }),
    [
      uiState,
      updateUIState,
      setGalleryFilters,
      setGalleryViewMode,
      setGalleryCardsPerRow,
      setActiveDeckId,
      setRightSidebarAction,
      setGalleryFormat,
      setGallerySets,
      setGallerySortField,
      setGallerySortDirection,
    ]
  );

  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error("useUIState must be used within a UIStateProvider");
  }
  return context;
}
