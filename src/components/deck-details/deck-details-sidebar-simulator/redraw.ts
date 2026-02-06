import { SIMULATOR_REDRAW_EVENT } from "./constants";

export function dispatchSimulatorRedraw() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SIMULATOR_REDRAW_EVENT));
}
