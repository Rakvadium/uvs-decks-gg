import type { SharedGameModule } from "../types";

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
} as const satisfies SharedGameModule;
