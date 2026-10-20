"use client";

import { useMemo } from "react";
import { converter, parse, wcagContrast } from "culori";
import { Badge } from "@/components/ui/badge";
import { Kicker } from "@/components/ui/typography-headings";
import { COLOR_PRESET_OPTIONS } from "@/providers/ColorSchemeProvider";
import { cn } from "@/lib/utils";
import { readRootToken, useRootSnapshot } from "../appearance/root-store";
import { useCatalogAppearance } from "../appearance/context";
import type { ColorTokenSource } from "../source/read";
import { CatalogEntrySection } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

const GROUPS: { label: string; match: RegExp; usage: string }[] = [
  {
    label: "Surfaces",
    match: /^--(background|foreground|card|card-foreground|popover|popover-foreground|muted|muted-foreground)$/,
    usage: "bg-card text-card-foreground",
  },
  { label: "Brand", match: /^--(primary|secondary|accent)(-foreground)?$/, usage: "bg-primary text-primary-foreground" },
  {
    label: "Status",
    match: /^--(destructive|success|warning|info)(-foreground)?$/,
    usage: "bg-warning-wash border-warning-soft text-warning",
  },
  { label: "Lines & focus", match: /^--(border|input|ring)$/, usage: "border-surface focus-visible:ring-ring" },
  { label: "Charts", match: /^--chart-/, usage: "fill-chart-1" },
  { label: "Sidebar", match: /^--sidebar/, usage: "bg-sidebar text-sidebar-foreground" },
];

const toOklch = converter("oklch");

function asOklch(value: string): string | null {
  if (!value || value.startsWith("oklch(")) return null;
  const color = parse(value);
  if (!color) return null;
  const { l, c, h } = toOklch(color);
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${(h ?? 0).toFixed(1)})`;
}

function contrastLabel(ratio: number): { text: string; tone: "success" | "warning" | "destructive" } {
  if (ratio >= 7) return { text: "AAA", tone: "success" };
  if (ratio >= 4.5) return { text: "AA", tone: "success" };
  if (ratio >= 3) return { text: "AA large", tone: "warning" };
  return { text: "Low", tone: "destructive" };
}

interface Swatch {
  name: string;
  pair?: string;
  themes: ColorTokenSource["themes"];
  origin: ColorTokenSource["origin"];
}

/** `--x` pairs with `--x-foreground`; `--background` pairs with `--foreground`. */
function toSwatches(tokens: ColorTokenSource[]): Swatch[] {
  const names = new Set(tokens.map((token) => token.name));
  const swatches: Swatch[] = [];
  for (const token of tokens) {
    if (token.name.endsWith("-foreground") && names.has(token.name.slice(0, -"-foreground".length))) continue;
    if (token.name === "--foreground" && names.has("--background")) continue;
    const pair =
      token.name === "--background" && names.has("--foreground")
        ? "--foreground"
        : names.has(`${token.name}-foreground`)
          ? `${token.name}-foreground`
          : undefined;
    swatches.push({ name: token.name, pair, themes: token.themes, origin: token.origin });
  }
  return swatches;
}

/** Shows the value as oklch (the CSS pipeline may hand back lab/hex), plus the computed string when it differs. */
function TokenValue({ name, value }: { name: string; value: string }) {
  const converted = asOklch(value);
  const primary = converted ?? value;
  return (
    <div className="min-w-0">
      <div className="truncate text-xs font-medium normal-case tracking-normal text-foreground">{name}</div>
      <div className="truncate text-[11px] normal-case tracking-normal text-foreground/80" title={primary || undefined}>
        {primary || "not set by this preset"}
      </div>
      {converted ? (
        <div className="truncate text-[11px] normal-case tracking-normal text-muted-foreground" title={value}>
          computed {value}
        </div>
      ) : null}
    </div>
  );
}

function SwatchCard({ swatch, values }: { swatch: Swatch; values: Map<string, string> }) {
  const value = values.get(swatch.name) ?? "";
  const pairValue = swatch.pair ? (values.get(swatch.pair) ?? "") : "";
  const ratio = useMemo(() => {
    if (!value || !pairValue) return null;
    try {
      return wcagContrast(value, pairValue);
    } catch {
      return null;
    }
  }, [value, pairValue]);
  const rating = ratio !== null ? contrastLabel(ratio) : null;
  const presetOnly =
    swatch.origin === "theme" && swatch.themes.length < COLOR_PRESET_OPTIONS.length
      ? swatch.themes
          .map((theme) => COLOR_PRESET_OPTIONS.find((row) => row.id === theme)?.label ?? theme)
          .join(", ")
      : null;

  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-surface bg-card">
      <div
        className="relative flex h-20 items-end justify-between gap-2 border-b border-hairline p-2.5"
        style={{ background: `var(${swatch.name})`, color: swatch.pair ? `var(${swatch.pair})` : undefined }}
      >
        {swatch.pair ? <span className="text-lg font-semibold leading-none">Aa</span> : <span />}
        {rating && ratio !== null ? (
          <Badge tone={rating.tone} className="bg-background text-[10px]">
            {ratio.toFixed(1)}:1 {rating.text}
          </Badge>
        ) : null}
      </div>
      <div className="space-y-2 p-2.5">
        <TokenValue name={swatch.name} value={value} />
        {swatch.pair ? <TokenValue name={swatch.pair} value={pairValue} /> : null}
        {presetOnly ? <div className="text-[11px] text-muted-foreground">Only in: {presetOnly}</div> : null}
      </div>
    </li>
  );
}

export function ColorTokens({ tokens }: { tokens: ColorTokenSource[] }) {
  const { current } = useCatalogAppearance();
  const names = useMemo(() => tokens.map((token) => token.name), [tokens]);
  const snapshot = useRootSnapshot(() => names.map(readRootToken).join("\n"));
  const values = useMemo(() => {
    const parts = snapshot ? snapshot.split("\n") : [];
    return new Map(names.map((name, index) => [name, parts[index] ?? ""]));
  }, [names, snapshot]);

  const swatches = useMemo(() => toSwatches(tokens), [tokens]);
  const grouped = useMemo(() => {
    const used = new Set<string>();
    const groups = GROUPS.map((group) => {
      const rows = swatches.filter((swatch) => group.match.test(swatch.name));
      rows.forEach((row) => used.add(row.name));
      return { ...group, rows };
    });
    // Tokens only some presets declare: show the ones the current preset sets, list the rest.
    const extras = swatches.filter((swatch) => !used.has(swatch.name));
    const setHere = extras.filter((swatch) => values.get(swatch.name));
    if (setHere.length) groups.push({ label: "Preset extras", match: /$^/, usage: "", rows: setHere });
    return {
      groups: groups.filter((group) => group.rows.length > 0),
      unset: extras.filter((swatch) => !values.get(swatch.name)),
    };
  }, [swatches, values]);

  const themeLabel =
    current.rawTheme === "custom"
      ? "your custom palette"
      : (COLOR_PRESET_OPTIONS.find((row) => row.id === current.theme)?.label ?? current.theme);

  return (
    <CatalogEntrySection
      id="color-tokens"
      sourcePaths={["src/styles/themes", "src/styles/base.css"]}
      description={
        <p>
          Showing <span className="font-medium text-foreground">{themeLabel}</span> in {current.mode} mode. Each card
          shows the token, the value it resolves to on <Code>&lt;html&gt;</Code>, and for foreground pairs the WCAG
          contrast. Use them through Tailwind (<Code>bg-primary</Code>, <Code>text-muted-foreground</Code>), or{" "}
          <Code>var(--primary)</Code> in arbitrary values.
        </p>
      }
    >
      <div className="space-y-8">
        {grouped.groups.map((group) => (
          <section key={group.label} aria-label={`${group.label} tokens`} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Kicker tone="foreground" size="md">
                {group.label}
              </Kicker>
              {group.usage ? <Code>{group.usage}</Code> : null}
            </div>
            <ul className={cn("grid gap-3", "grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]")}>
              {group.rows.map((swatch) => (
                <SwatchCard key={swatch.name} swatch={swatch} values={values} />
              ))}
            </ul>
          </section>
        ))}
        {grouped.unset.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Preset-only tokens not set by this preset:{" "}
            {grouped.unset.map((swatch, index) => (
              <span key={swatch.name}>
                {index > 0 ? ", " : null}
                <Code>{swatch.name}</Code> (
                {swatch.themes.map((theme) => COLOR_PRESET_OPTIONS.find((row) => row.id === theme)?.label ?? theme).join(", ")})
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <CodeBlock
        code={`<div className="bg-card text-card-foreground border border-surface" />\n<span className="text-success" />            {/* status: never green-* / amber-* */}\n<div className="shadow-[0_0_0_1px_var(--ring)]" />`}
      />
    </CatalogEntrySection>
  );
}
