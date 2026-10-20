"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { GallerySearchField, galleryToolbarControlClassName } from "@/components/ui/gallery-search-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchBar, useSearchBarProps, type SearchBarProps, type SearchConfig } from "@/components/ui/search-bar";
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
          <Code>h-10</Code>, dual control border, focus via <Code>--chrome-focus-shadow</Code>. Invalid is{" "}
          <Code>aria-invalid</Code>, not a class. Text is <Code>text-base</Code> on phones so iOS doesn&apos;t zoom.
        </p>
      }
    >
      <Preview>
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
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
        code={`import { Input } from "@/components/ui/input"\nimport { Label } from "@/components/ui/label"\nimport { Textarea } from "@/components/ui/textarea"\n\n<Label htmlFor="name">Display name</Label>\n<Input id="name" aria-invalid={!!error} />\n<Textarea placeholder="Notes" />`}
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

function FormatSelect(props: { size?: "sm" | "default"; disabled?: boolean; invalid?: boolean; label: string; placeholder?: boolean }) {
  return (
    <Select defaultValue={props.placeholder ? undefined : "standard"} disabled={props.disabled}>
      <SelectTrigger size={props.size} aria-invalid={props.invalid || undefined} aria-label={props.label} className="w-full">
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
          <Code>SelectTrigger size</Code> is <Code>default</Code> (h-10) or <Code>sm</Code> (h-8); <Code>hideIcon</Code>{" "}
          and <Code>compactValue</Code> tune dense toolbars. Content portals at <Code>z-select</Code>. Open one to see
          groups, labels, a separator and a disabled item.
        </p>
      }
    >
      <Preview>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StateCell label='size="default"'>
            <FormatSelect label="Format (default size)" />
          </StateCell>
          <StateCell label='size="sm"'>
            <FormatSelect size="sm" label="Format (small)" />
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
    <CatalogEntrySection id="choice-controls" description={<p>Radix-backed, so keyboard and labels come for free: pair each with a <Code>Label htmlFor</Code>.</p>}>
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

const SEARCH_CONFIG: SearchConfig = {
  placeholder: "Search tier lists…",
  quickFilters: (
    <div className="space-y-2 text-sm">
      <div className="font-medium">Quick filters</div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="outline">Standard</Badge>
        <Badge tone="outline">This week</Badge>
        <Badge tone="outline">Mine</Badge>
      </div>
    </div>
  ),
  advancedFilters: <p className="py-4 text-sm text-muted-foreground">Advanced filters render in a Dialog (size=&quot;xl&quot;).</p>,
  leftButton: { label: "Advanced", opensAdvancedFilters: true },
  rightButton: { label: "Search" },
};

export function SearchFieldsEntry() {
  const [prominent, setProminent] = useState("Kaito");
  const [quiet, setQuiet] = useState("");
  const searchBar: SearchBarProps = useSearchBarProps(SEARCH_CONFIG);

  return (
    <CatalogEntrySection
      id="search-fields"
      description={
        <p>
          <Code>GallerySearchField</Code> is the gallery/collection field (<Code>appearance</Code>{" "}
          <Code>prominent</Code> or <Code>quiet</Code>, clear button when <Code>onClear</Code> is set).{" "}
          <Code>galleryToolbarControlClassName</Code> makes sibling toolbar buttons match it. <Code>SearchBar</Code> adds a
          quick-filter popover and an advanced dialog; <Code>useSearchBarProps</Code> wires its state.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Preview label="GallerySearchField">
          <div className="space-y-4">
            <StateCell label='appearance="prominent" + onClear'>
              <div className="flex gap-2">
                <GallerySearchField
                  value={prominent}
                  onChange={(event) => setProminent(event.target.value)}
                  onClear={() => setProminent("")}
                  placeholder="Search cards…"
                />
                <button type="button" className={cn(galleryToolbarControlClassName, "inline-flex shrink-0 items-center gap-2 px-3")}>
                  <ArrowUpDown className="size-4" />
                  Sort
                </button>
              </div>
            </StateCell>
            <StateCell label='appearance="quiet"'>
              <GallerySearchField
                appearance="quiet"
                value={quiet}
                onChange={(event) => setQuiet(event.target.value)}
                onClear={() => setQuiet("")}
                placeholder="Filter your collection…"
                aria-label="Filter collection"
              />
            </StateCell>
          </div>
        </Preview>
        <Preview label="SearchBar">
          <div className="space-y-4">
            <StateCell label="Plain (no popover)">
              <SearchBar placeholder="Search decks…" />
            </StateCell>
            <StateCell label="Quick filters + advanced dialog (desktop toolbar; popover is min-w 800px)">
              <SearchBar {...searchBar} />
            </StateCell>
          </div>
        </Preview>
      </div>
      <CodeBlock
        code={`import { GallerySearchField, galleryToolbarControlClassName } from "@/components/ui/gallery-search-field"\nimport { SearchBar, useSearchBarProps } from "@/components/ui/search-bar"\n\n<GallerySearchField value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} />\n<button className={cn(galleryToolbarControlClassName, "px-3")}>Sort</button>\n\nconst searchBar = useSearchBarProps({ placeholder: "Search…", quickFilters, advancedFilters })\n<SearchBar {...searchBar} />`}
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
      <SearchFieldsEntry />
    </>
  );
}
