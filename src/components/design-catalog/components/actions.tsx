"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import { Grid3x3, LayoutList, Loader2, Plus, Rows3, Settings2, Trash2 } from "lucide-react";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
import { SegmentedControl, type SegmentedControlItem } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem, type ToggleGroupItemProps, type ToggleGroupProps } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { CatalogEntrySection, Preview, SpecimenGrid, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

type ButtonVariant = NonNullable<ButtonProps["variant"]>;
type ButtonSize = NonNullable<ButtonProps["size"]>;

// Records, not arrays: typecheck fails if buttonVariants gains or drops a variant or size.
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  default: "Commit / opens a flow",
  destructive: "Destroy (Delete)",
  destructiveOutline: "Quiet destroy",
  outline: "Dismiss (Close), secondary",
  secondary: "Secondary fill",
  ghost: "Toolbar, icon actions",
  link: "Inline text action",
  neon: "Expressive accent",
  "neon-magenta": "Expressive accent",
  cyber: "Expressive accent",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: "h-10",
  sm: "h-8",
  lg: "h-12",
  icon: "size-10",
  "icon-sm": "size-8",
  "icon-lg": "size-12",
};

const isIconSize = (size: ButtonSize) => size.startsWith("icon");

function buttonSnippet(variant: ButtonVariant, size: ButtonSize) {
  const props = [
    variant !== "default" ? `variant="${variant}"` : null,
    size !== "default" ? `size="${size}"` : null,
    isIconSize(size) ? `aria-label="Add card"` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const open = `<Button${props ? ` ${props}` : ""}>`;
  return `import { Button } from "@/components/ui/button"\n\n${open}${isIconSize(size) ? "\n  <Plus />\n" : "Save deck"}</Button>`;
}

export function ButtonEntry() {
  const [selected, setSelected] = useState<{ variant: ButtonVariant; size: ButtonSize }>({ variant: "default", size: "default" });
  const [spin, setSpin] = useState(false);
  const variants = Object.keys(BUTTON_VARIANTS) as ButtonVariant[];
  const sizes = Object.keys(BUTTON_SIZES) as ButtonSize[];

  return (
    <CatalogEntrySection
      id="button"
      description={
        <p>
          Pick a role, don&apos;t restyle at the call site: dialogs dismiss with outline <em>Close</em>, commit with the
          filled default, destroy with <Code>destructive</Code>. Click any specimen to see its props and the classes it
          resolves to. Hover and focus are live (Tab through the grid).
        </p>
      }
    >
      <Preview>
        <SpecimenGrid
          label="Button variants by size"
          rowHeader="variant ↓ size →"
          columns={sizes.map((size) => ({ title: `size="${size}"`, note: BUTTON_SIZES[size] }))}
          rows={variants.map((variant) => ({
            label: (
              <span className="block">
                <Code>{variant}</Code>
                <SpecimenLabel className="mt-1 block font-normal">{BUTTON_VARIANTS[variant]}</SpecimenLabel>
              </span>
            ),
            cells: sizes.map((size) => {
              const isSelected = selected.variant === variant && selected.size === size;
              return (
                <div
                  key={size}
                  className={cn(
                    "inline-flex rounded-lg p-1.5 transition-colors duration-150",
                    isSelected && "bg-primary-wash ring-1 ring-primary-strong",
                  )}
                >
                  <Button
                    type="button"
                    variant={variant}
                    size={size}
                    aria-label={isIconSize(size) ? `Inspect ${variant} ${size}` : undefined}
                    onClick={() => setSelected({ variant, size })}
                  >
                    {isIconSize(size) ? <Plus /> : "Save deck"}
                  </Button>
                </div>
              );
            }),
          }))}
        />
      </Preview>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3" aria-live="polite">
          <CodeBlock caption={`variant="${selected.variant}" size="${selected.size}"`} code={buttonSnippet(selected.variant, selected.size)} />
          <CodeBlock wrap caption="Resolved classes (buttonVariants)" code={buttonVariants({ variant: selected.variant, size: selected.size })} />
        </div>
        <Preview label={`States · ${selected.variant}`}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant={selected.variant}>Rest</Button>
            <Button variant={selected.variant} disabled>
              Disabled
            </Button>
            <Button variant={selected.variant} disabled aria-busy={spin || undefined}>
              <Loader2 className={cn(spin && "animate-spin")} />
              Saving…
            </Button>
            <Button variant={selected.variant}>
              <Trash2 />
              With icon
            </Button>
            <Button variant={selected.variant} asChild>
              <Link href="#button">asChild link</Link>
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Switch id="button-spin" checked={spin} onCheckedChange={setSpin} />
            <Label htmlFor="button-spin" className="text-xs font-normal text-muted-foreground">
              Animate the loading spinner
            </Label>
          </div>
          <SpecimenLabel className="mt-3 block">
            Loading has no prop: disable the button, lead with <Code>Loader2</Code> + <Code>animate-spin</Code>, and set{" "}
            <Code>aria-busy</Code>.
          </SpecimenLabel>
        </Preview>
      </div>
    </CatalogEntrySection>
  );
}

type SegmentedSize = NonNullable<ComponentProps<typeof SegmentedControl>["size"]>;
const SEGMENTED_SIZES: Record<SegmentedSize, string> = { sm: "Toolbars", md: "Default" };

const VIEW_ITEMS: SegmentedControlItem[] = [
  { value: "grid", label: "Grid", icon: Grid3x3 },
  { value: "list", label: "List", icon: LayoutList, badge: 12 },
  { value: "rows", label: "Rows", icon: Rows3 },
  { value: "custom", label: "Custom", icon: Settings2, disabled: true },
];

export function SegmentedControlEntry() {
  const [value, setValue] = useState("grid");
  const [panel, setPanel] = useState("cards");
  return (
    <CatalogEntrySection
      id="segmented-control"
      description={
        <p>
          A controlled single choice with <Code>aria-pressed</Code> buttons. Items take an icon, a badge and{" "}
          <Code>disabled</Code>; the control takes <Code>size</Code>, <Code>orientation</Code> and <Code>stretch</Code>.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Preview label="Sizes · horizontal">
          <div className="space-y-4">
            {(Object.keys(SEGMENTED_SIZES) as SegmentedSize[]).map((size) => (
              <div key={size} className="space-y-1.5">
                <SpecimenLabel className="block">
                  size=&quot;{size}&quot; · {SEGMENTED_SIZES[size]}
                </SpecimenLabel>
                <SegmentedControl size={size} items={VIEW_ITEMS} value={value} onValueChange={setValue} />
              </div>
            ))}
            <div className="space-y-1.5">
              <SpecimenLabel className="block">stretch</SpecimenLabel>
              <SegmentedControl stretch items={VIEW_ITEMS.slice(0, 3)} value={value} onValueChange={setValue} />
            </div>
          </div>
        </Preview>
        <Preview label='orientation="vertical"'>
          <div className="max-w-56">
            <SegmentedControl
              orientation="vertical"
              value={panel}
              onValueChange={setPanel}
              items={[
                { value: "cards", label: "Cards", badge: 60 },
                { value: "stats", label: "Stats" },
                { value: "hand", label: "Hand simulator" },
              ]}
            />
          </div>
        </Preview>
      </div>
      <CodeBlock
        code={`import { SegmentedControl } from "@/components/ui/segmented-control"\n\n<SegmentedControl\n  size="sm"\n  value={view}\n  onValueChange={setView}\n  items={[\n    { value: "grid", label: "Grid", icon: Grid3x3 },\n    { value: "list", label: "List", icon: LayoutList, badge: 12 },\n  ]}\n/>`}
      />
    </CatalogEntrySection>
  );
}

type ToggleItemSpec = Pick<ToggleGroupItemProps, "value" | "disabled"> & { label: string };
const TOGGLE_ITEMS: ToggleItemSpec[] = [
  { value: "owned", label: "Owned" },
  { value: "missing", label: "Missing" },
  { value: "all", label: "All" },
  { value: "trade", label: "Trade", disabled: true },
];

export function ToggleGroupEntry() {
  const [value, setValue] = useState<ToggleGroupProps["value"]>("owned");
  return (
    <CatalogEntrySection
      id="toggle-group"
      description={
        <p>
          A lighter single-choice pill. Only <Code>type=&quot;single&quot;</Code> exists. Prefer{" "}
          <Code>SegmentedControl</Code> in toolbars; it follows the chrome&apos;s label casing.
        </p>
      }
    >
      <Preview>
        <ToggleGroup type="single" value={value} onValueChange={setValue} aria-label="Collection filter">
          {TOGGLE_ITEMS.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Preview>
      <CodeBlock
        code={`import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"\n\n<ToggleGroup type="single" value={filter} onValueChange={setFilter}>\n  <ToggleGroupItem value="owned">Owned</ToggleGroupItem>\n  <ToggleGroupItem value="missing">Missing</ToggleGroupItem>\n</ToggleGroup>`}
      />
    </CatalogEntrySection>
  );
}

export function ActionsChapter() {
  return (
    <>
      <ButtonEntry />
      <SegmentedControlEntry />
      <ToggleGroupEntry />
    </>
  );
}

