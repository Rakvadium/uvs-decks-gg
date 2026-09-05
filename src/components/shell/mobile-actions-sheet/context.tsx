"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
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
  defaultSlot: SlotRegistration | undefined;
  activeSlot: SlotRegistration | undefined;
  ActiveComponent: SlotRegistration["component"] | undefined;
  ActiveHeader: SlotRegistration["header"] | undefined;
  ActiveFooter: SlotRegistration["footer"] | undefined;
  openSheet: (slotId?: string) => void;
  closeSheet: () => void;
  handleOpenChange: (open: boolean) => void;
  selectSlot: (id: string) => void;
}

const MobileActionsSheetContext = createContext<MobileActionsSheetContextValue | null>(null);

export function MobileActionsSheetProvider({ children }: { children: ReactNode }) {
  const { isActionsSheetOpen, setActionsSheetOpen } = useMobileShell();
  const slots = useShellSlotSlots();
  const activeActionId = useShellSlotActiveSidebarActionId();
  const { setActiveSidebarAction } = useShellSlotActions();

  const sidebarSlots = useMemo(() => slots.get("right-sidebar") ?? [], [slots]);
  const defaultSlot = sidebarSlots[0];
  const activeSlot = sidebarSlots.find((slot) => slot.id === activeActionId) ?? defaultSlot;
  const ActiveComponent = activeSlot?.component;
  const ActiveHeader = activeSlot?.header;
  const ActiveFooter = activeSlot?.footer;

  const closeSheet = useCallback(() => {
    setActionsSheetOpen(false);
  }, [setActionsSheetOpen]);

  const openSheet = useCallback(
    (slotId?: string) => {
      const target = slotId ?? defaultSlot?.id ?? null;
      setActiveSidebarAction(target);
      setActionsSheetOpen(true);
    },
    [defaultSlot?.id, setActionsSheetOpen, setActiveSidebarAction]
  );

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
      defaultSlot,
      activeSlot,
      ActiveComponent,
      ActiveHeader,
      ActiveFooter,
      openSheet,
      closeSheet,
      handleOpenChange,
      selectSlot,
    }),
    [
      isActionsSheetOpen,
      sidebarSlots,
      defaultSlot,
      activeSlot,
      ActiveComponent,
      ActiveHeader,
      ActiveFooter,
      openSheet,
      closeSheet,
      handleOpenChange,
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
