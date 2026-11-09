import { cn } from "@/lib/utils";
import { Kicker } from "@/components/ui/typography-headings";
import type { LadderSource } from "../source/parse";
import { CatalogEntrySection, Preview, SpecimenGrid, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

/** Roles from docs/UI_UX_DESIGN.md, keyed by the step name ladders.css uses. */
const BORDER_ROLES: Record<string, string> = {
  hairline: "Hairline divider",
  divider: "Mid divider / inset split",
  surface: "Default surface",
  placeholder: "Dashed empty / placeholder",
};

const SURFACE_ROLES: Record<string, string> = {
  tint: "Tint / inset",
  soft: "Soft panel",
  elevated: "Elevated panel",
  overlay: "Near-opaque overlay",
};

const TONE_ROLES: Record<string, string> = {
  "bg-wash": "Wash / hover fill",
  "bg-selected": "Selected / badge fill",
  "bg-dim": "Hover of a solid fill",
  "border-soft": "Soft border",
  "border-strong": "Strong border / active",
  "ring-soft": "Invalid / quiet ring",
  "ring-strong": "Active / focus ring",
};

const SOURCE_PATH = "src/styles/system/ladders.css";

function UnknownStep() {
  return <span className="text-warning">not in docs/UI_UX_DESIGN.md</span>;
}

export function BorderLadder({ ladders }: { ladders: LadderSource }) {
  return (
    <CatalogEntrySection
      id="border-ladder"
      sourcePaths={[SOURCE_PATH]}
      description={
        <p>
          Structural borders. The utility sets the color only; width comes from <Code>border</Code>,{" "}
          <Code>border-t</Code>, … Form and toolbar controls use <Code>--control-dual-border</Code> instead.
        </p>
      }
    >
      <Preview>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ladders.borders.map((row) => (
            <li key={row.name} className="space-y-2">
              <div
                className={cn(
                  "flex h-20 items-center justify-center rounded-lg border-2 bg-card",
                  row.name,
                  row.step === "placeholder" && "border-dashed",
                )}
              >
                <span className="text-xs text-muted-foreground">{BORDER_ROLES[row.step] ?? <UnknownStep />}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Code>{row.name}</Code>
                <SpecimenLabel>= {row.alias}</SpecimenLabel>
              </div>
            </li>
          ))}
        </ul>
      </Preview>
      <CodeBlock code={`<div className="rounded-lg border border-surface bg-card" />\n<li className="border-t border-hairline" />\n<div className="rounded-lg border border-dashed border-placeholder" />`} />
    </CatalogEntrySection>
  );
}

export function SurfaceLadder({ ladders }: { ladders: LadderSource }) {
  const steps = ladders.surfaces[0]?.steps.map((step) => step.step) ?? [];
  return (
    <CatalogEntrySection
      id="surface-ladder"
      sourcePaths={[SOURCE_PATH]}
      description={
        <p>
          Translucent fills, written <Code>bg-{"{base}"}-{"{step}"}</Code>. Each swatch sits on a striped
          primary/secondary field so the opacity is visible. Solid <Code>bg-card</Code> etc. stay valid when nothing
          needs to show through.
        </p>
      }
    >
      <Preview>
        <SpecimenGrid
          label="Surface ladder swatches"
          rowHeader="Base"
          columns={steps.map((step) => ({ title: `bg-{base}-${step}`, note: SURFACE_ROLES[step] ?? "Not in docs/UI_UX_DESIGN.md" }))}
          rows={ladders.surfaces.map((row) => ({
            label: <Code>{row.base}</Code>,
            cells: row.steps.map((step) => (
              <div key={step.name} className="w-32 space-y-1.5">
                <div className="h-14 overflow-hidden rounded-md border border-hairline bg-[repeating-linear-gradient(135deg,var(--primary)_0_8px,var(--secondary)_8px_16px)]">
                  <div className={cn("size-full", step.name)} />
                </div>
                <Code>{step.name}</Code>
                <SpecimenLabel className="block normal-case tracking-normal">= {step.alias}</SpecimenLabel>
              </div>
            )),
          }))}
        />
      </Preview>
      <CodeBlock code={`<header className="sticky top-0 bg-background-elevated backdrop-blur-sm" />\n<aside className="rounded-lg bg-card-soft" />\n<div className="bg-muted-tint" />  {/* inset well */}`} />
    </CatalogEntrySection>
  );
}

export function ToneLadder({ ladders }: { ladders: LadderSource }) {
  const columns = ladders.tones[0]?.steps.map((step) => `${step.property}-${step.step}`) ?? [];
  return (
    <CatalogEntrySection
      id="tone-ladder"
      sourcePaths={[SOURCE_PATH]}
      description={
        <p>
          Semantic tints of each tone. Hover moves one step up: <Code>-wash</Code> → <Code>-selected</Code>,{" "}
          <Code>-soft</Code> → <Code>-strong</Code>, solid → <Code>-dim</Code>. Any other opacity is legacy.
        </p>
      }
    >
      <Preview>
        <SpecimenGrid
          label="Tone ladder swatches"
          rowHeader="Tone"
          columns={columns.map((column) => {
            const [property, step] = column.split("-");
            return { title: `${property}-{tone}-${step}`, note: TONE_ROLES[column] ?? "Not in docs/UI_UX_DESIGN.md" };
          })}
          cellClassName="px-2"
          rows={ladders.tones.map((row) => ({
            label: <Code>{row.tone}</Code>,
            cells: row.steps.map((step) => (
              <div
                key={step.name}
                title={`${step.name} = ${step.alias}`}
                className={cn(
                  "h-10 w-24 rounded-md",
                  step.property === "bg" && step.name,
                  step.property === "border" && cn("border-2 bg-card", step.name),
                  step.property === "ring" && cn("bg-card ring-2", step.name),
                )}
              >
                <span className="sr-only">{step.name}</span>
              </div>
            )),
          }))}
        />
        <SpecimenLabel className="mt-4 block">
          Each cell is the utility named by its column with the row&apos;s tone, e.g. <Code>border-warning-soft</Code> ={" "}
          <Code>border-warning/40</Code>. Hover a cell for its class.
        </SpecimenLabel>
      </Preview>
      <CodeBlock
        code={`<Badge tone="warning" />                          {/* bg-warning-selected border-warning-soft */}\n<div className="rounded-md bg-primary-wash hover:bg-primary-selected" />\n<button className="bg-primary hover:bg-primary-dim" />\n<input className="aria-invalid:ring-destructive-soft focus-visible:ring-primary-strong" />`}
      />
      {ladders.unclassified.length > 0 ? (
        <div className="rounded-md border border-warning-soft bg-warning-wash p-3 text-sm">
          <Kicker tone="foreground">Unlisted utilities in ladders.css</Kicker>
          <p className="mt-1 text-muted-foreground">{ladders.unclassified.map((row) => row.name).join(", ")}</p>
        </div>
      ) : null}
    </CatalogEntrySection>
  );
}
