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

  test("the pressed segment reads the selected tokens and the rest read the hover token", () => {
    const [grid, list] = render({ items: ITEMS, value: "list" });
    expect(list.classes).toEqual(expect.arrayContaining(["bg-(--selected-bg)", "text-(--selected-fg)"]));
    expect(grid.classes).toContain("hover:bg-(--hover-bg)");
    expect(grid.classes).not.toContain("bg-(--selected-bg)");
  });
});

describe("SegmentedControl multiple choice", () => {
  test("marks every item in values as pressed", () => {
    const buttons = render({ items: ITEMS, values: ["grid", "rows"], onToggle: () => {} });
    expect(buttons.map((button) => button.pressed)).toEqual(["true", "false", "true"]);
  });
});

describe("SegmentedControl height", () => {
  test.each([
    ["xs", "h-(--control-h-xs)"],
    ["sm", "h-(--control-h-sm)"],
    ["md", "h-(--control-h-md)"],
  ] as const)("size %s reads %s", (size, height) => {
    const html = renderToStaticMarkup(createElement(SegmentedControl, { items: ITEMS, size }));
    expect(html.match(/<div[^>]*class="([^"]*)"/)?.[1].split(/\s+/)).toContain(height);
  });
});
