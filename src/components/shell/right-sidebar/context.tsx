"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  useShellSlotActions,
  useActiveSidebarActionId,
  useShellSlotData,
  type SlotRegistration,
} from "../shell-slot-provider";
import { useRightSidebarResize } from "./use-resize";

type SlotComponent = ComponentType;

interface RightSidebarContextValue {
  sidebarSlots: SlotRegistration[];
  activeActionId: string | null;
  activeSlot: SlotRegistration | undefined;
  ActiveComponent: SlotComponent | undefined;
  ActiveHeader: SlotComponent | undefined;
  ActiveFooter: SlotComponent | undefined;
  isExpanded: boolean;
  isResizing: boolean;
  panelWidth: number;
  setActiveSidebarAction: (id: string | null) => void;
  handleResizeStart: (event: ReactMouseEvent) => void;
}

const RightSidebarContext = createContext<RightSidebarContextValue | null>(null);

export function RightSidebarProvider({ children }: { children: ReactNode }) {
  const actions = useShellSlotActions();
  const activeActionId = useActiveSidebarActionId();
  const { slots, sidebarWidth } = useShellSlotData();
  const sidebarSlots = useMemo(() => slots.get("right-sidebar") ?? [], [slots]);
  const setActiveSidebarAction = actions.setActiveSidebarAction;

  const activeSlot = sidebarSlots.find((slot) => slot.id === activeActionId);
  const ActiveComponent = activeSlot?.component;
  const ActiveHeader = activeSlot?.header;
  const ActiveFooter = activeSlot?.footer;
  const isExpanded = Boolean(activeActionId && ActiveComponent);

  const { isResizing, panelWidth, handleResizeStart } = useRightSidebarResize({
    sidebarWidth,
    onWidthCommit: actions.setSidebarWidth,
  });

  const value = useMemo(
    (): RightSidebarContextValue => ({
      sidebarSlots,
      activeActionId,
      activeSlot,
      ActiveComponent,
      ActiveHeader,
      ActiveFooter,
      isExpanded,
      isResizing,
      panelWidth,
      setActiveSidebarAction,
      handleResizeStart,
    }),
    [
      sidebarSlots,
      activeActionId,
      activeSlot,
      ActiveComponent,
      ActiveHeader,
      ActiveFooter,
      isExpanded,
      isResizing,
      panelWidth,
      setActiveSidebarAction,
      handleResizeStart,
    ]
  );

  return <RightSidebarContext.Provider value={value}>{children}</RightSidebarContext.Provider>;
}

export function useRightSidebarContext() {
  const context = useContext(RightSidebarContext);

  if (!context) {
    throw new Error("useRightSidebarContext must be used within RightSidebarProvider");
  }

  return context;
}
