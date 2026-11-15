import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, type ButtonProps } from "../src/components/ui/button";
import { FloatingActionPill, type FloatingActionPillVariant } from "../src/components/shell/floating-page-bar";

function classesOf(props: ButtonProps): string[] {
  const html = renderToStaticMarkup(createElement(Button, props, "Save"));
  const match = html.match(/class="([^"]*)"/);
  if (!match) throw new Error(`no class attribute in ${html}`);
  return match[1].split(/\s+/);
}

describe("Button sizes read the control-height tokens", () => {
  const cases: [NonNullable<ButtonProps["size"]>, string][] = [
    ["xs", "h-(--control-h-xs)"],
    ["sm", "h-(--control-h-sm)"],
    ["md", "h-(--control-h-md)"],
    ["lg", "h-(--control-h-lg)"],
    ["icon-xs", "size-(--control-h-xs)"],
    ["icon-sm", "size-(--control-h-sm)"],
    ["icon", "size-(--control-h-md)"],
    ["icon-lg", "size-(--control-h-lg)"],
  ];

  for (const [size, height] of cases) {
    test(`size="${size}" holds ${height} and rounded-control`, () => {
      const classes = classesOf({ size });
      expect(classes).toContain(height);
      expect(classes).toContain("rounded-control");
      expect(classes.filter((c) => /^(h|size)-/.test(c))).toEqual([height]);
    });
  }

  test("md is the default size", () => {
    expect(classesOf({})).toContain("h-(--control-h-md)");
  });
});

describe("Button shape", () => {
  test('shape="cta" holds rounded-cta and no other radius', () => {
    const classes = classesOf({ shape: "cta" });
    expect(classes.filter((c) => c.startsWith("rounded-"))).toEqual(["rounded-cta"]);
  });

  test('shape="island" holds rounded-island and no other radius', () => {
    const classes = classesOf({ shape: "island" });
    expect(classes.filter((c) => c.startsWith("rounded-"))).toEqual(["rounded-island"]);
  });

  test("every variant keeps chrome-label-case", () => {
    for (const variant of ["default", "outline", "ghost", "secondary", "destructive"] as const) {
      expect(classesOf({ variant, shape: "cta" })).toContain("chrome-label-case");
    }
  });
});

describe("FloatingActionPill", () => {
  function pillClasses(variant: FloatingActionPillVariant): string[] {
    const html = renderToStaticMarkup(createElement(FloatingActionPill, { variant }, "Edit"));
    return html.match(/class="([^"]*)"/)![1].split(/\s+/);
  }

  test("reads rounded-island and the md control height", () => {
    for (const variant of ["default", "floating"] as const) {
      const classes = pillClasses(variant);
      expect(classes.filter((c) => c.startsWith("rounded-"))).toEqual(["rounded-island"]);
      expect(classes).toContain("h-(--control-h-md)");
    }
  });

  test("the filled pill keeps the default variant hover shadow hook", () => {
    expect(pillClasses("default")).toContain("hover:shadow-[var(--chrome-button-shadow-default-hover)]");
  });

  test("the floating pill sits on the opaque island fill", () => {
    const classes = pillClasses("floating");
    expect(classes).toContain("bg-(--island-fill)");
    expect(classes).toContain("[--island-fill:var(--background)]");
    expect(classes).not.toContain("bg-transparent");
  });

  test("only filled and floating variants exist, and none is transparent", () => {
    // @ts-expect-error <FloatingActionPill variant="outline"> is transparent over scrolling content
    const outline: FloatingActionPillVariant = "outline";
    // @ts-expect-error <FloatingActionPill variant="ghost"> is transparent over scrolling content
    const ghost: FloatingActionPillVariant = "ghost";
    void [outline, ghost];

    const variants: Record<FloatingActionPillVariant, true> = { default: true, secondary: true, destructive: true, floating: true };
    for (const variant of Object.keys(variants) as FloatingActionPillVariant[]) {
      expect(pillClasses(variant).filter((c) => c === "bg-transparent" || c.startsWith("hover:bg-transparent"))).toEqual([]);
      expect(pillClasses(variant).some((c) => /^bg-(primary|secondary|destructive|\(--island-fill\))$/.test(c))).toBe(true);
    }
  });
});
