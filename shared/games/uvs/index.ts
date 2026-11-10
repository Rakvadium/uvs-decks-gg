import type { SharedGameModule } from "../types";
import { UVS_FILTER_DEFINITION } from "./filters";
import { UVS_DECK_MODULE } from "./deck";
import { UVS_DEFAULT_FORMATS } from "./formats";
import { UVS_DECK_TEXT_PLACEHOLDER } from "./deck-text";

export const UVS_SHARED_GAME_MODULE = {
  id: "uvs",
  displayName: "UniVersus",
  shortName: "UVS",
  // Mirrors UNIVERSUS_CONFIG.theme in src/config/universus.ts (shared code must not import src/).
  theme: {
    primary: "220 90% 56%",
    secondary: "262 83% 58%",
    accent: "142 76% 36%",
  },
  brand: {
    wordmark: ["UVS", "DECKS", ".GG"],
    title: "UVSDECKS.GG",
    description:
      "Build UniVersus decks, browse the card gallery, and explore community tier lists on UVSDECKS.GG.",
  },
  filters: UVS_FILTER_DEFINITION,
  deck: UVS_DECK_MODULE,
  defaultFormats: UVS_DEFAULT_FORMATS,
  // Everything the app shipped before multi-game.
  features: {
    collection: true,
    deckStats: true,
    drawSimulator: true,
    deckImportExport: { formatLabel: "UVS Ultra", placeholder: UVS_DECK_TEXT_PLACEHOLDER },
    deckValidation: true,
    sideboard: true,
    referenceSection: true,
    tierLists: true,
    rankings: true,
    creators: true,
    communityMedia: {
      dockLabel: "UniVersus",
      feedHeading: "UniVersus Content",
      youtubeChannelUrl: "https://www.youtube.com/@UniVersusCCG",
      youtubeChannelLabel: "UniVersus on YouTube",
    },
    cardOcrDrafts: true,
  },
} as const satisfies SharedGameModule;
