import { describe, expect, test } from "bun:test";
import { readBarKeyboardInset } from "../src/components/shell/mobile-tab-bar/use-keyboard-inset";

describe("readBarKeyboardInset", () => {
  test("returns 0 without a visual viewport", () => {
    expect(readBarKeyboardInset(null)).toBe(0);
  });

  test("lifts a layout-fixed bar that sits below the visible bottom", () => {
    const previous = globalThis.window;
    const visualViewport = { offsetTop: 0, height: 500 };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        innerHeight: 844,
        visualViewport,
      },
    });
    const bar = {
      style: { bottom: "0px" },
      getBoundingClientRect: () => ({ bottom: 844 }),
    } as HTMLElement;
    expect(readBarKeyboardInset(bar)).toBe(344);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previous,
    });
  });

  test("does not lift a bar already aligned to the visual viewport", () => {
    const previous = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        innerHeight: 844,
        visualViewport: { offsetTop: 0, height: 500 },
      },
    });
    const bar = {
      style: { bottom: "0px" },
      getBoundingClientRect: () => ({ bottom: 500 }),
    } as HTMLElement;
    expect(readBarKeyboardInset(bar)).toBe(0);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previous,
    });
  });

  test("ignores the current bottom style when measuring the natural edge", () => {
    const previous = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        innerHeight: 844,
        visualViewport: { offsetTop: 0, height: 500 },
      },
    });
    const bar = {
      style: { bottom: "344px" },
      getBoundingClientRect: () => ({ bottom: 500 }),
    } as HTMLElement;
    expect(readBarKeyboardInset(bar)).toBe(344);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previous,
    });
  });
});
