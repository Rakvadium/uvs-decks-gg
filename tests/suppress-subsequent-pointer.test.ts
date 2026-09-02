import { describe, expect, test } from "bun:test";
import { suppressSubsequentPointerEvents } from "../src/lib/suppress-subsequent-pointer";

describe("suppressSubsequentPointerEvents", () => {
  test("swallows pointerup and click until the guard expires", () => {
    const listeners = new Map<string, EventListener[]>();
    const target = {
      addEventListener(type: string, listener: EventListener) {
        const list = listeners.get(type) ?? [];
        list.push(listener);
        listeners.set(type, list);
      },
      removeEventListener(type: string, listener: EventListener) {
        const list = listeners.get(type) ?? [];
        listeners.set(
          type,
          list.filter((item) => item !== listener)
        );
      },
    };

    suppressSubsequentPointerEvents(20, target);

    const click = new Event("click", { bubbles: true, cancelable: true });
    const pointerup = new Event("pointerup", { bubbles: true, cancelable: true });
    for (const listener of listeners.get("click") ?? []) listener(click);
    for (const listener of listeners.get("pointerup") ?? []) listener(pointerup);

    expect(click.defaultPrevented).toBe(true);
    expect(pointerup.defaultPrevented).toBe(true);
    expect(listeners.get("click")?.length).toBe(1);
  });

  test("replacing the guard removes the previous listeners", () => {
    const added: string[] = [];
    const removed: string[] = [];
    const target = {
      addEventListener(type: string) {
        added.push(type);
      },
      removeEventListener(type: string) {
        removed.push(type);
      },
    };

    suppressSubsequentPointerEvents(50, target);
    suppressSubsequentPointerEvents(50, target);

    expect(removed.length).toBeGreaterThan(0);
    expect(added.length).toBeGreaterThan(removed.length);
  });
});
