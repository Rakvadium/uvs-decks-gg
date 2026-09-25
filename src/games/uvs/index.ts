import { UVS_SHARED_GAME_MODULE } from "@shared/games/uvs";
import type { ClientGameModule } from "../types";
import { UVS_CLIENT_UI } from "./ui";

export const UVS_CLIENT_GAME_MODULE: ClientGameModule = {
  ...UVS_SHARED_GAME_MODULE,
  ui: UVS_CLIENT_UI,
};
