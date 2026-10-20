import { describe, expect, test } from "bun:test";
import { isActiveShellCopy } from "../src/components/deck-details/deck-details-edit-dialog-shell";

describe("isActiveShellCopy", () => {
  test("desktop viewport renders only the desktop copy", () => {
    expect(isActiveShellCopy(false, false)).toBe(true);
    expect(isActiveShellCopy(true, false)).toBe(false);
  });

  test("mobile viewport renders only the mobile copy", () => {
    expect(isActiveShellCopy(true, true)).toBe(true);
    expect(isActiveShellCopy(false, true)).toBe(false);
  });

  test("exactly one of the two copies is active for either viewport", () => {
    for (const isMobileViewport of [false, true]) {
      const active = [false, true].filter((inMobileShell) => isActiveShellCopy(inMobileShell, isMobileViewport));
      expect(active).toHaveLength(1);
    }
  });
});
