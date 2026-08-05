import { describe, expect, test } from "bun:test";
import {
  AVATAR_SYMBOLS,
  avatarInitialFromUsername,
  isAvatarSymbolPath,
  normalizeAvatarImagePath,
} from "../src/lib/user-avatar";

describe("user-avatar helpers", () => {
  test("avatarInitialFromUsername uses username only", () => {
    expect(avatarInitialFromUsername("agent")).toBe("A");
    expect(avatarInitialFromUsername("  nova  ")).toBe("N");
    expect(avatarInitialFromUsername("")).toBe("?");
    expect(avatarInitialFromUsername(undefined)).toBe("?");
  });

  test("normalizeAvatarImagePath strips absolute origins", () => {
    expect(normalizeAvatarImagePath("/universus/symbols/fire.png")).toBe(
      "/universus/symbols/fire.png",
    );
    expect(
      normalizeAvatarImagePath("http://localhost:8090/universus/symbols/void.png"),
    ).toBe("/universus/symbols/void.png");
    expect(normalizeAvatarImagePath("  ")).toBe("");
    expect(normalizeAvatarImagePath(undefined)).toBe("");
  });

  test("isAvatarSymbolPath matches known symbols", () => {
    expect(isAvatarSymbolPath(AVATAR_SYMBOLS[0].path)).toBe(true);
    expect(
      isAvatarSymbolPath("https://example.com/universus/symbols/fire.png"),
    ).toBe(true);
    expect(isAvatarSymbolPath("/custom/avatar.png")).toBe(false);
  });
});
