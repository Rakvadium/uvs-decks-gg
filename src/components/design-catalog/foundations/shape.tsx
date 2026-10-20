"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { readRootToken, useRootSnapshot } from "../appearance/root-store";
import { CatalogEntrySection, Preview, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

const RADII = [
  { className: "rounded-md", role: "Controls / inputs / buttons / badges" },
  { className: "rounded-lg", role: "Cards / panels / dialogs" },
  { className: "rounded-xl", role: "Large feature surfaces" },
  { className: "rounded-3xl", role: "Hero / marketing shells" },
  { className: "rounded-full", role: "Pills / avatars" },
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
  const radius = useRootSnapshot(() => readRootToken("--radius"));
  return (
    <CatalogEntrySection
      id="radius"
      sourcePaths={["src/styles/base.css"]}
      description={
        <p>
          <Code>rounded-md</Code>/<Code>-lg</Code>/<Code>-xl</Code> derive from the chrome&apos;s <Code>--radius</Code>{" "}
          (now <Code>{radius || "…"}</Code>), so they change with the chrome. Bare <Code>rounded</Code> and{" "}
          <Code>rounded-sm</Code> are off-ladder; avoid one-off <Code>rounded-[Npx]</Code>.
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
      <CodeBlock code={`<Input className="rounded-md" />          {/* already the default */}\n<section className="rounded-lg border border-surface bg-card" />\n<Avatar className="rounded-full" />`} />
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
  const values = snapshot.split("\n");
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
              <SpecimenLabel className="line-clamp-2 block normal-case tracking-normal" >
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
