import { CYBERPUNK_SHARED_GAME_MODULE } from "@shared/games/cyberpunk";
import type { ClientGameModule } from "../types";
import { UVS_CLIENT_UI } from "../uvs/ui";

// TODO(phase3-ui): placeholder so every GameId has a client module. Reuses the UVS UI components
// (card frame, symbols, setup picker, stats palette); Phase 3 wave B replaces `ui` with Cyberpunk
// components (text-frame cards, Legend picker, color/tag facets, cost/power/RAM stats).
export const CYBERPUNK_CLIENT_GAME_MODULE: ClientGameModule = {
  ...CYBERPUNK_SHARED_GAME_MODULE,
  ui: UVS_CLIENT_UI,
};
