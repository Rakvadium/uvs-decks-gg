import { describe, expect, test } from "bun:test";
import {
  assertAdminApiKeyFromRequest,
  timingSafeEqualAdminKey,
} from "../convex/lib/adminApiAuth";
import { sanitizeCardImportInput, sanitizeCardImportList } from "../convex/lib/cardCreate";

describe("timingSafeEqualAdminKey", () => {
  test("matches equal strings", () => {
    expect(timingSafeEqualAdminKey("secret", "secret")).toBe(true);
  });

  test("rejects unequal strings", () => {
    expect(timingSafeEqualAdminKey("secret", "secre")).toBe(false);
    expect(timingSafeEqualAdminKey("secret", "secretz")).toBe(false);
  });
});

describe("assertAdminApiKeyFromRequest", () => {
  test("accepts Bearer and x-admin-api-key headers", () => {
    const prev = process.env.ADMIN_API_KEY;
    process.env.ADMIN_API_KEY = "test-admin-key";
    try {
      expect(() =>
        assertAdminApiKeyFromRequest(
          new Request("https://example.com", {
            headers: { Authorization: "Bearer test-admin-key" },
          }),
        ),
      ).not.toThrow();
      expect(() =>
        assertAdminApiKeyFromRequest(
          new Request("https://example.com", {
            headers: { "x-admin-api-key": "test-admin-key" },
          }),
        ),
      ).not.toThrow();
      expect(() =>
        assertAdminApiKeyFromRequest(
          new Request("https://example.com", {
            headers: { Authorization: "Bearer wrong" },
          }),
        ),
      ).toThrow("Invalid admin API key");
    } finally {
      if (prev === undefined) delete process.env.ADMIN_API_KEY;
      else process.env.ADMIN_API_KEY = prev;
    }
  });
});

describe("sanitizeCardImportInput", () => {
  test("drops nulls and unknown fields", () => {
    const card = sanitizeCardImportInput({
      name: "Punch",
      difficulty: null,
      evil: "hack",
      setCode: "ABC",
      abilities: "Deal 1 damage",
    });
    expect(card).toEqual({
      name: "Punch",
      setCode: "ABC",
      text: "Deal 1 damage",
    });
  });

  test("rejects nameless rows", () => {
    expect(sanitizeCardImportInput({ setCode: "ABC" })).toBe(null);
    expect(sanitizeCardImportList([{ name: "A" }, { name: "" }, null])).toHaveLength(1);
  });
});
