import { describe, expect, test } from "bun:test";
import passwordProvider from "../convex/auth";
import { USERNAME_MAX, validateUsername } from "../shared/username";

describe("validateUsername", () => {
  test("rejects empty and whitespace-only names", () => {
    expect(validateUsername("")).toBe("Username is required");
    expect(validateUsername("   ")).toBe("Username is required");
  });

  test("rejects names over 20 characters after trim", () => {
    expect(USERNAME_MAX).toBe(20);
    expect(validateUsername("a".repeat(21))).toBe("Username must be 20 characters or fewer");
    expect(validateUsername(`  ${"a".repeat(20)}  `)).toBeNull();
  });

  test("rejects control and zero-width characters", () => {
    expect(validateUsername("bad\u200Bname")).toBe("Username cannot contain control or zero-width characters");
    expect(validateUsername("tab\tname")).toBe("Username cannot contain control or zero-width characters");
    expect(validateUsername("bom\uFEFFname")).toBe("Username cannot contain control or zero-width characters");
  });

  test("accepts spaces and symbols", () => {
    expect(validateUsername("bad name!!@#")).toBeNull();
    expect(validateUsername("parity_lane.6")).toBeNull();
    expect(validateUsername("a".repeat(20))).toBeNull();
  });
});

describe("password sign-up profile", () => {
  const profile = (passwordProvider as unknown as { profile: (params: Record<string, unknown>) => unknown }).profile;
  const signUp = (username: unknown) => () => profile({ flow: "signUp", email: "new@example.com", username });

  test("rejects empty, whitespace-only and zero-width usernames", () => {
    expect(signUp("")).toThrow("Username is required");
    expect(signUp("   ")).toThrow("Username is required");
    expect(signUp("bad\u200Bname")).toThrow("Username cannot contain control or zero-width characters");
  });

  test("accepts spaces and symbols and stores the trimmed lowercase name", () => {
    expect(signUp("  Parity Lane 4!  ")()).toEqual({ email: "new@example.com", username: "parity lane 4!" });
  });
});
