import { describe, expect, test } from "bun:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SegmentedControl } from "../src/components/ui/segmented-control";

const ITEMS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "rows", label: "Rows", disabled: true },
];

type Rendered = { label: string; pressed: string | null; state: string | null; disabled: boolean; classes: string[] };

function render(props: ComponentProps<typeof SegmentedControl>): Rendered[] {
  const html = renderToStaticMarkup(createElement(SegmentedControl, props));
  return [...html.matchAll(/<button([^>]*)>(.*?)<\/button>/g)].map(([, attrs, inner]) => ({
    label: inner.replace(/<[^>]+>/g, ""),
    pressed: attrs.match(/aria-pressed="([^"]*)"/)?.[1] ?? null,
    state: attrs.match(/data-state="([^"]*)"/)?.[1] ?? null,
    disabled: /\sdisabled=""/.test(attrs),
    classes: (attrs.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/),
  }));
}

describe("SegmentedControl single choice", () => {
  test("marks only the item matching value as pressed", () => {
    const buttons = render({ items: ITEMS, value: "list" });
    expect(buttons.map(({ label, pressed, state, disabled }) => ({ label, pressed, state, disabled }))).toEqual([
      { label: "Grid", pressed: "false", state: "off", disabled: false },
      { label: "List", pressed: "true", state: "on", disabled: false },
      { label: "Rows", pressed: "false", state: "off", disabled: true },
    ]);
  });

  test("with no value nothing is pressed", () => {
    expect(render({ items: ITEMS }).map((button) => button.pressed)).toEqual(["false", "false", "false"]);
  });
});
