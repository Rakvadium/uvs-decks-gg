import { describe, expect, test } from "bun:test";
import {
  applyMobileVisualViewportFrame,
  readMobileKeyboardInset,
  resolveMobileShellViewport,
} from "../src/components/shell/use-mobile-visual-viewport";

describe("readMobileKeyboardInset", () => {
  test("ignores small chrome deltas", () => {
    expect(readMobileKeyboardInset(844, 820, 0)).toBe(0);
  });

  test("returns the keyboard overlap", () => {
    expect(readMobileKeyboardInset(844, 480, 0)).toBe(364);
  });
});

describe("resolveMobileShellViewport", () => {
  test("uses the live visual viewport when the keyboard is closed", () => {
    const measured = { top: 12, left: 0, width: 390, height: 700 };
    expect(resolveMobileShellViewport(measured, 0, null)).toEqual(measured);
  });

  test("keeps the pre-keyboard box while the keyboard is open", () => {
    const measured = { top: 0, left: 0, width: 390, height: 480 };
    const lastStable = { top: 0, left: 0, width: 390, height: 700 };
    expect(resolveMobileShellViewport(measured, 220, lastStable)).toEqual(lastStable);
  });

  test("reconstructs a full-height box when no stable size exists", () => {
    expect(
      resolveMobileShellViewport({ top: 40, left: 0, width: 390, height: 480 }, 300, null)
    ).toEqual({ top: 0, left: 0, width: 390, height: 820 });
  });
});

describe("applyMobileVisualViewportFrame", () => {
  test("pins the frame to the visual viewport box", () => {
    const node = {
      style: {} as CSSStyleDeclaration,
    };
    applyMobileVisualViewportFrame(node as HTMLElement, {
      top: 47,
      left: 12,
      width: 390,
      height: 620,
    });
    expect(node.style.position).toBe("fixed");
    expect(node.style.top).toBe("0");
    expect(node.style.left).toBe("0");
    expect(node.style.width).toBe("390px");
    expect(node.style.height).toBe("620px");
    expect(node.style.transform).toBe("translate(12px, 47px)");
  });
});
