import { describe, expect, test } from "bun:test";
import { DEFAULT_GAME_ID, GAME_IDS, isGameId, type GameId } from "@shared/games/types";
import { SHARED_GAME_MODULES, getSharedGameModule, getSharedGameModuleOrDefault } from "@shared/games/registry";
import { CLIENT_GAME_MODULES, getClientGameModule } from "@/games/registry";
import { UNIVERSUS_CONFIG } from "@/config/universus";
import { gameIdValidator } from "../convex/validators";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
// Compile-time: the Convex validator's type is exactly GameId.
const validatorMatchesGameId: Equals<typeof gameIdValidator.type, GameId> = true;

describe("game ids", () => {
  test("GAME_IDS / DEFAULT_GAME_ID / isGameId", () => {
    expect(GAME_IDS).toEqual(["uvs", "cyberpunk"]);
    expect(DEFAULT_GAME_ID).toBe("uvs");
    expect(isGameId("uvs")).toBe(true);
    expect(isGameId("cyberpunk")).toBe(true);
    for (const value of ["UVS", "", "Cyberpunk", "cpk", "constructor", "__proto__", null, undefined, 1, {}]) {
      expect(isGameId(value)).toBe(false);
    }
  });

  test("gameIdValidator mirrors GAME_IDS", () => {
    expect(validatorMatchesGameId).toBe(true);
    expect(gameIdValidator.kind).toBe("union");
    expect(gameIdValidator.members.map((member) => member.value)).toEqual([...GAME_IDS]);
  });
});

describe("game registries", () => {
  test("every GameId has shared + client modules with matching ids", () => {
    for (const id of GAME_IDS) {
      expect(getSharedGameModule(id).id).toBe(id);
      expect(getClientGameModule(id).id).toBe(id);
    }
    expect(Object.keys(SHARED_GAME_MODULES).sort()).toEqual([...GAME_IDS].sort());
    expect(Object.keys(CLIENT_GAME_MODULES).sort()).toEqual([...GAME_IDS].sort());
  });

  test("lenient lookup falls back to the default game", () => {
    expect(getSharedGameModuleOrDefault("nope").id).toBe(DEFAULT_GAME_ID);
    expect(getSharedGameModuleOrDefault(null).id).toBe(DEFAULT_GAME_ID);
  });

  test("UVS module mirrors the legacy UniVersus config", () => {
    const uvs = getSharedGameModule("uvs");
    expect(uvs.displayName).toBe(UNIVERSUS_CONFIG.name);
    expect(uvs.theme).toEqual({ ...UNIVERSUS_CONFIG.theme });
  });
});
