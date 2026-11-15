import { describe, expect, test } from "bun:test";
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
    expect(validateUsername("bad​name")).toBe("Username cannot contain control or zero-width characters");
    expect(validateUsername("tab\tname")).toBe("Username cannot contain control or zero-width characters");
    expect(validateUsername("bom﻿name")).toBe("Username cannot contain control or zero-width characters");
  });

  test("accepts spaces and symbols", () => {
    expect(validateUsername("bad name!!@#")).toBeNull();
    expect(validateUsername("parity_lane.6")).toBeNull();
    expect(validateUsername("a".repeat(20))).toBeNull();
  });
});
