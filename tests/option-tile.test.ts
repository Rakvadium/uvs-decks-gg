import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OptionTile, type OptionTileProps } from "../src/components/ui/option-tile";

function render(props: Omit<OptionTileProps, "children">) {
  const html = renderToStaticMarkup(createElement(OptionTile, props, "Holo"));
  return {
    pressed: html.match(/aria-pressed="([^"]*)"/)?.[1],
    type: html.match(/type="([^"]*)"/)?.[1],
    classes: (html.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/),
  };
}

const SELECTED_TOKENS = ["bg-(--selected-bg)", "border-(--selected-border)", "text-(--selected-fg)"];

describe("OptionTile", () => {
  test("selected: aria-pressed true and the selected-token fill, border and text", () => {
    const tile = render({ selected: true });
    expect(tile.pressed).toBe("true");
    expect(tile.type).toBe("button");
    expect(SELECTED_TOKENS.filter((token) => !tile.classes.includes(token))).toEqual([]);
    expect(tile.classes).not.toContain("enabled:hover:bg-(--hover-bg)");
  });

  test("unselected outline: aria-pressed false, surface border, hover token, no selected tokens", () => {
    const tile = render({ selected: false });
    expect(tile.pressed).toBe("false");
    expect(tile.classes).toContain("border-surface");
    expect(tile.classes).toContain("enabled:hover:bg-(--hover-bg)");
    expect(SELECTED_TOKENS.filter((token) => tile.classes.includes(token))).toEqual([]);
  });

  test("unselected ghost has a transparent border", () => {
    const tile = render({ selected: false, variant: "ghost" });
    expect(tile.classes).toContain("border-transparent");
    expect(tile.classes).not.toContain("border-surface");
  });

  test("radius and focus ring come from the primitive", () => {
    const { classes } = render({ selected: false });
    expect(classes.filter((c) => c.startsWith("rounded-"))).toEqual(["rounded-control"]);
    expect(classes).toContain("focus-visible:ring-2");
    expect(classes).toContain("focus-visible:ring-ring");
  });
});
