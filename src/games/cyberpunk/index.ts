import { CYBERPUNK_SHARED_GAME_MODULE } from "@shared/games/cyberpunk";
import type { ClientGameModule } from "../types";
import { CYBERPUNK_CLIENT_UI } from "./ui";

export const CYBERPUNK_CLIENT_GAME_MODULE: ClientGameModule = {
  ...CYBERPUNK_SHARED_GAME_MODULE,
  ui: CYBERPUNK_CLIENT_UI,
};
