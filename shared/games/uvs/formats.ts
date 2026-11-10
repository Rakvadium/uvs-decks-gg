import type { GameFormatSeed } from "../types";

/** Formats `admin.seedFormats` creates for UniVersus (moved from `convex/admin.ts`, unchanged). */
export const UVS_DEFAULT_FORMATS: readonly GameFormatSeed[] = [
  {
    key: "standard",
    name: "Standard",
    description: "The primary competitive format featuring the most recent sets.",
    isDefault: true,
    minDeckSize: 60,
    maxDeckSize: undefined,
    sideboardRule: "exact:10",
    defaultCopyLimit: 4,
    requiresStartingCharacter: true,
    requiresIdentity: true,
  },
  {
    key: "heroic",
    name: "Heroic",
    description: "An extended format including older sets.",
    isDefault: false,
    minDeckSize: 60,
    maxDeckSize: undefined,
    sideboardRule: "optional",
    defaultCopyLimit: 4,
    requiresStartingCharacter: true,
    requiresIdentity: false,
  },
  {
    key: "retro",
    name: "Retro",
    description: "A legacy format including all sets from the game's history.",
    isDefault: false,
    minDeckSize: 60,
    maxDeckSize: undefined,
    sideboardRule: "optional",
    defaultCopyLimit: 4,
    requiresStartingCharacter: true,
    requiresIdentity: false,
  },
];
