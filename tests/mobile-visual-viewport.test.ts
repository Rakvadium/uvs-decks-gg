import { describe, expect, test } from "bun:test";
import {
  applyFrameBox,
  resolveFrameBox,
  shouldResetViewportScroll,
} from "../src/components/shell/use-mobile-visual-viewport";

describe("resolveFrameBox", () => {
  test("follows the visual viewport when not zoomed", () => {
    expect(resolveFrameBox({ offsetTop: 364.4, height: 480.2, scale: 1 })).toEqual({
      top: 364,
      height: 480,
    });
  });

  test("falls back to CSS when pinch-zoomed", () => {
    expect(resolveFrameBox({ offsetTop: 120, height: 400, scale: 2 })).toBeNull();
  });

  test("falls back to CSS without a visual viewport", () => {
    expect(resolveFrameBox(null)).toBeNull();
  });
});

describe("shouldResetViewportScroll", () => {
  test("resets a leftover offset once nothing is being typed into", () => {
    expect(shouldResetViewportScroll({ offsetTop: 364, height: 844, scale: 1 }, false)).toBe(true);
  });

  test("leaves the offset alone while a text field is focused", () => {
    expect(shouldResetViewportScroll({ offsetTop: 364, height: 480, scale: 1 }, true)).toBe(false);
  });

  test("does nothing when already aligned or zoomed", () => {
    expect(shouldResetViewportScroll({ offsetTop: 0, height: 844, scale: 1 }, false)).toBe(false);
    expect(shouldResetViewportScroll({ offsetTop: 40, height: 600, scale: 1.8 }, false)).toBe(false);
  });
});

describe("applyFrameBox", () => {
  test("writes and clears inline geometry", () => {
    const node = { style: {} as CSSStyleDeclaration } as HTMLElement;
    applyFrameBox(node, { top: 12, height: 700 });
    expect(node.style.top).toBe("12px");
    expect(node.style.height).toBe("700px");
    applyFrameBox(node, null);
    expect(node.style.top).toBe("");
    expect(node.style.height).toBe("");
  });
});
