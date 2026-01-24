"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useQuery, useMutation } from "convex/react";
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
  setGalleryCardsPerRow: (count: number | undefined) => void;
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

    if (state.galleryCardsPerRow) {
      localStorage.setItem(getStorageKey("galleryCardsPerRow"), state.galleryCardsPerRow.toString());
    } else {
      localStorage.removeItem(getStorageKey("galleryCardsPerRow"));
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
  const [uiState, setUIState] = useState<UIState>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const serverSyncedRef = useRef(false);

  const serverActiveDeckId = useQuery(api.sessions.getActiveDeckId);
  const setActiveDeckMutation = useMutation(api.sessions.setActiveDeck);

  useEffect(() => {
    const persisted = loadPersistedUIState();
    setUIState(persisted);
    setIsHydrated(true);
    serverSyncedRef.current = false;
  }, []);

  useEffect(() => {
    if (isHydrated && serverActiveDeckId !== undefined && !serverSyncedRef.current) {
      serverSyncedRef.current = true;
      if (serverActiveDeckId) {
        setUIState((prev) => ({ ...prev, activeDeckId: serverActiveDeckId }));
        localStorage.setItem(getStorageKey("activeDeckId"), serverActiveDeckId);
      }
    }
  }, [isHydrated, serverActiveDeckId]);

  useEffect(() => {
    if (isHydrated) {
      persistUIState(uiState);
    }
  }, [isHydrated, uiState]);

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setGalleryFilters = useCallback(
    (filters: CardFilters) => {
      updateUIState({ galleryFilters: filters });
    },
    [updateUIState]
  );

  const setActiveDeckId = useCallback(
    (deckId: string | undefined) => {
      updateUIState({ activeDeckId: deckId });
      setActiveDeckMutation({
        deckId: deckId ? (deckId as Id<"decks">) : undefined,
      });
    },
    [updateUIState, setActiveDeckMutation]
  );

  const setGalleryViewMode = useCallback(
    (mode: GalleryViewMode) => {
      updateUIState({ galleryViewMode: mode });
    },
    [updateUIState]
  );

  const setGalleryCardsPerRow = useCallback(
    (count: number | undefined) => {
      updateUIState({ galleryCardsPerRow: count });
    },
    [updateUIState]
  );

  const setRightSidebarAction = useCallback(
    (actionId: string | undefined) => {
      updateUIState({ rightSidebarAction: actionId });
    },
    [updateUIState]
  );

  const setGalleryFormat = useCallback(
    (format: string | undefined) => {
      updateUIState({ galleryFormat: format });
    },
    [updateUIState]
  );

  const setGallerySets = useCallback(
    (setCodes: string[] | undefined) => {
      updateUIState({ gallerySets: setCodes });
    },
    [updateUIState]
  );

  const setGallerySortField = useCallback(
    (field: string | undefined) => {
      updateUIState({ gallerySortField: field });
    },
    [updateUIState]
  );

  const setGallerySortDirection = useCallback(
    (direction: "asc" | "desc" | undefined) => {
      updateUIState({ gallerySortDirection: direction });
    },
    [updateUIState]
  );

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
