import type { GameFormatSeed } from "../types";
import { CYBERPUNK_DEFAULT_COPY_LIMIT } from "./card-eligibility";

/** Formats `admin.seedFormats` / `devSeed` create for Cyberpunk TCG. */
export const CYBERPUNK_DEFAULT_FORMATS: readonly GameFormatSeed[] = [
  {
    key: "standard",
    name: "Standard",
    description: "3 Legends with different names, 40–50 card main deck, up to 3 copies per card.",
    isDefault: true,
    minDeckSize: 40,
    maxDeckSize: 50,
    sideboardRule: "max:0",
    defaultCopyLimit: CYBERPUNK_DEFAULT_COPY_LIMIT,
    // UVS-only flags; the Cyberpunk rules ignore them.
    requiresStartingCharacter: false,
    requiresIdentity: false,
  },
];
