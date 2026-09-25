import type { SharedGameModule } from "../types";
import { UVS_FILTER_DEFINITION } from "./filters";
import { UVS_DECK_MODULE } from "./deck";

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
} as const satisfies SharedGameModule;
