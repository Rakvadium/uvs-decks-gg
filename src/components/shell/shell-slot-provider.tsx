"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ComponentType,
  ReactNode,
} from "react";

export type SlotArea = "top-bar" | "right-sidebar";

export type SlotIcon = ComponentType<{ className?: string }>;

export interface SlotRegistration {
  id: string;
  component: ComponentType;
  priority?: number;
  label?: string;
  icon?: SlotIcon;
  header?: ComponentType;
  footer?: ComponentType;
}

export interface SlotRegistrationOptions {
  priority?: number;
  label?: string;
  icon?: SlotIcon;
  header?: ComponentType;
  footer?: ComponentType;
}

export const MIN_SIDEBAR_WIDTH = 320;
export const MAX_SIDEBAR_WIDTH = 480;
export const DEFAULT_SIDEBAR_WIDTH = 400;
export const SIDEBAR_WIDTH_KEY = "uvs-decks-right-sidebar-width";

interface ShellSlotState {
  slots: Map<SlotArea, SlotRegistration[]>;
  activeSidebarActionId: string | null;
  sidebarWidth: number;
}

interface ShellSlotActions {
  registerSlot: (area: SlotArea, registration: SlotRegistration) => void;
  unregisterSlot: (area: SlotArea, id: string) => void;
  setActiveSidebarAction: (id: string | null) => void;
  setSidebarWidth: (width: number) => void;
}

interface ShellSlotContextValue {
  state: ShellSlotState;
  actions: ShellSlotActions;
}

const ShellSlotContext = createContext<ShellSlotContextValue | null>(null);

function getInitialSidebarWidth(): number {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
  const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
  if (stored === null) return DEFAULT_SIDEBAR_WIDTH;
  const parsed = parseInt(stored, 10);
  if (isNaN(parsed)) return DEFAULT_SIDEBAR_WIDTH;
  return Math.max(DEFAULT_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed));
}

export function ShellSlotProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Map<SlotArea, SlotRegistration[]>>(
    () => new Map()
  );
  const [activeSidebarActionId, setActiveSidebarActionIdState] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidthState] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setSidebarWidthState(getInitialSidebarWidth());
    setIsHydrated(true);
  }, []);

  const registerSlot = useCallback((area: SlotArea, registration: SlotRegistration) => {
    setSlots((prev) => {
      const next = new Map(prev);
      const areaSlots = next.get(area) ?? [];
      const filtered = areaSlots.filter((slot) => slot.id !== registration.id);
      const updated = [...filtered, registration].sort(
        (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
      );
      next.set(area, updated);
      return next;
    });
  }, []);

  const unregisterSlot = useCallback((area: SlotArea, id: string) => {
    setSlots((prev) => {
      const next = new Map(prev);
      const areaSlots = next.get(area) ?? [];
      next.set(
        area,
        areaSlots.filter((slot) => slot.id !== id)
      );
      return next;
    });
  }, []);

  const setActiveSidebarAction = useCallback((id: string | null) => {
    setActiveSidebarActionIdState(id);
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width));
    setSidebarWidthState(clampedWidth);
    if (typeof window !== "undefined") {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clampedWidth));
    }
  }, []);

  const actions = useMemo(
    (): ShellSlotActions => ({
      registerSlot,
      unregisterSlot,
      setActiveSidebarAction,
      setSidebarWidth,
    }),
    [registerSlot, unregisterSlot, setActiveSidebarAction, setSidebarWidth]
  );

  const value = useMemo(
    (): ShellSlotContextValue => ({
      state: { slots, activeSidebarActionId, sidebarWidth: isHydrated ? sidebarWidth : DEFAULT_SIDEBAR_WIDTH },
      actions,
    }),
    [slots, activeSidebarActionId, sidebarWidth, isHydrated, actions]
  );

  return (
    <ShellSlotContext.Provider value={value}>
      {children}
    </ShellSlotContext.Provider>
  );
}

export function useShellSlot(): ShellSlotContextValue {
  const context = useContext(ShellSlotContext);
  if (!context) {
    throw new Error("useShellSlot must be used within ShellSlotProvider");
  }
  return context;
}

export function useRegisterSlot(
  area: SlotArea,
  id: string,
  Component: ComponentType,
  options?: number | SlotRegistrationOptions
) {
  const { actions } = useShellSlot();

  useEffect(() => {
    const registration =
      typeof options === "number" || options === undefined
        ? { id, component: Component, priority: options }
        : { id, component: Component, ...options };
    actions.registerSlot(area, registration);
    return () => actions.unregisterSlot(area, id);
  }, [area, id, Component, options, actions]);
}

export function SlotRenderer({ area }: { area: SlotArea }) {
  const { state } = useShellSlot();
  const areaSlots = state.slots.get(area) ?? [];

  return (
    <>
      {areaSlots.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </>
  );
}
