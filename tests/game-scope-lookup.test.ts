import { describe, expect, test } from "bun:test";
import {
  collectInGame,
  findDefaultFormat,
  findInGame,
  firstLoggingDuplicates,
  gameTagPatch,
  resolveGame,
  withResolvedGame,
} from "../convex/lib/gameScope";
import type { GameId } from "../shared/games/types";

type Row = { id: string; game?: GameId };

/** Fake index: rows keyed by their `game` value (undefined = legacy untagged). */
function lookupFrom(rows: Row[]) {
  const calls: Array<GameId | undefined> = [];
  return {
    calls,
    first: async (value: GameId | undefined) => {
      calls.push(value);
      return rows.find((row) => row.game === value) ?? null;
    },
    all: async (value: GameId | undefined) => {
      calls.push(value);
      return rows.filter((row) => row.game === value);
    },
  };
}

describe("findInGame (legacy-aware lookup)", () => {
  test("prefers the tagged row and stops there", async () => {
    const index = lookupFrom([{ id: "legacy" }, { id: "tagged", game: "uvs" }]);
    expect(await findInGame("uvs", index.first)).toEqual({ id: "tagged", game: "uvs" });
    expect(index.calls).toEqual(["uvs"]);
  });

  test("falls back to the untagged legacy row for the default game", async () => {
    const index = lookupFrom([{ id: "legacy" }]);
    expect(await findInGame("uvs", index.first)).toEqual({ id: "legacy" });
    expect(index.calls).toEqual(["uvs", undefined]);
  });

  test("returns null when nothing matches", async () => {
    const index = lookupFrom([]);
    expect(await findInGame("uvs", index.first)).toBeNull();
  });
});

describe("collectInGame", () => {
  test("concatenates tagged then legacy rows for the default game", async () => {
    const index = lookupFrom([{ id: "legacy" }, { id: "a", game: "uvs" }, { id: "b", game: "uvs" }]);
    const rows = await collectInGame("uvs", index.all);
    expect(rows.map((row) => row.id)).toEqual(["a", "b", "legacy"]);
  });
});

describe("gameTagPatch", () => {
  test("tags untagged docs and leaves tagged docs alone", () => {
    expect(gameTagPatch({}, "uvs")).toEqual({ game: "uvs" });
    expect(gameTagPatch({ game: "uvs" }, "uvs")).toBeNull();
  });

  test("spreads cleanly into a patch", () => {
    expect({ ...gameTagPatch({ game: "uvs" }, "uvs"), name: "x" }).toEqual({ name: "x" });
    expect({ ...gameTagPatch({}, "uvs"), name: "x" }).toEqual({ game: "uvs", name: "x" });
  });
});

describe("firstLoggingDuplicates", () => {
  test("returns the first row (null when empty) without throwing on duplicates", async () => {
    const warn = console.warn;
    const warnings: unknown[] = [];
    console.warn = (...args: unknown[]) => warnings.push(args);
    try {
      expect(await firstLoggingDuplicates({ take: async () => [1, 2] }, "dup")).toBe(1);
      expect(warnings).toHaveLength(1);
      expect(await firstLoggingDuplicates({ take: async () => [3] }, "one")).toBe(3);
      expect(await firstLoggingDuplicates({ take: async () => [] as number[] }, "none")).toBeNull();
      expect(warnings).toHaveLength(1);
    } finally {
      console.warn = warn;
    }
  });
});

describe("resolveGame (rolling-deploy default)", () => {
  test("missing game means the default game", () => {
    expect(resolveGame(undefined)).toBe("uvs");
    expect(resolveGame("uvs")).toBe("uvs");
  });

  test("withResolvedGame fills `game` and keeps other args", () => {
    expect(withResolvedGame({ code: "X" } as { code: string; game?: GameId })).toEqual({ code: "X", game: "uvs" });
    expect(withResolvedGame({ code: "X", game: "uvs" as GameId })).toEqual({ code: "X", game: "uvs" });
  });
});

describe("findDefaultFormat", () => {
  type FormatRow = { key: string; isDefault: boolean; _creationTime: number; game?: GameId };

  /** Minimal ctx: `formats.withIndex("by_game_and_key", q => q.eq("game", v)).collect()`. */
  function ctxWith(rows: FormatRow[]) {
    return {
      db: {
        query: () => ({
          withIndex: (_name: string, build: (q: { eq: (field: string, value: GameId | undefined) => unknown }) => unknown) => {
            let game: GameId | undefined;
            build({
              eq: (_field, value) => {
                game = value;
                return undefined;
              },
            });
            return { collect: async () => rows.filter((row) => row.game === game) };
          },
        }),
      },
    } as unknown as Parameters<typeof findDefaultFormat>[0];
  }

  test("picks the game's isDefault format (Standard)", async () => {
    const ctx = ctxWith([
      { key: "legacy", isDefault: false, _creationTime: 1, game: "uvs" },
      { key: "standard", isDefault: true, _creationTime: 2, game: "uvs" },
      { key: "standard", isDefault: true, _creationTime: 3, game: "cyberpunk" },
    ]);
    expect((await findDefaultFormat(ctx, "uvs"))?.key).toBe("standard");
    expect((await findDefaultFormat(ctx, "cyberpunk"))?.game).toBe("cyberpunk");
  });

  test("falls back to the oldest format, then null", async () => {
    const ctx = ctxWith([
      { key: "b", isDefault: false, _creationTime: 5, game: "cyberpunk" },
      { key: "a", isDefault: false, _creationTime: 4, game: "cyberpunk" },
    ]);
    expect((await findDefaultFormat(ctx, "cyberpunk"))?.key).toBe("a");
    expect(await findDefaultFormat(ctxWith([]), "cyberpunk")).toBeNull();
  });

  test("finds untagged legacy formats for the default game", async () => {
    const ctx = ctxWith([{ key: "standard", isDefault: true, _creationTime: 1 }]);
    expect((await findDefaultFormat(ctx, "uvs"))?.key).toBe("standard");
  });
});
