import { describe, expect, test } from "bun:test";
import { randomUuid } from "../src/lib/random-uuid";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("randomUuid", () => {
  test("returns a UUID v4 when crypto.randomUUID exists", () => {
    expect(randomUuid()).toMatch(UUID_V4);
  });

  test("falls back when crypto.randomUUID is missing", () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", {
      configurable: true,
      value: undefined,
    });
    try {
      expect(typeof crypto.randomUUID).not.toBe("function");
      const id = randomUuid();
      expect(id).toMatch(UUID_V4);
      expect(randomUuid()).not.toBe(id);
    } finally {
      Object.defineProperty(crypto, "randomUUID", {
        configurable: true,
        value: original,
      });
    }
  });
});
