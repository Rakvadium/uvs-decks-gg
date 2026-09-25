"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import { DEFAULT_GAME_ID, type GameId } from "@shared/games/types";
import type { HostKind } from "@shared/hosts";
import { getClientGameModule } from "./registry";
import type { ClientGameModule } from "./types";

interface GameContextValue {
  game: GameId;
  hostKind: HostKind;
  module: ClientGameModule;
}

// Outside a provider behave like a standalone host on the default game (today's behavior),
// so components can adopt these hooks before routing wires the provider in.
const GameContext = createContext<GameContextValue>({
  game: DEFAULT_GAME_ID,
  hostKind: "standalone",
  module: getClientGameModule(DEFAULT_GAME_ID),
});

export function GameProvider({
  game,
  hostKind,
  children,
}: {
  game: GameId;
  hostKind: HostKind;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ game, hostKind, module: getClientGameModule(game) }),
    [game, hostKind],
  );
  return <GameContext value={value}>{children}</GameContext>;
}

export function useGameId(): GameId {
  return use(GameContext).game;
}

export function useGameModule(): ClientGameModule {
  return use(GameContext).module;
}

export function useHostKind(): HostKind {
  return use(GameContext).hostKind;
}
