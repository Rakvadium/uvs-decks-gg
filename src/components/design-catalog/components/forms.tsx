"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { ControlSize } from "@/components/ui/control";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionTile } from "@/components/ui/option-tile";
import { SearchField } from "@/components/ui/search-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CatalogEntrySection, Preview, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

const CONTROL_SIZES: ControlSize[] = ["xs", "sm", "md", "lg"];

function StateCell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <SpecimenLabel className="block">{label}</SpecimenLabel>
      {children}
    </div>
  );
}

export function InputEntry() {
  return (
    <CatalogEntrySection
      id="input"
      description={
        <p>
          <Code>size</Code> is <Code>xs</Code>, <Code>sm</Code>, <Code>md</Code> (default) or <Code>lg</Code> and reads{" "}
          <Code>--control-h-*</Code>. <Code>Input</Code>, <Code>Textarea</Code> and <Code>SelectTrigger</Code> share one field
          surface: <Code>rounded-control</Code>, <Code>bg-background-soft</Code>, the dual control border and the{" "}
          <Code>--chrome-focus-shadow</Code> ring. Call sites never pass a height, radius or background. Invalid is{" "}
          <Code>aria-invalid</Code>, not a class. Text is <Code>text-base</Code> on phones so iOS doesn&apos;t zoom.
        </p>
      }
    >
      <Preview>
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
          <StateCell label="Sizes" className="sm:col-span-2 xl:col-span-3">
            <div className="grid items-end gap-3 sm:grid-cols-4">
              {CONTROL_SIZES.map((size) => (
                <Input key={size} size={size} placeholder={`size="${size}"`} aria-label={`Deck name (${size})`} />
              ))}
            </div>
          </StateCell>
          <StateCell label="Placeholder">
            <Input placeholder="Deck name…" aria-label="Deck name (placeholder)" />
          </StateCell>
          <StateCell label="Filled">
            <Input defaultValue="Spellbook Control" aria-label="Deck name (filled)" />
          </StateCell>
          <StateCell label="Disabled">
            <Input disabled defaultValue="Read only" aria-label="Deck name (disabled)" />
          </StateCell>
          <StateCell label="aria-invalid">
            <Input aria-invalid defaultValue="Spellbook Control" aria-label="Deck name (invalid)" />
          </StateCell>
          <StateCell label='type="file"'>
            <Input type="file" aria-label="Deck file" />
          </StateCell>
          <StateCell label="With Label">
            <div className="space-y-2">
              <Label htmlFor="catalog-input-label">Display name</Label>
              <Input id="catalog-input-label" placeholder="agent…" />
            </div>
          </StateCell>
          <StateCell label="Textarea" className="sm:col-span-2 xl:col-span-2">
            <Textarea placeholder="Deck notes, sideboard plans…" aria-label="Deck notes" />
          </StateCell>
          <StateCell label="Textarea disabled">
            <Textarea disabled defaultValue="Locked" aria-label="Deck notes (disabled)" />
          </StateCell>
        </div>
      </Preview>
      <CodeBlock
        code={`import { Input } from "@/components/ui/input"\nimport { Label } from "@/components/ui/label"\nimport { Textarea } from "@/components/ui/textarea"\n\n<Label htmlFor="name">Display name</Label>\n<Input id="name" aria-invalid={!!error} />\n<Input size="sm" placeholder="Lane name" />\n<Textarea placeholder="Notes" />`}
      />
    </CatalogEntrySection>
  );
}

export function FieldEntry() {
  const [name, setName] = useState("");
  const invalid = name.trim().length === 0;
  return (
    <CatalogEntrySection
      id="field"
      description={
        <p>
          Layout for labelled controls. <Code>Field orientation</Code> is <Code>vertical</Code>, <Code>horizontal</Code>{" "}
          or <Code>responsive</Code> (row once the <Code>FieldGroup</Code> container is ≥ md). Set{" "}
          <Code>data-invalid</Code> on the Field and <Code>aria-invalid</Code> on the control.
        </p>
      }
    >
      <Preview>
        <form className="max-w-xl" onSubmit={(event) => event.preventDefault()}>
          <FieldSet>
            <FieldLegend>New deck</FieldLegend>
            <FieldDescription>FieldSet → FieldLegend → FieldGroup → Field.</FieldDescription>
            <FieldGroup>
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor="catalog-field-name">Deck name</FieldLabel>
                <Input
                  id="catalog-field-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={invalid || undefined}
                  placeholder="Type a name to clear the error…"
                  autoComplete="off"
                />
                {invalid ? <FieldError>Give the deck a name.</FieldError> : <FieldDescription>Shown on your profile.</FieldDescription>}
              </Field>
              <FieldSeparator>or</FieldSeparator>
              <Field orientation="horizontal">
                <Checkbox id="catalog-field-public" defaultChecked />
                <FieldContent>
                  <FieldLabel htmlFor="catalog-field-public">Public deck</FieldLabel>
                  <FieldDescription>Anyone with the link can view it.</FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldLabel htmlFor="catalog-field-sync">Sync with collection</FieldLabel>
                  <FieldDescription>orientation=&quot;responsive&quot;: a row on wide containers.</FieldDescription>
                </FieldContent>
                <Switch id="catalog-field-sync" />
              </Field>
              <FieldLabel htmlFor="catalog-field-tournament">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      Tournament mode <Badge tone="info">Beta</Badge>
                    </FieldTitle>
                    <FieldDescription>A FieldLabel wrapping a Field becomes a selectable card.</FieldDescription>
                  </FieldContent>
                  <Checkbox id="catalog-field-tournament" />
                </Field>
              </FieldLabel>
            </FieldGroup>
          </FieldSet>
        </form>
      </Preview>
      <CodeBlock
        code={`import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"\n\n<FieldSet>\n  <FieldLegend>New deck</FieldLegend>\n  <FieldGroup>\n    <Field data-invalid={!!error}>\n      <FieldLabel htmlFor="name">Deck name</FieldLabel>\n      <Input id="name" aria-invalid={!!error} />\n      {error ? <FieldError>{error}</FieldError> : <FieldDescription>Shown on your profile.</FieldDescription>}\n    </Field>\n    <Field orientation="horizontal">\n      <Checkbox id="public" />\n      <FieldLabel htmlFor="public">Public deck</FieldLabel>\n    </Field>\n  </FieldGroup>\n</FieldSet>`}
      />
    </CatalogEntrySection>
  );
}

const FORMATS = [
  { value: "standard", label: "Standard" },
  { value: "retro", label: "Retro" },
  { value: "draft", label: "Draft" },
];

function FormatSelect(props: {
  size?: ControlSize;
  variant?: "field" | "inline";
  shape?: "control" | "island";
  disabled?: boolean;
  invalid?: boolean;
  label: string;
  placeholder?: boolean;
}) {
  return (
    <Select defaultValue={props.placeholder ? undefined : "standard"} disabled={props.disabled}>
      <SelectTrigger
        size={props.size}
        variant={props.variant}
        shape={props.shape}
        aria-invalid={props.invalid || undefined}
        aria-label={props.label}
        className="w-full"
      >
        <SelectValue placeholder="Choose a format" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Constructed</SelectLabel>
          {FORMATS.slice(0, 2).map((format) => (
            <SelectItem key={format.value} value={format.value}>
              {format.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Limited</SelectLabel>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="sealed" disabled>
            Sealed (soon)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function SelectEntry() {
  return (
    <CatalogEntrySection
      id="select"
      description={
        <p>
          <Code>SelectTrigger size</Code> matches <Code>Input</Code>: <Code>xs</Code>, <Code>sm</Code>, <Code>md</Code>{" "}
          (default) or <Code>lg</Code>. <Code>variant=&quot;inline&quot;</Code> drops the field border and fill for a
          trigger that sits inside another control&apos;s surface, such as a stat operator or a toolbar scope.{" "}
          <Code>shape=&quot;island&quot;</Code> rounds it to <Code>--radius-island</Code> inside a floating island, like
          the island buttons beside it.{" "}
          <Code>hideIcon</Code> and <Code>compactValue</Code> tune dense toolbars. Content portals at{" "}
          <Code>z-select</Code>. Open one to see groups, labels, a separator and a disabled item.
        </p>
      }
    >
      <Preview>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {CONTROL_SIZES.map((size) => (
            <StateCell key={size} label={`size="${size}"`}>
              <FormatSelect size={size} label={`Format (${size})`} />
            </StateCell>
          ))}
          <StateCell label='variant="inline"'>
            <div className="flex h-(--control-h-md) items-center rounded-control border border-surface px-1">
              <FormatSelect variant="inline" size="sm" label="Format (inline)" />
            </div>
          </StateCell>
          <StateCell label='variant="inline" shape="island"'>
            <div className="flex h-(--control-h-md) items-center rounded-island border border-surface px-1">
              <FormatSelect variant="inline" shape="island" size="sm" label="Format (island)" />
            </div>
          </StateCell>
          <StateCell label="Placeholder">
            <FormatSelect placeholder label="Format (placeholder)" />
          </StateCell>
          <StateCell label="Disabled">
            <FormatSelect disabled label="Format (disabled)" />
          </StateCell>
          <StateCell label="aria-invalid">
            <FormatSelect invalid placeholder label="Format (invalid)" />
          </StateCell>
        </div>
      </Preview>
      <CodeBlock
        code={`import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"\n\n<Select value={format} onValueChange={setFormat}>\n  <SelectTrigger size="sm" aria-label="Format">\n    <SelectValue placeholder="Choose a format" />\n  </SelectTrigger>\n  <SelectContent>\n    <SelectItem value="standard">Standard</SelectItem>\n  </SelectContent>\n</Select>`}
      />
    </CatalogEntrySection>
  );
}

export function ChoiceControlsEntry() {
  const [range, setRange] = useState([2, 6]);
  return (
    <CatalogEntrySection
      id="choice-controls"
      description={
        <p>
          Radix-backed, so keyboard and labels come for free: pair each with a <Code>Label htmlFor</Code>. A checked{" "}
          <Code>Switch</Code> reads <Code>--selected-bg</Code>, <Code>--selected-border</Code> and{" "}
          <Code>--selected-fg</Code>, and focuses with the input ring.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Preview label="Checkbox">
          <ul className="space-y-3">
            {(
              [
                ["Unchecked", {}],
                ["Checked", { defaultChecked: true }],
                ["Indeterminate", { checked: "indeterminate" as const }],
                ["Disabled", { disabled: true }],
                ["Disabled, checked", { disabled: true, defaultChecked: true }],
                ["aria-invalid", { "aria-invalid": true }],
              ] as const
            ).map(([label, props]) => (
              <li key={label} className="flex items-center gap-2.5">
                <Checkbox id={`catalog-checkbox-${label}`} {...props} />
                <Label htmlFor={`catalog-checkbox-${label}`} className="font-normal">
                  {label}
                </Label>
              </li>
            ))}
          </ul>
        </Preview>
        <Preview label="Switch">
          <ul className="space-y-3">
            {(
              [
                ["Off", {}],
                ["On", { defaultChecked: true }],
                ["Disabled", { disabled: true }],
                ["Disabled, on", { disabled: true, defaultChecked: true }],
              ] as const
            ).map(([label, props]) => (
              <li key={label} className="flex items-center gap-2.5">
                <Switch id={`catalog-switch-${label}`} {...props} />
                <Label htmlFor={`catalog-switch-${label}`} className="font-normal">
                  {label}
                </Label>
              </li>
            ))}
          </ul>
        </Preview>
        <Preview label="Slider">
          <div className="space-y-6">
            <StateCell label="Single">
              <Slider defaultValue={[40]} aria-label="Card size" />
            </StateCell>
            <StateCell label={`Range · cost ${range[0]}–${range[1]}`}>
              <Slider value={range} onValueChange={setRange} min={0} max={10} step={1} aria-label="Cost range" />
            </StateCell>
            <StateCell label="Disabled">
              <Slider defaultValue={[60]} disabled aria-label="Card size (disabled)" />
            </StateCell>
          </div>
        </Preview>
      </div>
      <CodeBlock
        code={`<Checkbox id="public" checked={value} onCheckedChange={setValue} />\n<Switch id="sync" checked={sync} onCheckedChange={setSync} />\n<Slider value={range} onValueChange={setRange} min={0} max={10} step={1} aria-label="Cost range" />`}
      />
    </CatalogEntrySection>
  );
}

const SCOPES = [
  { value: "public", label: "Public", body: "Anyone can rank it." },
  { value: "team", label: "Team", body: "Your team ranks it." },
  { value: "private", label: "Private", body: "Only you see it." },
];

const SYMBOLS = ["Air", "Death", "Fire", "Water", "Life"];

export function OptionTileEntry() {
  const [scope, setScope] = useState("public");
  const [symbols, setSymbols] = useState<string[]>(["Fire"]);
  const toggleSymbol = (symbol: string) =>
    setSymbols((current) => (current.includes(symbol) ? current.filter((entry) => entry !== symbol) : [...current, symbol]));
  return (
    <CatalogEntrySection
      id="option-tile"
      description={
        <p>
          A selectable tile: a <Code>button</Code> with <Code>aria-pressed</Code>, <Code>rounded-control</Code> and a{" "}
          <Code>focus-visible</Code> ring. Selected reads <Code>--selected-bg</Code>, <Code>--selected-border</Code> and{" "}
          <Code>--selected-fg</Code>; idle hover reads <Code>--hover-bg</Code>. <Code>variant=&quot;outline&quot;</Code>{" "}
          (default) gives idle tiles a surface border, <Code>&quot;ghost&quot;</Code> a transparent one for list rows and
          popover choices. The call site sets layout and padding only.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Preview label="outline · one choice">
          <div className="grid gap-2">
            {SCOPES.map((option) => (
              <OptionTile key={option.value} selected={scope === option.value} onClick={() => setScope(option.value)} className="px-4 py-3 text-left">
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.body}</span>
              </OptionTile>
            ))}
          </div>
        </Preview>
        <Preview label="outline · several · disabled">
          <div className="flex flex-wrap gap-1.5">
            {SYMBOLS.map((symbol) => (
              <OptionTile key={symbol} selected={symbols.includes(symbol)} onClick={() => toggleSymbol(symbol)} className="px-2.5 py-1.5 text-xs">
                {symbol}
              </OptionTile>
            ))}
            <OptionTile selected={false} disabled className="px-2.5 py-1.5 text-xs">
              Good
            </OptionTile>
          </div>
        </Preview>
      </div>
      <CodeBlock
        code={`import { OptionTile } from "@/components/ui/option-tile"

<OptionTile selected={scope === "team"} onClick={() => setScope("team")} className="px-4 py-3 text-left">
  Team
</OptionTile>
<OptionTile variant="ghost" selected={mode === "list"} onClick={() => setMode("list")}>List</OptionTile>`}
      />
    </CatalogEntrySection>
  );
}

export function SearchFieldsEntry() {
  const [query, setQuery] = useState("");
  const [filled, setFilled] = useState("Arcane");

  return (
    <CatalogEntrySection
      id="search-fields"
      description={
        <p>
          <Code>SearchField</Code> is the one in-page search: an <Code>Input</Code> with a search icon and a clear button
          that shows once there is text. It takes <Code>value</Code>, <Code>onValueChange</Code> and the{" "}
          <Code>Input</Code> sizes, and labels itself from the placeholder. <Code>className</Code> sets layout on the
          wrapper only. The floating header search is the island capsule, not this field.
        </p>
      }
    >
      <Preview label="SearchField">
        <div className="grid gap-4 sm:grid-cols-2">
          <StateCell label="Empty">
            <SearchField value={query} onValueChange={setQuery} placeholder="Search tier lists…" />
          </StateCell>
          <StateCell label="With text (clear button)">
            <SearchField value={filled} onValueChange={setFilled} placeholder="Search sets…" />
          </StateCell>
          <StateCell label='size="sm"'>
            <SearchField value={query} onValueChange={setQuery} size="sm" placeholder="Search keywords…" />
          </StateCell>
          <StateCell label="Disabled">
            <SearchField value="" onValueChange={() => {}} disabled placeholder="Search decks…" />
          </StateCell>
        </div>
      </Preview>
      <CodeBlock
        code={`import { SearchField } from "@/components/ui/search-field"\n\n<SearchField\n  value={query}\n  onValueChange={setQuery}\n  placeholder="Search tier lists…"\n  className="w-full max-w-[30rem]"\n/>`}
      />
    </CatalogEntrySection>
  );
}

export function FormsChapter() {
  return (
    <>
      <InputEntry />
      <FieldEntry />
      <SelectEntry />
      <ChoiceControlsEntry />
      <OptionTileEntry />
      <SearchFieldsEntry />
    </>
  );
}
