import { describe, expect, test } from "bun:test";
import {
  appEventName,
  catalogDbName,
  deleteLegacyDatabaseOnce,
  gameStorageKey,
  globalStorageKey,
  legacyGameKey,
  readStorageWithLegacy,
} from "@/lib/storage-keys";

class MemoryStorage {
  map = new Map<string, string>();
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

describe("storage key naming", () => {
  test("game, global, event and IndexedDB names", () => {
    expect(gameStorageKey("uvs", "galleryFilters")).toBe("tcgdecks:uvs:galleryFilters");
    expect(globalStorageKey("galleryViewMode")).toBe("tcgdecks:galleryViewMode");
    expect(appEventName("admin-last-set-changed")).toBe("tcgdecks:admin-last-set-changed");
    expect(catalogDbName("uvs", "cards")).toBe("tcgdecks-uvs-cards");
    expect(catalogDbName("uvs", "sets")).toBe("tcgdecks-uvs-sets");
  });

  test("legacy keys only apply to uvs", () => {
    expect(legacyGameKey("uvs", "uvs-decks:activeDeckId")).toBe("uvs-decks:activeDeckId");
    // Future games have no legacy storage.
    expect(legacyGameKey("other" as never, "uvs-decks:activeDeckId")).toBeNull();
  });
});

describe("readStorageWithLegacy", () => {
  test("returns the new key when present and leaves legacy alone", () => {
    const s = new MemoryStorage();
    s.setItem("new", "a");
    s.setItem("old", "b");
    expect(readStorageWithLegacy("new", "old", s)).toBe("a");
    expect(s.getItem("old")).toBe("b");
  });

  test("migrates the legacy value once", () => {
    const s = new MemoryStorage();
    s.setItem("old", "b");
    expect(readStorageWithLegacy("new", "old", s)).toBe("b");
    expect(s.getItem("new")).toBe("b");
    expect(s.getItem("old")).toBeNull();
    expect(readStorageWithLegacy("new", "old", s)).toBe("b");
  });

  test("missing everywhere / no legacy key / no storage", () => {
    const s = new MemoryStorage();
    expect(readStorageWithLegacy("new", "old", s)).toBeNull();
    s.setItem("old", "b");
    expect(readStorageWithLegacy("new", null, s)).toBeNull();
    expect(readStorageWithLegacy("new", "old", null)).toBeNull();
  });

  test("keeps legacy value readable when the copy fails", () => {
    const s = new MemoryStorage();
    s.setItem("old", "b");
    s.setItem = () => {
      throw new Error("quota");
    };
    expect(readStorageWithLegacy("new", "old", s)).toBe("b");
    expect(s.getItem("old")).toBe("b");
  });

  test("never throws when storage access throws", () => {
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(readStorageWithLegacy("new", "old", throwing)).toBeNull();
  });
});

describe("deleteLegacyDatabaseOnce", () => {
  test("deletes each name at most once and swallows errors", () => {
    const deleted: string[] = [];
    const factory = {
      deleteDatabase: (name: string) => {
        deleted.push(name);
        if (name === "boom") throw new Error("nope");
        return {} as IDBOpenDBRequest;
      },
    };
    deleteLegacyDatabaseOnce("test-legacy-a", factory);
    deleteLegacyDatabaseOnce("test-legacy-a", factory);
    expect(() => deleteLegacyDatabaseOnce("boom", factory)).not.toThrow();
    expect(deleted).toEqual(["test-legacy-a", "boom"]);
    expect(() => deleteLegacyDatabaseOnce("x", null)).not.toThrow();
  });
});
