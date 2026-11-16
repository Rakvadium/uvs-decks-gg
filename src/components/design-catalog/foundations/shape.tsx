"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { readRootToken, useRootSnapshot } from "../appearance/root-store";
import { normalizeCssValue } from "./css-values";
import { CatalogEntrySection, Preview, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RADII = [
  { className: "rounded-control", role: "Buttons, inputs, badges, toggles" },
  { className: "rounded-surface", role: "Cards, panels, popovers, dialogs" },
  { className: "rounded-xl", role: "Large feature surfaces" },
  { className: "rounded-tab-tl", role: "Corner tab flush in a surface corner (and rounded-tab-tr)" },
  { className: "rounded-full", role: "Pills, chips, avatars" },
] as const;

function RadiusTile({ className, role }: { className: string; role: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const raw = useRootSnapshot(() => (ref.current ? getComputedStyle(ref.current).borderTopLeftRadius : ""));
  // rounded-full is calc(infinity * 1px); show it as what it means, not 3.35e+07px.
  const radius = Number.parseFloat(raw) > 9999 ? "full" : raw;
  return (
    <li className="space-y-2">
      <div
        ref={ref}
        className={cn("flex h-24 items-center justify-center border-2 border-primary-strong bg-primary-wash", className)}
      >
        <span className="text-xs font-medium text-primary normal-case tracking-normal">{radius}</span>
      </div>
      <Code>{className}</Code>
      <SpecimenLabel className="block">{role}</SpecimenLabel>
    </li>
  );
}

export function RadiusEntry() {
  const radius = normalizeCssValue(useRootSnapshot(() => readRootToken("--radius")));
  return (
    <CatalogEntrySection
      id="radius"
      sourcePaths={["src/styles/base.css"]}
      description={
        <p>
          Every step derives from the chrome&apos;s <Code>--radius</Code> (now <Code>{radius || "…"}</Code>), so it
          changes with the chrome. Bare <Code>rounded</Code>, <Code>rounded-sm</Code>, <Code>rounded-2xl</Code> and up,
          corner-only forms and one-off <Code>rounded-[Npx]</Code> are off the ladder, and{" "}
          <Code>design/radius-ladder</Code> fails the lint on them.
        </p>
      }
    >
      <Preview>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {RADII.map((row) => (
            <RadiusTile key={row.className} {...row} />
          ))}
        </ul>
      </Preview>
      <CodeBlock code={`<section className="rounded-surface border border-surface bg-card" />\n<Button shape="tab-tl" size="icon-xs" aria-label="Flip" />  {/* flush in a card corner */}\n<Avatar className="rounded-full" />`} />
    </CatalogEntrySection>
  );
}

type RoleSpecimen = "radius" | "height" | "fill" | "border" | "text";

const ROLE_TOKENS: readonly { token: string; role: string; specimen: RoleSpecimen; utility?: string }[] = [
  { token: "--radius-control", role: "Buttons, inputs, toggles", specimen: "radius", utility: "rounded-control" },
  { token: "--radius-surface", role: "Cards, panels, popovers, dialogs", specimen: "radius", utility: "rounded-surface" },
  { token: "--radius-cta", role: "Primary call to action", specimen: "radius", utility: "rounded-cta" },
  { token: "--radius-island", role: "Floating islands, capsules, header pills", specimen: "radius", utility: "rounded-island" },
  { token: "--control-h-xs", role: "Control height, extra small", specimen: "height" },
  { token: "--control-h-sm", role: "Control height, small", specimen: "height" },
  { token: "--control-h-md", role: "Control height, default", specimen: "height" },
  { token: "--control-h-lg", role: "Control height, large", specimen: "height" },
  { token: "--selected-bg", role: "Selected or active fill", specimen: "fill" },
  { token: "--selected-border", role: "Selected or active border", specimen: "border" },
  { token: "--selected-fg", role: "Selected or active text and icon", specimen: "text" },
  { token: "--hover-bg", role: "Hover fill", specimen: "fill" },
];

function RoleSpecimenCell({ token, specimen, utility }: { token: string; specimen: RoleSpecimen; utility?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const painted = useRootSnapshot(() => {
    if (!ref.current) return "";
    const style = getComputedStyle(ref.current);
    return specimen === "radius" ? style.borderTopLeftRadius : specimen === "height" ? style.height : "";
  });
  const box = "border-2 border-primary-strong bg-primary-wash";
  return (
    <div className="flex items-center gap-3">
      {specimen === "radius" && <div ref={ref} className={cn("h-9 w-20", box, utility)} />}
      {specimen === "height" && <div ref={ref} className={cn("w-20", box)} style={{ height: `var(${token})` }} />}
      {specimen === "fill" && <div className="h-9 w-20 rounded-md border border-surface" style={{ background: `var(${token})` }} />}
      {specimen === "border" && <div className="h-9 w-20 rounded-md border-2" style={{ borderColor: `var(${token})` }} />}
      {specimen === "text" && (
        <span className="text-sm font-medium" style={{ color: `var(${token})` }}>
          Selected
        </span>
      )}
      {painted && <SpecimenLabel className="normal-case tracking-normal tabular-nums">{painted}</SpecimenLabel>}
    </div>
  );
}

export function RoleTokensEntry() {
  const snapshot = useRootSnapshot(() => ROLE_TOKENS.map((row) => readRootToken(row.token)).join("\n"));
  const values = snapshot.split("\n").map(normalizeCssValue);
  return (
    <CatalogEntrySection
      id="role-tokens"
      sourcePaths={["src/styles/base.css"]}
      description={
        <p>
          Each chrome sets these tokens, and every CTA, island, control and surface reads them. Inside one chrome,{" "}
          <Code>--radius-cta</Code> and <Code>--radius-island</Code> hold one value: a pill in calm, expressive and
          darkmatter, the chrome&apos;s own <Code>--radius</Code> in bubblegum and holoterminal. Selected and hover
          tokens are steps of <Code>--accent</Code> on the tone ladder, so custom palettes follow.
        </p>
      }
    >
      <div className="overflow-hidden rounded-lg border border-surface bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Token</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="pr-4">Specimen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROLE_TOKENS.map((row, index) => (
              <TableRow key={row.token} data-role-token={row.token}>
                <TableCell className="pl-4">
                  <div className="flex flex-col items-start gap-1">
                    <Code>{row.token}</Code>
                    {row.utility && <Code>{row.utility}</Code>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.role}</TableCell>
                <TableCell className="max-w-64 whitespace-normal">
                  <Code className="block w-fit max-w-full whitespace-normal break-all">{values[index] || "…"}</Code>
                </TableCell>
                <TableCell className="pr-4">
                  <RoleSpecimenCell token={row.token} specimen={row.specimen} utility={row.utility} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CodeBlock code={`<section className="rounded-surface border border-surface bg-card" />\n<div className="rounded-island shadow-[var(--chrome-floating-shadow)]" />\n<li className="bg-[var(--selected-bg)] border-[var(--selected-border)] text-[var(--selected-fg)]" />`} />
    </CatalogEntrySection>
  );
}

const SHADOWS = [
  { className: "shadow-xs", token: "--shadow-xs", role: "Inputs, quiet controls" },
  { className: "shadow-sm", token: "--shadow-sm", role: "Low" },
  { className: "shadow-md", token: "--shadow-md", role: "Mid" },
  { className: "shadow-lg", token: "--shadow-lg", role: "Mobile dialogs" },
  { className: "shadow-[var(--chrome-elevation-low)]", token: "--chrome-elevation-low", role: "Chrome low" },
  { className: "shadow-[var(--chrome-elevation-mid)]", token: "--chrome-elevation-mid", role: "Chrome mid" },
  { className: "shadow-[var(--chrome-card-shadow)]", token: "--chrome-card-shadow", role: "Card rest" },
  { className: "shadow-[var(--chrome-popover-shadow)]", token: "--chrome-popover-shadow", role: "Popover, menus" },
  { className: "shadow-[var(--chrome-floating-shadow)]", token: "--chrome-floating-shadow", role: "Floating islands, pills" },
  {
    className: "shadow-[var(--chrome-floating-shadow-focus)]",
    token: "--chrome-floating-shadow-focus",
    role: "Island focus-within",
  },
] as const;

export function ElevationEntry() {
  const snapshot = useRootSnapshot(() => SHADOWS.map((row) => readRootToken(row.token)).join("\n"));
  const values = snapshot.split("\n").map(normalizeCssValue);
  return (
    <CatalogEntrySection
      id="elevation"
      sourcePaths={["src/styles/base.css"]}
      description={
        <p>
          Prefer chrome tokens over ad-hoc <Code>rgba</Code>/<Code>hsl</Code> shadows. Tokens fork by mode themselves,
          so call sites never write <Code>dark:shadow-…</Code>.
        </p>
      }
    >
      <Preview plain className="bg-muted-tint">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 xl:grid-cols-5">
          {SHADOWS.map((row, index) => (
            <li key={row.className} className="min-w-0 space-y-2.5">
              <div className={cn("h-20 rounded-lg border border-hairline bg-card", row.className)} />
              <Code className="block w-fit max-w-full whitespace-normal break-all">{row.className}</Code>
              <SpecimenLabel className="block">{row.role}</SpecimenLabel>
              <SpecimenLabel className="line-clamp-2 block normal-case tracking-normal">
                <span title={values[index]}>{values[index] || "—"}</span>
              </SpecimenLabel>
            </li>
          ))}
        </ul>
      </Preview>
      <CodeBlock code={`<div className="rounded-full shadow-[var(--chrome-floating-shadow)] focus-within:shadow-[var(--chrome-floating-shadow-focus)]" />\n<div className="shadow-[var(--chrome-elevation-low)] hover:shadow-[var(--chrome-elevation-mid)]" />`} />
    </CatalogEntrySection>
  );
}
