import { describe, expect, test } from "bun:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Inbox } from "lucide-react";
import { Badge, type BadgeTone } from "../src/components/ui/badge";
import { Banner } from "../src/components/ui/banner";
import { Card, Surface } from "../src/components/ui/card";
import { Chip } from "../src/components/ui/chip";
import { FilterChip } from "../src/components/gallery/mobile-filter-sheet/primitives";
import { CountBadge } from "../src/components/ui/count-badge";
import { EmptyState } from "../src/components/ui/empty-state";
import { LoadingState } from "../src/components/ui/loading-state";
import { Panel } from "../src/components/ui/panel";
import { Skeleton } from "../src/components/ui/skeleton";

function classesOf(element: ReactElement): string[] {
  const match = renderToStaticMarkup(element).match(/class="([^"]*)"/);
  if (!match) throw new Error("no class attribute");
  return match[1].split(/\s+/);
}

const hoverClasses = (classes: string[]) => classes.filter((c) => /(^|:)hover:/.test(c) || c.startsWith("group-hover:"));

const ALL_TONES: BadgeTone[] = ["default", "secondary", "destructive", "outline", "success", "warning", "info", "muted", "entity", "signal", "signalMagenta", "signalViolet"];

describe("Card", () => {
  test("is static without fx", () => {
    expect(hoverClasses(classesOf(createElement(Card, null, "x")))).toEqual([]);
    expect(classesOf(createElement(Card, null, "x"))).not.toContain("group");
  });

  test("Surface is static", () => {
    expect(hoverClasses(classesOf(createElement(Surface, null, "x")))).toEqual([]);
  });

  test("fx adds the hover chrome", () => {
    expect(hoverClasses(classesOf(createElement(Card, { fx: true }, "x")))).toEqual([
      "hover:shadow-[var(--chrome-card-shadow-hover)]",
      "hover:border-[var(--chrome-card-border-hover)]",
      "hover:before:opacity-100",
    ]);
  });

  test("reads the surface radius token", () => {
    expect(classesOf(createElement(Card, null, "x"))).toContain("rounded-surface");
  });
});

describe("Badge", () => {
  test("no tone has hover classes unless interactive", () => {
    for (const tone of ALL_TONES) {
      expect(hoverClasses(classesOf(createElement(Badge, { tone }, "x")))).toEqual([]);
    }
  });

  test("interactive outline gets its hover accent", () => {
    expect(hoverClasses(classesOf(createElement(Badge, { tone: "outline", interactive: true }, "x")))).toEqual([
      "hover:border-primary-strong",
      "hover:text-primary",
      "hover:shadow-[var(--chrome-badge-outline-shadow-hover)]",
    ]);
  });

  test("size sm is the compact tag", () => {
    const classes = classesOf(createElement(Badge, { size: "sm" }, "x"));
    expect(classes).toContain("h-5");
    expect(classes).toContain("text-[10px]");
    expect(classes).not.toContain("text-xs");
  });
});

describe("EmptyState", () => {
  const html = renderToStaticMarkup(
    createElement(EmptyState, {
      variant: "page",
      icon: Inbox,
      title: "No decks yet",
      description: "Create one to start building.",
      action: createElement("button", { type: "button" }, "Create deck"),
    }),
  );

  test("renders the title, body and action slots in order", () => {
    const slot = (name: string, inner: string) => html.search(new RegExp(`data-slot="empty-state-${name}"[^>]*>${inner}<`));
    const title = slot("title", "No decks yet");
    const body = slot("description", "Create one to start building.");
    const action = slot("action", '<button type="button">Create deck');
    expect(title).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(title);
    expect(action).toBeGreaterThan(body);
  });

  test("every variant shares the dashed placeholder recipe", () => {
    for (const variant of ["page", "panel", "inline"] as const) {
      const classes = classesOf(createElement(EmptyState, { variant, title: "Empty" }));
      for (const name of ["border-dashed", "border-placeholder", "bg-muted-tint", "rounded-surface"]) expect(classes).toContain(name);
    }
  });

  test("leaves out slots it was not given", () => {
    expect(renderToStaticMarkup(createElement(EmptyState, { title: "Empty" }))).not.toContain("empty-state-action");
  });
});

describe("panels, feedback and counts", () => {
  test("Panel and Banner are fixed recipes on the surface radius", () => {
    expect(classesOf(createElement(Panel, null, "x")).slice(0, 4)).toEqual(["rounded-surface", "border", "border-surface", "bg-card-tint"]);
    expect(classesOf(createElement(Banner, null, "x"))).toContain("bg-muted-elevated");
  });

  test("Skeleton has one neutral tone", () => {
    expect(classesOf(createElement(Skeleton))).toEqual(["bg-muted", "animate-pulse", "rounded-md"]);
  });

  test("LoadingState announces itself and shows its label", () => {
    const html = renderToStaticMarkup(createElement(LoadingState, { label: "Loading decks" }));
    expect(html).toContain('role="status"');
    expect(html).toContain("<span>Loading decks</span>");
  });

  test("CountBadge caps at max", () => {
    expect(renderToStaticMarkup(createElement(CountBadge, { count: 7 }))).toContain(">7</span>");
    expect(renderToStaticMarkup(createElement(CountBadge, { count: 140 }))).toContain(">99+</span>");
  });

  test("Chip is a pill button that reports its pressed state", () => {
    const html = renderToStaticMarkup(createElement(Chip, { selected: true }, "Fire"));
    expect(html).toContain('aria-pressed="true"');
    expect(classesOf(createElement(Chip, { selected: true }, "Fire"))).toContain("bg-(--selected-bg)");
    expect(classesOf(createElement(Chip, null, "Fire"))).toContain("rounded-full");
  });

  test("Chip and FilterChip take their height from the control height tokens", () => {
    expect(classesOf(createElement(Chip, null, "Fire"))).toContain("h-(--control-h-sm)");
    expect(classesOf(createElement(Chip, { size: "xs" }, "Fire"))).toContain("h-(--control-h-xs)");
    const filterChip = createElement(FilterChip, { label: "Fire", selected: false, onClick: () => {}, size: "xs" });
    expect(classesOf(filterChip)).toContain("h-(--control-h-xs)");
  });
});
