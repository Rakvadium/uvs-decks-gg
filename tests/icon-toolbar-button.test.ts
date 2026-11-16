import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IconToolbarButton, type IconToolbarButtonProps } from "../src/components/ui/icon-toolbar-button";

function render(props: IconToolbarButtonProps) {
  const html = renderToStaticMarkup(createElement(IconToolbarButton, props, "x"));
  const classes = html.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
  return { html, classes };
}

describe("IconToolbarButton", () => {
  test("is a labelled 28px control button that hovers with the hover token", () => {
    const { html, classes } = render({ label: "Close" });
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('type="button"');
    expect(classes).toContain("size-(--control-h-xs)");
    expect(classes).toContain("rounded-control");
    expect(classes).toContain("hover:bg-(--hover-bg)");
    expect(classes).not.toContain("hover:bg-accent-selected");
    expect(classes).toContain("focus-visible:ring-2");
    expect(html).not.toContain("data-active");
  });

  test("active reads the selected tokens", () => {
    const { html, classes } = render({ label: "Toggle filter panel", active: true });
    expect(html).toContain("data-active");
    expect(classes).toContain("data-[active]:bg-(--selected-bg)");
    expect(classes).toContain("data-[active]:text-(--selected-fg)");
  });

  test("island shape swaps the radius only", () => {
    const { classes } = render({ label: "Change view mode", shape: "island" });
    expect(classes).toContain("rounded-island");
    expect(classes).not.toContain("rounded-control");
    expect(classes).toContain("size-(--control-h-xs)");
  });
});
