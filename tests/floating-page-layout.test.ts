import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FloatingPageBar,
  FloatingPageLayout,
  type FloatingCenterWidth,
  type PageWash,
} from "../src/components/shell/floating-page-bar";

function render(pageWash?: PageWash) {
  const props: ComponentProps<typeof FloatingPageLayout> = { bar: createElement("nav", null, "bar"), pageWash, children: "body" };
  const html = renderToStaticMarkup(createElement(FloatingPageLayout, props));
  const wash = html.match(/<div aria-hidden="true" data-slot="page-wash" data-wash="([a-z]+)" class="([^"]*)"/);
  return { html, washName: wash?.[1], washClasses: wash?.[2].split(/\s+/) ?? [] };
}

const LITERAL_COLOR = /rgba?\(|#[0-9a-f]{3,8}\b|oklch\(|hsla?\(/i;

const EXPECTED_TOKENS: Record<PageWash, string[]> = {
  fade: ["from-primary/7", "via-primary/3", "to-transparent"],
  radial: ["var(--primary)_8%", "var(--secondary)_10%"],
  grid: ["var(--primary)_10%", "var(--secondary)_10%", "var(--border)_22%"],
  glow: ["var(--primary)_4%", "var(--secondary)_4%"],
};

describe("FloatingPageLayout pageWash", () => {
  for (const [wash, tokens] of Object.entries(EXPECTED_TOKENS) as [PageWash, string[]][]) {
    test(`${wash} paints one token-driven wash behind the page`, () => {
      const { html, washName, washClasses } = render(wash);
      expect(washName).toBe(wash);
      expect(washClasses).toContain("absolute");
      expect(washClasses).toContain("inset-0");
      expect(washClasses).toContain("pointer-events-none");
      const washClassText = washClasses.join(" ");
      for (const token of tokens) expect(washClassText).toContain(token);
      expect(html).not.toMatch(LITERAL_COLOR);
    });
  }

  test("no pageWash renders no wash layer", () => {
    const { html, washName } = render();
    expect(washName).toBeUndefined();
    expect(html).not.toContain("page-wash");
  });

  test("the scroller sits above the wash and the bar keeps its slot", () => {
    const { html } = render("radial");
    expect(html.indexOf('data-slot="page-wash"')).toBeLessThan(html.indexOf("<nav>bar</nav>"));
    expect(html).toMatch(/class="relative min-h-0 flex-1 overflow-y-auto[^"]*md:pt-\[4\.75rem\]/);
    expect(html).toContain(">body</div>");
  });
});

function renderBar(centerWidth?: FloatingCenterWidth) {
  const html = renderToStaticMarkup(createElement(FloatingPageBar, { centerWidth, center: "search" }));
  const bar = html.match(/data-slot="floating-page-bar" data-center-width="([a-z]+)" class="([^"]*)"/);
  return { width: bar?.[1], classes: bar?.[2] ?? "" };
}

const BASE_CSS = readFileSync(join(import.meta.dir, "../src/styles/base.css"), "utf8");

describe("FloatingPageBar centerWidth", () => {
  test("default caps the center slot at --floating-center-w", () => {
    const { width, classes } = renderBar();
    expect(width).toBe("default");
    expect(classes).toContain("grid-cols-[minmax(max-content,1fr)_minmax(0,var(--floating-center-w))_minmax(max-content,1fr)]");
  });

  test("wide caps the center slot at --floating-center-w-wide", () => {
    const { width, classes } = renderBar("wide");
    expect(width).toBe("wide");
    expect(classes).toContain("grid-cols-[minmax(max-content,1fr)_minmax(0,var(--floating-center-w-wide))_minmax(max-content,1fr)]");
  });

  test("both widths are layout tokens on :root", () => {
    expect(BASE_CSS).toMatch(/--floating-center-w:\s*26rem;/);
    expect(BASE_CSS).toMatch(/--floating-center-w-wide:\s*40rem;/);
  });
});
