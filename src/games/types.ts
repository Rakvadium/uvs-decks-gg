import type { SharedGameModule } from "@shared/games/types";

/**
 * Client-side game module: the shared module plus React components/hooks.
 * Intentionally minimal for now; later phases add card rendering, pickers, filter inputs, etc.
 */
export type ClientGameModule = SharedGameModule;
