import { describe, expect, test } from "bun:test";
import { passwordRequirementError } from "../convex/lib/password";

describe("passwordRequirementError", () => {
  test("rejects short passwords", () => {
    expect(passwordRequirementError("abc1")).not.toBeNull();
  });

  test("rejects passwords without a number", () => {
    expect(passwordRequirementError("abcdefghij")).not.toBeNull();
  });

  test("accepts 8+ characters with a number", () => {
    expect(passwordRequirementError("abcdefg1")).toBeNull();
  });
});
