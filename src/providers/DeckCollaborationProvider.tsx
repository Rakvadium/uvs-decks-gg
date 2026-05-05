"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useDeckDetails } from "./DeckDetailsProvider";
import { useUIState } from "./UIStateProvider";
import { isTeamEditableDeck } from "@/lib/deck/visibility";

const STALE_MS = 60_000;

type Cursor = {
  x: number;
  y: number;
  viewportW: number;
  viewportH: number;
  normX: number;
  normY: number;
};

type OtherPresence = {
  sessionId: string;
  userId: string;
  color: string;
  label: string;
  cursor: Cursor;
};

type DeckCollaborationContextValue = {
  enabled: boolean;
  others: OtherPresence[];
};

const DeckCollaborationContext = createContext<DeckCollaborationContextValue>({
  enabled: false,
  others: [],
});

export function useDeckCollaborationState(): DeckCollaborationContextValue {
  return useContext(DeckCollaborationContext);
}

function DeckCollaborationCursorsLayer() {
  const { enabled, others } = useDeckCollaborationState();
  if (!enabled || others.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      {others.map((o) => (
        <div
          key={o.sessionId}
          className="absolute"
          style={{
            left: `${o.cursor.normX * 100}%`,
            top: `${o.cursor.normY * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-white shadow-md"
            style={{ backgroundColor: o.color }}
          >
            <span
              className="h-2 w-2 rounded-full bg-white/90 ring-2 ring-white"
              style={{ boxShadow: `0 0 0 2px ${o.color}` }}
            />
            {o.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeckCollaborationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const { deck, deckId, activeSection, setActiveSection } = useDeckDetails();
  const { uiState, setRightSidebarAction, setGalleryFilters } = useUIState();

  const [clientSessionId, setClientSessionId] = useState<string | null>(null);
  useEffect(() => {
    setClientSessionId(crypto.randomUUID());
  }, []);

  const lastCursorRef = useRef<Cursor>({
    x: 0,
    y: 0,
    viewportW: 1,
    viewportH: 1,
    normX: 0,
    normY: 0,
  });

  const applyingRemoteRef = useRef(false);
  const lastProcessedSessionUpdatedAtRef = useRef(0);
  const heartbeatRafRef = useRef(0);

  const collabEnabled =
    isAuthenticated &&
    !!deck &&
    !!deckId &&
    isTeamEditableDeck(deck);

  const typedDeckId = (deckId ?? null) as Id<"decks"> | null;

  useEffect(() => {
    lastProcessedSessionUpdatedAtRef.current = 0;
  }, [typedDeckId]);

  const builderSession = useQuery(
    api.teams.deckCollaboration.getBuilderSession,
    collabEnabled && typedDeckId ? { deckId: typedDeckId } : "skip",
  );

  const presenceRows = useQuery(
    api.teams.deckCollaboration.listPresence,
    collabEnabled && typedDeckId ? { deckId: typedDeckId } : "skip",
  );

  const patchUiState = useMutation(api.teams.deckCollaboration.patchBuilderUiState);
  const presenceHeartbeat = useMutation(api.teams.deckCollaboration.presenceHeartbeat);

  useEffect(() => {
    if (!collabEnabled || !typedDeckId || !clientSessionId) return;
    const onMove = (e: PointerEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      lastCursorRef.current = {
        x: e.clientX,
        y: e.clientY,
        viewportW: vw,
        viewportH: vh,
        normX: vw > 0 ? e.clientX / vw : 0,
        normY: vh > 0 ? e.clientY / vh : 0,
      };
      if (heartbeatRafRef.current) return;
      heartbeatRafRef.current = requestAnimationFrame(() => {
        heartbeatRafRef.current = 0;
        void presenceHeartbeat({
          deckId: typedDeckId,
          sessionId: clientSessionId,
          cursor: lastCursorRef.current,
        });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [collabEnabled, typedDeckId, clientSessionId, presenceHeartbeat]);

  useEffect(() => {
    if (!collabEnabled || !typedDeckId || !clientSessionId) return;
    const id = setInterval(() => {
      void presenceHeartbeat({
        deckId: typedDeckId,
        sessionId: clientSessionId,
        cursor: lastCursorRef.current,
      });
    }, 18_000);
    return () => clearInterval(id);
  }, [collabEnabled, typedDeckId, clientSessionId, presenceHeartbeat]);

  useEffect(() => {
    if (!collabEnabled || builderSession === undefined || builderSession === null) {
      return;
    }
    if (builderSession.updatedAt <= lastProcessedSessionUpdatedAtRef.current) {
      return;
    }
    lastProcessedSessionUpdatedAtRef.current = builderSession.updatedAt;
    applyingRemoteRef.current = true;
    const st = builderSession.uiState;
    if (st.rightSidebarAction !== undefined && st.rightSidebarAction !== uiState.rightSidebarAction) {
      setRightSidebarAction(st.rightSidebarAction);
    }
    if (
      st.galleryFilters &&
      JSON.stringify(st.galleryFilters) !== JSON.stringify(uiState.galleryFilters)
    ) {
      setGalleryFilters(st.galleryFilters);
    }
    if (st.activeDeckSection && st.activeDeckSection !== activeSection) {
      setActiveSection(st.activeDeckSection);
    }
    requestAnimationFrame(() => {
      applyingRemoteRef.current = false;
    });
  }, [
    collabEnabled,
    builderSession,
    uiState.rightSidebarAction,
    uiState.galleryFilters,
    activeSection,
    setRightSidebarAction,
    setGalleryFilters,
    setActiveSection,
  ]);

  useEffect(() => {
    if (!collabEnabled || !typedDeckId || applyingRemoteRef.current) return;
    const t = setTimeout(() => {
      void patchUiState({
        deckId: typedDeckId,
        uiStatePatch: {
          rightSidebarAction: uiState.rightSidebarAction,
          galleryFilters: uiState.galleryFilters,
          activeDeckSection: activeSection,
        },
        deckRevision: deck?.revision,
      });
    }, 220);
    return () => clearTimeout(t);
  }, [
    collabEnabled,
    typedDeckId,
    deck?.revision,
    uiState.rightSidebarAction,
    uiState.galleryFilters,
    activeSection,
    patchUiState,
    deck,
  ]);

  const others = useMemo(() => {
    if (!collabEnabled || !presenceRows || !clientSessionId) return [];
    const now = Date.now();
    return presenceRows
      .filter(
        (p) => p.sessionId !== clientSessionId && now - p.lastSeenAt < STALE_MS,
      )
      .map((p) => ({
        sessionId: p.sessionId,
        userId: p.userId as string,
        color: p.color,
        label: p.label,
        cursor: p.cursor,
      }));
  }, [collabEnabled, presenceRows, clientSessionId]);

  const contextValue = useMemo(
    () => ({
      enabled: collabEnabled,
      others,
    }),
    [collabEnabled, others],
  );

  return (
    <DeckCollaborationContext.Provider value={contextValue}>
      {children}
      <DeckCollaborationCursorsLayer />
    </DeckCollaborationContext.Provider>
  );
}
