import { describe, expect, test } from "bun:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Input } from "../src/components/ui/input";
import { SearchField } from "../src/components/ui/search-field";
import { Select, SelectTrigger, SelectValue } from "../src/components/ui/select";
import { Switch } from "../src/components/ui/switch";
import { Textarea } from "../src/components/ui/textarea";

type Size = "xs" | "sm" | "md" | "lg";
const SIZES: Size[] = ["xs", "sm", "md", "lg"];

function classesOf(element: ReactElement, slot: string): string[] {
  const html = renderToStaticMarkup(element);
  const tag = html.match(new RegExp(`<[^>]*data-slot="${slot}"[^>]*>`));
  if (!tag) throw new Error(`no data-slot="${slot}" in ${html}`);
  const match = tag[0].match(/class="([^"]*)"/);
  if (!match) throw new Error(`no class attribute in ${tag[0]}`);
  return match[1].split(/\s+/);
}

const input = (size?: Size) => classesOf(createElement(Input, { size }), "input");
const textarea = (size?: Size) => classesOf(createElement(Textarea, { size }), "textarea");
const selectTrigger = (size?: Size, variant?: "field" | "inline") =>
  classesOf(
    createElement(Select, null, createElement(SelectTrigger, { size, variant }, createElement(SelectValue))),
    "select-trigger"
  );

const backgrounds = (classes: string[]) => classes.filter((c) => /^bg-/.test(c));
const heights = (classes: string[]) => classes.filter((c) => /^(h|min-h|size)-/.test(c));

describe("Input, SelectTrigger and Textarea share the control sizes and one background", () => {
  for (const size of SIZES) {
    test(`Input size="${size}" holds h-(--control-h-${size})`, () => {
      const classes = input(size);
      expect(heights(classes)).toEqual([`h-(--control-h-${size})`]);
      expect(backgrounds(classes)).toEqual(["bg-background-soft"]);
      expect(classes).toContain("rounded-control");
    });

    test(`SelectTrigger size="${size}" holds h-(--control-h-${size})`, () => {
      const classes = selectTrigger(size);
      expect(heights(classes)).toEqual([`h-(--control-h-${size})`]);
      expect(backgrounds(classes)).toEqual(["bg-background-soft"]);
      expect(classes).toContain("rounded-control");
    });

    test(`Textarea size="${size}" sets its minimum height from --control-h-${size}`, () => {
      const classes = textarea(size);
      expect(heights(classes)).toEqual([`min-h-[calc(var(--control-h-${size})*1.5)]`]);
      expect(backgrounds(classes)).toEqual(["bg-background-soft"]);
      expect(classes).toContain("rounded-control");
    });
  }

  test("md is the default size for all three", () => {
    expect(heights(input())).toEqual(["h-(--control-h-md)"]);
    expect(heights(selectTrigger())).toEqual(["h-(--control-h-md)"]);
    expect(heights(textarea())).toEqual(["min-h-[calc(var(--control-h-md)*1.5)]"]);
  });

  test("Input, SelectTrigger and Textarea use the same focus ring", () => {
    const focus = (classes: string[]) => classes.filter((c) => c.startsWith("focus-visible:")).sort();
    expect(focus(textarea())).toEqual(focus(input()));
    expect(focus(selectTrigger())).toEqual(focus(input()));
    expect(focus(input())).toContain("focus-visible:shadow-[var(--chrome-focus-shadow)]");
  });

  test('SelectTrigger variant="inline" keeps the height and drops the field fill and border', () => {
    const classes = selectTrigger("xs", "inline");
    expect(heights(classes)).toEqual(["h-(--control-h-xs)"]);
    expect(backgrounds(classes)).toEqual(["bg-transparent"]);
    expect(classes).toContain("border-0");
  });
});

describe("SearchField", () => {
  const render = (value: string, size?: Size) =>
    renderToStaticMarkup(createElement(SearchField, { value, onValueChange: () => {}, placeholder: "Search sets…", size }));

  test("renders one Input at the requested size, labelled by its placeholder", () => {
    const html = render("", "sm");
    expect(html.match(/data-slot="input"/g)?.length).toBe(1);
    expect(html).toContain('type="search"');
    expect(html).toContain('aria-label="Search sets…"');
    expect(classesOf(createElement(SearchField, { value: "", onValueChange: () => {}, size: "sm" }), "input")).toContain(
      "h-(--control-h-sm)"
    );
  });

  test("shows a focusable clear button only when there is a value", () => {
    expect(render("")).not.toContain('aria-label="Clear search"');
    const html = render("arcane");
    expect(html).toContain('aria-label="Clear search"');
    const button = html.match(/<button[^>]*aria-label="Clear search"[^>]*>/)![0];
    expect(button).toContain("focus-visible:");
  });
});

describe("Switch", () => {
  test("the checked state reads the selected role tokens, not primary", () => {
    const classes = classesOf(createElement(Switch, { checked: true }), "switch");
    expect(classes).toContain("data-[state=checked]:bg-(--selected-bg)");
    expect(classes).toContain("data-[state=checked]:border-(--selected-border)");
    expect(classes.filter((c) => c.includes("primary"))).toEqual([]);
  });
});
