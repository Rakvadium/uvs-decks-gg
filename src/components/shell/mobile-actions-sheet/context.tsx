"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useMobileShell } from "../mobile-shell-context";
import {
  useShellSlotActions,
  useShellSlotActiveSidebarActionId,
  useShellSlotSlots,
  type SlotRegistration,
} from "../shell-slot-provider";

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
  const slots = useShellSlotSlots();
  const activeActionId = useShellSlotActiveSidebarActionId();
  const { setActiveSidebarAction } = useShellSlotActions();

  const sidebarSlots = useMemo(() => slots.get("right-sidebar") ?? [], [slots]);

  const activeSlot = sidebarSlots.find((slot) => slot.id === activeActionId);
  const ActiveComponent = activeSlot?.component;
  const ActiveHeader = activeSlot?.header;
  const ActiveFooter = activeSlot?.footer;

  const closeSheet = useCallback(() => {
    setActionsSheetOpen(false);
  }, [setActionsSheetOpen]);

  const openSheet = useCallback(() => {
    setActionsSheetOpen(true);
  }, [setActionsSheetOpen]);

  useEffect(() => {
    if (!isActionsSheetOpen || activeActionId || sidebarSlots.length !== 1) {
      return;
    }
    const onlySlot = sidebarSlots[0];
    if (!onlySlot) return;
    setActiveSidebarAction(onlySlot.id);
  }, [activeActionId, isActionsSheetOpen, setActiveSidebarAction, sidebarSlots]);

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
    if (sidebarSlots.length <= 1) {
      setActiveSidebarAction(null);
      closeSheet();
      return;
    }
    setActiveSidebarAction(null);
    openSheet();
  }, [closeSheet, openSheet, setActiveSidebarAction, sidebarSlots.length]);

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
