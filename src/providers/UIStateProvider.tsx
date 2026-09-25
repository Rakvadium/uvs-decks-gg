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
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  parseStoredCardsPerRow,
  resolveGalleryCardsPerRowPreference,
} from "@/lib/gallery/cards-per-row-preference";
import type { UvsStatZoneFilterFields } from "@shared/games/uvs/filters";
import type { GameId } from "@shared/games/types";
import { useGameId } from "@/games/game-context";
import {
  gameStorageKey,
  globalStorageKey,
  legacyGameKey,
  readStorageWithLegacy,
} from "@/lib/storage-keys";

export type { StatOperator, StatFilterValue } from "@shared/games/filters";

/**
 * Persisted gallery filters (localStorage + Convex `sessions.galleryFilters`). Stat, range
 * (`${stat}Min`/`${stat}Max`), and zone fields are derived from the UVS filter definition.
 */
export interface CardFilters extends UvsStatZoneFilterFields {
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
  includeBanned?: boolean;
  keywords?: string[];
  keywordMatchAll?: boolean;
  hasAttack?: boolean;
  hasBlock?: boolean;
  isCharacter?: boolean;
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

/** Legacy (pre multi-game) prefix: `uvs-decks:{key}`. */
const LEGACY_STORAGE_KEY_PREFIX = "uvs-decks";

/**
 * Per-game UI state (`tcgdecks:{game}:{key}`). Everything else (view mode, cards per row) is a
 * global preference (`tcgdecks:{key}`).
 */
const GAME_SCOPED_UI_KEYS = new Set([
  "activeDeckId",
  "galleryFilters",
  "rightSidebarAction",
  "galleryFormat",
  "gallerySets",
  "gallerySortField",
  "gallerySortDirection",
]);

function getStorageKey(game: GameId, key: string): string {
  return GAME_SCOPED_UI_KEYS.has(key) ? gameStorageKey(game, key) : globalStorageKey(key);
}

function getLegacyStorageKey(game: GameId, key: string): string | null {
  const legacyKey = `${LEGACY_STORAGE_KEY_PREFIX}:${key}`;
  return GAME_SCOPED_UI_KEYS.has(key) ? legacyGameKey(game, legacyKey) : legacyKey;
}

function readItem(game: GameId, key: string): string | null {
  return readStorageWithLegacy(getStorageKey(game, key), getLegacyStorageKey(game, key));
}

function normalizePersistedGalleryFilters(raw: CardFilters | undefined): CardFilters | undefined {
  if (!raw) return undefined;
  if (!raw.symbols?.length) return raw;
  const stripped = raw.symbols.filter((s) => s.toLowerCase() !== "infinity");
  if (stripped.length === raw.symbols.length) return raw;
  const next: CardFilters = { ...raw };
  if (stripped.length === 0) delete next.symbols;
  else next.symbols = stripped;
  return next;
}

function loadPersistedUIState(game: GameId): UIState {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const activeDeckId = readItem(game, "activeDeckId") ?? undefined;
    const filtersRaw = readItem(game, "galleryFilters");
    const galleryFilters =
      filtersRaw !== null ? normalizePersistedGalleryFilters(JSON.parse(filtersRaw)) : undefined;
    const galleryViewMode = (readItem(game, "galleryViewMode") as GalleryViewMode) ?? undefined;
    const galleryCardsPerRow = resolveGalleryCardsPerRowPreference({
      single: parseStoredCardsPerRow(readItem(game, "galleryCardsPerRow")),
      open: parseStoredCardsPerRow(readItem(game, "galleryCardsPerRowOpen")),
      closed: parseStoredCardsPerRow(readItem(game, "galleryCardsPerRowClosed")),
    });
    const rightSidebarAction = readItem(game, "rightSidebarAction") ?? undefined;
    const galleryFormat = readItem(game, "galleryFormat") ?? undefined;
    const gallerySetsRaw = readItem(game, "gallerySets");
    const gallerySets = gallerySetsRaw ? JSON.parse(gallerySetsRaw) : undefined;
    const gallerySortField = readItem(game, "gallerySortField") ?? undefined;
    const gallerySortDirection = (readItem(game, "gallerySortDirection") as "asc" | "desc") ?? undefined;

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

function persistUIState(state: UIState, game: GameId) {
  if (typeof window === "undefined") return;
  try {
    if (state.activeDeckId) {
      localStorage.setItem(getStorageKey(game, "activeDeckId"), state.activeDeckId);
    } else {
      localStorage.removeItem(getStorageKey(game, "activeDeckId"));
    }

    if (state.galleryFilters) {
      localStorage.setItem(getStorageKey(game, "galleryFilters"), JSON.stringify(state.galleryFilters));
    } else {
      localStorage.removeItem(getStorageKey(game, "galleryFilters"));
    }

    if (state.galleryViewMode) {
      localStorage.setItem(getStorageKey(game, "galleryViewMode"), state.galleryViewMode);
    } else {
      localStorage.removeItem(getStorageKey(game, "galleryViewMode"));
    }

    if (typeof state.galleryCardsPerRow === "number" && !Number.isNaN(state.galleryCardsPerRow)) {
      localStorage.setItem(getStorageKey(game, "galleryCardsPerRow"), state.galleryCardsPerRow.toString());
    }
    localStorage.removeItem(getStorageKey(game, "galleryCardsPerRowOpen"));
    localStorage.removeItem(getStorageKey(game, "galleryCardsPerRowClosed"));

    if (state.rightSidebarAction) {
      localStorage.setItem(getStorageKey(game, "rightSidebarAction"), state.rightSidebarAction);
    } else {
      localStorage.removeItem(getStorageKey(game, "rightSidebarAction"));
    }

    if (state.galleryFormat) {
      localStorage.setItem(getStorageKey(game, "galleryFormat"), state.galleryFormat);
    } else {
      localStorage.removeItem(getStorageKey(game, "galleryFormat"));
    }

    if (state.gallerySets && state.gallerySets.length > 0) {
      localStorage.setItem(getStorageKey(game, "gallerySets"), JSON.stringify(state.gallerySets));
    } else {
      localStorage.removeItem(getStorageKey(game, "gallerySets"));
    }

    if (state.gallerySortField) {
      localStorage.setItem(getStorageKey(game, "gallerySortField"), state.gallerySortField);
    } else {
      localStorage.removeItem(getStorageKey(game, "gallerySortField"));
    }

    if (state.gallerySortDirection) {
      localStorage.setItem(getStorageKey(game, "gallerySortDirection"), state.gallerySortDirection);
    } else {
      localStorage.removeItem(getStorageKey(game, "gallerySortDirection"));
    }
  } catch {
  }
}

const PERSIST_DEBOUNCE_MS = 120;
const IDLE_PERSIST_TIMEOUT_MS = 2500;

interface UIStateProviderProps {
  children: ReactNode;
}

export function UIStateProvider({ children }: UIStateProviderProps) {
  const game = useGameId();
  const [uiState, setUIState] = useState<UIState>(() =>
    typeof window === "undefined" ? {} : loadPersistedUIState(game)
  );
  const latestUIStateRef = useRef(uiState);
  latestUIStateRef.current = uiState;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRef = useRef<{ id: number; isIdleCallback: boolean } | null>(null);
  const isHydrated = typeof window !== "undefined";
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const serverActiveDeckId = useQuery(api.sessions.getActiveDeckId, isAuthenticated ? { game } : "skip");
  const setActiveDeckMutation = useMutation(api.sessions.setActiveDeck);

  useEffect(() => {
    if (isHydrated && isAuthenticated && !authLoading && serverActiveDeckId !== undefined) {
      const nextActiveDeckId = serverActiveDeckId ?? undefined;
      if (uiState.activeDeckId === nextActiveDeckId) {
        return;
      }
      queueMicrotask(() => {
        setUIState((prev) => ({ ...prev, activeDeckId: nextActiveDeckId }));
        if (serverActiveDeckId) localStorage.setItem(getStorageKey(game, "activeDeckId"), serverActiveDeckId);
        else localStorage.removeItem(getStorageKey(game, "activeDeckId"));
      });
    }
  }, [isHydrated, isAuthenticated, authLoading, serverActiveDeckId, uiState.activeDeckId, game]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated && !authLoading && uiState.activeDeckId) {
      setUIState((prev) => ({ ...prev, activeDeckId: undefined }));
      localStorage.removeItem(getStorageKey(game, "activeDeckId"));
    }
  }, [isHydrated, isAuthenticated, authLoading, uiState.activeDeckId, game]);

  const cancelScheduledPersist = useCallback(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const idle = idleRef.current;
    if (idle !== null) {
      if (idle.isIdleCallback && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idle.id);
      } else {
        clearTimeout(idle.id);
      }
      idleRef.current = null;
    }
  }, []);

  const flushPersistUIState = useCallback(() => {
    cancelScheduledPersist();
    persistUIState(latestUIStateRef.current, game);
  }, [cancelScheduledPersist, game]);

  useEffect(() => {
    if (!isHydrated) return;
    cancelScheduledPersist();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const run = () => {
        idleRef.current = null;
        persistUIState(latestUIStateRef.current, game);
      };
      if (typeof requestIdleCallback !== "undefined") {
        idleRef.current = {
          id: requestIdleCallback(run, { timeout: IDLE_PERSIST_TIMEOUT_MS }),
          isIdleCallback: true,
        };
      } else {
        idleRef.current = {
          id: window.setTimeout(run, 0),
          isIdleCallback: false,
        };
      }
    }, PERSIST_DEBOUNCE_MS);
    return () => {
      cancelScheduledPersist();
    };
  }, [isHydrated, uiState, cancelScheduledPersist, game]);

  useEffect(() => {
    if (!isHydrated) return;
    const onLifecycleFlush = () => {
      flushPersistUIState();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPersistUIState();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onLifecycleFlush);
    window.addEventListener("beforeunload", onLifecycleFlush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onLifecycleFlush);
      window.removeEventListener("beforeunload", onLifecycleFlush);
    };
  }, [isHydrated, flushPersistUIState]);

  useEffect(() => {
    if (!isHydrated) return;
    return () => {
      cancelScheduledPersist();
      persistUIState(latestUIStateRef.current, game);
    };
  }, [isHydrated, cancelScheduledPersist, game]);

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
          game,
          deckId: deckId ? (deckId as Id<"decks">) : undefined,
        });
      }
    },
    [setActiveDeckMutation, isAuthenticated, game]
  );

  const setGalleryViewMode = useCallback((mode: GalleryViewMode) => {
    setUIState((prev) => ({ ...prev, galleryViewMode: mode }));
  }, []);

  const setGalleryCardsPerRow = useCallback((count: number | undefined) => {
    setUIState((prev) => ({
      ...prev,
      galleryCardsPerRow: count,
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
