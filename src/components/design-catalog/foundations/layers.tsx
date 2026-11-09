"use client";

import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ZIndexStep } from "../source/parse";
import { CatalogEntrySection, Preview, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

/** Roles from docs/UI_UX_DESIGN.md § Z-index stack, keyed by the utility name in ladders.css. */
const Z_ROLES: Record<string, string> = {
  "z-sticky": "Sticky headers",
  "z-shell": "Shell chrome",
  "z-modal": "Modal / sheet baseline",
  "z-dialog-float": "In-dialog floating controls",
  "z-chrome": "Skip link / dialog chrome / hover preview",
  "z-popover": "Popovers, tooltips",
  "z-select": "Select menus, dropdown menus",
  "z-nested-overlay": "Nested dialog overlay",
  "z-nested-dialog": "Nested dialog content",
  "z-dock": "Media dock",
  "z-drag": "Drag preview",
};

export function ZIndexEntry({ steps }: { steps: ZIndexStep[] }) {
  const ordered = [...steps].sort((a, b) => a.value - b.value);
  return (
    <CatalogEntrySection
      id="z-index"
      sourcePaths={["src/styles/system/ladders.css"]}
      description={
        <p>
          Parsed from ladders.css. Local stacking inside a component stays <Code>z-10</Code>/<Code>z-20</Code>. Don&apos;t
          override a primitive&apos;s z-index from a call site: <Code>cn</Code> doesn&apos;t know these names yet.
        </p>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 overflow-hidden rounded-lg border border-hairline">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Layer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordered.map((step) => (
                <TableRow key={step.name}>
                  <TableCell>
                    <Code>{step.name}</Code>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{step.value}</TableCell>
                  <TableCell className="text-muted-foreground">{Z_ROLES[step.name] ?? "Not in docs/UI_UX_DESIGN.md"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Preview label="Stacking, bottom to top" className="overflow-hidden">
          {/* `isolate` keeps these real z-* classes inside this box. */}
          <div className="relative isolate h-[22rem]" aria-hidden>
            {ordered.map((step, index) => (
              <div
                key={step.name}
                className={cn(
                  "absolute flex h-9 w-44 items-center justify-between rounded-md border border-surface bg-card px-3 text-[11px] shadow-[var(--chrome-elevation-mid)]",
                  step.name,
                )}
                style={{ left: `${index * 0.6}rem`, bottom: `${index * 1.75}rem` }}
              >
                <span className="normal-case tracking-normal text-foreground">{step.name}</span>
                <span className="tabular-nums text-muted-foreground">{step.value}</span>
              </div>
            ))}
          </div>
        </Preview>
      </div>
    </CatalogEntrySection>
  );
}

const DURATIONS = [
  { className: "duration-150", role: "Hover / press / chrome feedback", changes: "Color, opacity, transform" },
  { className: "duration-200", role: "Controls (input, button, focus)", changes: "Color, border, background, box-shadow" },
  { className: "duration-300", role: "Overlay enter (sheets)", changes: "Opacity + transform" },
] as const;

export function MotionEntry() {
  const [moved, setMoved] = useState(false);
  return (
    <CatalogEntrySection
      id="motion"
      description={
        <p>
          Prefer <Code>transition-colors</Code>, <Code>transition-opacity</Code>, <Code>transition-transform</Code> or an
          explicit list, never <Code>transition-all</Code>. Travel is wrapped in <Code>motion-safe:</Code>, so with reduced
          motion these dots jump instead of gliding.
        </p>
      }
    >
      <Preview>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setMoved((value) => !value)} aria-pressed={moved}>
              {moved ? <RotateCcw /> : <Play />}
              {moved ? "Reset" : "Play"}
            </Button>
            <SpecimenLabel>All three start together.</SpecimenLabel>
          </div>
          <ul className="space-y-3">
            {DURATIONS.map((row) => (
              <li key={row.className} className="grid gap-2 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center">
                <div>
                  <Code>{row.className}</Code>
                  <SpecimenLabel className="mt-1 block">{row.role}</SpecimenLabel>
                </div>
                <div className="relative h-8 rounded-full border border-hairline bg-muted-tint">
                  {/* The runner spans the track, so translating it by 100% minus the dot lands the dot at the end. */}
                  <span
                    className={cn(
                      "absolute inset-1 motion-safe:transition-transform motion-safe:ease-out",
                      row.className,
                      moved ? "translate-x-[calc(100%-1.5rem)]" : "translate-x-0",
                    )}
                  >
                    <span className="block size-6 rounded-full bg-primary shadow-[var(--chrome-elevation-low)]" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Preview>
      <CodeBlock code={`<button className="transition-colors duration-150 hover:bg-primary-wash" />\n<span className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-hover:translate-x-0.5" />`} />
    </CatalogEntrySection>
  );
}
