import type { ComponentType } from "react";

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

export interface ShellSlotState {
  slots: Map<SlotArea, SlotRegistration[]>;
  activeSidebarActionId: string | null;
  sidebarWidth: number;
}

export interface ShellSlotActions {
  registerSlot: (area: SlotArea, registration: SlotRegistration) => void;
  unregisterSlot: (area: SlotArea, id: string) => void;
  setActiveSidebarAction: (id: string | null) => void;
  setSidebarWidth: (width: number) => void;
}

export interface ShellSlotContextValue {
  state: ShellSlotState;
  actions: ShellSlotActions;
}
