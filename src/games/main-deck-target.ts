import type { SharedGameModule } from "@shared/games/types";

const FALLBACK_MAIN_DECK_TARGET = 60;

/**
 * Main-deck size a deck tile / hero treats as "Ready": the game's default format `minDeckSize`
 * (UVS 60, Cyberpunk 40).
 */
export function mainDeckTarget(module: Pick<SharedGameModule, "defaultFormats">): number {
  const format = module.defaultFormats.find((entry) => entry.isDefault) ?? module.defaultFormats[0];
  return format?.minDeckSize ?? FALLBACK_MAIN_DECK_TARGET;
}
