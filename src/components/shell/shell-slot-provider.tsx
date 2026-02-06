export {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_KEY,
} from "./shell-slot-provider/types";
export type {
  ShellSlotActions,
  ShellSlotContextValue,
  ShellSlotState,
  SlotArea,
  SlotIcon,
  SlotRegistration,
  SlotRegistrationOptions,
} from "./shell-slot-provider/types";

export { ShellSlotProvider, useShellSlot } from "./shell-slot-provider/context";
export { useRegisterSlot } from "./shell-slot-provider/use-register-slot";
export { SlotRenderer } from "./shell-slot-provider/slot-renderer";
