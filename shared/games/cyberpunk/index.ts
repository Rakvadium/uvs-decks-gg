import type { SharedGameModule } from "../types";
import { CYBERPUNK_DECK_MODULE } from "./deck";
import { CYBERPUNK_FILTER_DEFINITION } from "./filters";
import { CYBERPUNK_DEFAULT_FORMATS } from "./formats";
import { CYBERPUNK_DECK_TEXT_PLACEHOLDER } from "./deck-text";

export const CYBERPUNK_SHARED_GAME_MODULE = {
  id: "cyberpunk",
  displayName: "Cyberpunk TCG",
  shortName: "CPK",
  theme: {
    primary: "55 98% 51%",
    secondary: "184 100% 50%",
    accent: "350 90% 55%",
  },
  brand: {
    wordmark: ["TCG", "DECKS", ".GG"],
    title: "Cyberpunk TCG · TCGDECKS.GG",
    description:
      "Build Cyberpunk TCG decks around your Legends, browse the card gallery, and share lists on TCGDECKS.GG.",
  },
  filters: CYBERPUNK_FILTER_DEFINITION,
  deck: CYBERPUNK_DECK_MODULE,
  defaultFormats: CYBERPUNK_DEFAULT_FORMATS,
  features: {
    collection: true,
    deckStats: true,
    drawSimulator: true,
    deckImportExport: { formatLabel: "Plain text", placeholder: CYBERPUNK_DECK_TEXT_PLACEHOLDER },
    deckValidation: true,
    // The format allows no sideboard (`sideboardRule "max:0"`); no reference section either.
    sideboard: false,
    referenceSection: false,
    tierLists: true,
    rankings: true,
    // No curated Cyberpunk media / creator program yet.
    creators: false,
    communityMedia: false,
    // The image → draft OCR flow is UVS-specific (symbols, zones, attack stats).
    cardOcrDrafts: false,
  },
} as const satisfies SharedGameModule;
