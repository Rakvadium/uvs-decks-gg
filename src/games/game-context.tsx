"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import { getHostBrand } from "@shared/games/registry";
import { DEFAULT_GAME_ID, type Brand, type GameId } from "@shared/games/types";
import type { HostInfo, HostKind } from "@shared/hosts";
import { buildGameSwitcherModel, type GameSwitcherModel } from "./game-links";
import { getClientGameModule } from "./registry";
import type { GameFeatures } from "@shared/games/features";
import type { ClientGameModule } from "./types";

interface GameContextValue {
  game: GameId;
  hostKind: HostKind;
  module: ClientGameModule;
  brand: Brand;
  switcher: GameSwitcherModel | null;
}

// Outside a provider behave like a standalone host on the default game (today's behavior),
// so components can adopt these hooks before routing wires the provider in.
const GameContext = createContext<GameContextValue>({
  game: DEFAULT_GAME_ID,
  hostKind: "standalone",
  module: getClientGameModule(DEFAULT_GAME_ID),
  brand: getHostBrand("standalone", DEFAULT_GAME_ID),
  switcher: null,
});

export function GameProvider({
  game,
  hostKind,
  host,
  protocol = null,
  children,
}: {
  game: GameId;
  hostKind: HostKind;
  /** Resolved request host; enables cross-host links (game switcher) on game hosts. */
  host?: HostInfo;
  protocol?: string | null;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      game,
      hostKind,
      module: getClientGameModule(game),
      brand: getHostBrand(hostKind, game),
      switcher: host && hostKind === "game" ? buildGameSwitcherModel(host, game, protocol) : null,
    }),
    [game, hostKind, host, protocol],
  );
  return <GameContext value={value}>{children}</GameContext>;
}

export function useGameId(): GameId {
  return use(GameContext).game;
}

export function useGameModule(): ClientGameModule {
  return use(GameContext).module;
}

/** The current game's feature manifest (`SharedGameModule.features`). */
export function useGameFeatures(): GameFeatures {
  return use(GameContext).module.features;
}

export function useHostKind(): HostKind {
  return use(GameContext).hostKind;
}

/** Brand for the current host (platform brand on the apex, else the game's). */
export function useBrand(): Brand {
  return use(GameContext).brand;
}

/** Game switcher links, or `null` where switching isn't possible (standalone/apex hosts). */
export function useGameSwitcher(): GameSwitcherModel | null {
  return use(GameContext).switcher;
}
