"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useMobileShell } from "../mobile-shell-context";
import { useShellSlot, type SlotRegistration } from "../shell-slot-provider";

interface MobileActionsSheetContextValue {
  isActionsSheetOpen: boolean;
  sidebarSlots: SlotRegistration[];
  activeSlot: SlotRegistration | undefined;
  ActiveComponent: SlotRegistration["component"] | undefined;
  ActiveHeader: SlotRegistration["header"] | undefined;
  ActiveFooter: SlotRegistration["footer"] | undefined;
  openSheet: () => void;
  closeSheet: () => void;
  handleOpenChange: (open: boolean) => void;
  handleBack: () => void;
  selectSlot: (id: string) => void;
}

const MobileActionsSheetContext = createContext<MobileActionsSheetContextValue | null>(null);

export function MobileActionsSheetProvider({ children }: { children: ReactNode }) {
  const { isActionsSheetOpen, setActionsSheetOpen } = useMobileShell();
  const { state, actions } = useShellSlot();

  const sidebarSlots = useMemo(() => state.slots.get("right-sidebar") ?? [], [state.slots]);
  const activeActionId = state.activeSidebarActionId;
  const setActiveSidebarAction = actions.setActiveSidebarAction;

  const activeSlot = sidebarSlots.find((slot) => slot.id === activeActionId);
  const ActiveComponent = activeSlot?.component;
  const ActiveHeader = activeSlot?.header;
  const ActiveFooter = activeSlot?.footer;

  const closeSheet = useCallback(() => {
    setActionsSheetOpen(false);
    setActiveSidebarAction(null);
  }, [setActionsSheetOpen, setActiveSidebarAction]);

  const openSheet = useCallback(() => {
    setActionsSheetOpen(true);
  }, [setActionsSheetOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeSheet();
        return;
      }

      openSheet();
    },
    [closeSheet, openSheet]
  );

  const handleBack = useCallback(() => {
    setActiveSidebarAction(null);
  }, [setActiveSidebarAction]);

  const selectSlot = useCallback(
    (id: string) => {
      setActiveSidebarAction(id);
    },
    [setActiveSidebarAction]
  );

  const value = useMemo(
    (): MobileActionsSheetContextValue => ({
      isActionsSheetOpen,
      sidebarSlots,
      activeSlot,
      ActiveComponent,
      ActiveHeader,
      ActiveFooter,
      openSheet,
      closeSheet,
      handleOpenChange,
      handleBack,
      selectSlot,
    }),
    [
      isActionsSheetOpen,
      sidebarSlots,
      activeSlot,
      ActiveComponent,
      ActiveHeader,
      ActiveFooter,
      openSheet,
      closeSheet,
      handleOpenChange,
      handleBack,
      selectSlot,
    ]
  );

  return <MobileActionsSheetContext.Provider value={value}>{children}</MobileActionsSheetContext.Provider>;
}

export function useMobileActionsSheetContext() {
  const context = useContext(MobileActionsSheetContext);
  if (!context) {
    throw new Error("useMobileActionsSheetContext must be used within MobileActionsSheetProvider");
  }

  return context;
}
