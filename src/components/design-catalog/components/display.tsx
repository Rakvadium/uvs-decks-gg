"use client";

import { useState, type ComponentProps } from "react";
import { AlertTriangle, CheckCircle2, Eye, Info, Layers, MoreHorizontal, OctagonAlert, Sparkles, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, badgeVariants, type BadgeSize, type BadgeTone, type BadgeVariantLegacy } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Surface,
  type CardProps,
} from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { CountBadge, countBadgeVariants, type CountBadgeTone } from "@/components/ui/count-badge";
import { EmptyState, emptyStateVariants, type EmptyStateVariant } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { Panel } from "@/components/ui/panel";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner, type SpinnerSize } from "@/components/ui/spinner";
import { StatBar, StatBarGroup } from "@/components/ui/stat-bar";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CatalogEntrySection, Preview, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

// Records, not arrays: typecheck fails if a primitive gains or drops a variant.
const BADGE_TONES: Record<BadgeTone, string> = {
  default: "Primary tag",
  secondary: "Secondary tag",
  destructive: "Error / banned",
  outline: "Neutral, hover accent",
  success: "Ready / online",
  warning: "Pending / building",
  info: "Informational",
  muted: "Status pill",
  entity: "Entity chip",
  signal: "Expressive live signal",
  signalMagenta: "Expressive signal",
  signalViolet: "Expressive signal",
};

const BADGE_SIZES: Record<BadgeSize, string> = {
  sm: "h-5 · 10px · dense tags",
  md: "Default",
  lg: "32px · header chips",
};

const LEGACY_VARIANTS: Record<BadgeVariantLegacy, string> = {
  default: "default",
  secondary: "secondary",
  destructive: "destructive",
  outline: "outline",
  status: "muted",
  cyber: "entity",
  neon: "signal",
  "neon-magenta": "signalMagenta",
  "neon-violet": "signalViolet",
};

export function BadgeEntry() {
  const [tone, setTone] = useState<BadgeTone>("default");
  return (
    <CatalogEntrySection
      id="badge"
      description={
        <p>
          Prefer <Code>tone</Code>; the legacy <Code>variant</Code> prop maps onto a tone. Status uses{" "}
          <Code>success</Code>/<Code>warning</Code>/<Code>info</Code>/<Code>destructive</Code>, never palette hues. A badge is
          static. Hover chrome comes only with <Code>interactive</Code>, for a badge that is itself a trigger. Size it with{" "}
          <Code>size</Code>, never <Code>h-*</Code> or <Code>text-[10px]</Code>. Click a badge to see its classes.
        </p>
      }
    >
      <Preview>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
          {(Object.keys(BADGE_TONES) as BadgeTone[]).map((key) => (
            <li key={key} className="space-y-1.5">
              <button
                type="button"
                onClick={() => setTone(key)}
                aria-pressed={tone === key}
                className={cn(
                  "rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tone === key && "bg-primary-wash ring-1 ring-primary-strong",
                )}
              >
                <Badge tone={key}>
                  {key === "success" ? <CheckCircle2 /> : null}
                  {key === "warning" ? <AlertTriangle /> : null}
                  {key === "info" ? <Info /> : null}
                  {key}
                </Badge>
              </button>
              <SpecimenLabel className="block">{BADGE_TONES[key]}</SpecimenLabel>
            </li>
          ))}
        </ul>
      </Preview>
      <Preview label="size · interactive">
        <div className="flex flex-wrap items-center gap-4">
          {(Object.keys(BADGE_SIZES) as BadgeSize[]).map((size) => (
            <div key={size} className="flex flex-col items-start gap-1.5">
              <Badge tone={tone} size={size}>
                {size}
              </Badge>
              <SpecimenLabel>{BADGE_SIZES[size]}</SpecimenLabel>
            </div>
          ))}
          <div className="flex flex-col items-start gap-1.5">
            <Badge tone={tone} size="lg" interactive asChild>
              <button type="button" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                interactive
              </button>
            </Badge>
            <SpecimenLabel>Hover me</SpecimenLabel>
          </div>
        </div>
      </Preview>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3" aria-live="polite">
          <CodeBlock code={`import { Badge } from "@/components/ui/badge"\n\n<Badge tone="${tone}" size="sm">Label</Badge>`} />
          <CodeBlock wrap caption={`badgeVariants({ tone: "${tone}" })`} code={badgeVariants({ tone })} />
        </div>
        <Preview label="Legacy variant → tone">
          <ul className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 text-xs">
            {(Object.entries(LEGACY_VARIANTS) as [BadgeVariantLegacy, string][]).map(([variant, mapped]) => (
              <li key={variant} className="contents">
                <Code className="whitespace-normal break-all">variant=&quot;{variant}&quot;</Code>
                <span className="text-muted-foreground">→ {mapped}</span>
                <span>
                  <Badge variant={variant}>{variant}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </Preview>
      </div>
    </CatalogEntrySection>
  );
}

function SampleCard(props: CardProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Spellbook Control</CardTitle>
        <CardDescription>60 cards · updated 2 days ago</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="Deck actions">
            <MoreHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        <Badge tone="secondary">Fire</Badge>
        <Badge tone="outline">Order</Badge>
        <Badge tone="success">Legal</Badge>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm">
          Duplicate
        </Button>
        <Button size="sm">Open</Button>
      </CardFooter>
    </Card>
  );
}

export function CardEntry() {
  return (
    <CatalogEntrySection
      id="card"
      description={
        <p>
          <Code>bg-card-elevated</Code>, <Code>border-surface</Code>, <Code>rounded-surface</Code>. A card is static. Pass{" "}
          <Code>fx</Code> only when the whole card is a link or button. It adds the chrome hover shadow, border and primary
          wash. <Code>CardAction</Code> pins top-right inside the header grid.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <SampleCard />
          <SpecimenLabel className="block">
            <Code>&lt;Card&gt;</Code> Static. Hovering changes nothing.
          </SpecimenLabel>
        </div>
        <div className="space-y-2">
          <SampleCard fx />
          <SpecimenLabel className="block">
            <Code>&lt;Card fx&gt;</Code> Interactive. Hover for the chrome card shadow and wash.
          </SpecimenLabel>
        </div>
        <div className="space-y-2">
          <Surface className="gap-3 py-5">
            <CardContent className="space-y-1">
              <CardTitle>Surface</CardTitle>
              <CardDescription>A quiet static card for grouping, at low elevation.</CardDescription>
            </CardContent>
          </Surface>
          <SpecimenLabel className="block">
            <Code>&lt;Surface&gt;</Code> Low elevation, never hover chrome.
          </SpecimenLabel>
        </div>
      </div>
      <CodeBlock
        code={`import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"\n\n<Link href={href}>\n  <Card fx>\n    <CardHeader>\n      <CardTitle>Spellbook Control</CardTitle>\n      <CardDescription>60 cards</CardDescription>\n    </CardHeader>\n    <CardContent>…</CardContent>\n  </Card>\n</Link>`}
      />
    </CatalogEntrySection>
  );
}

const COUNT_TONES: Record<CountBadgeTone, string> = {
  primary: "Unread, active filters",
  soft: "Inside a selected tab",
  muted: "Neutral totals",
};

export function CountBadgeEntry() {
  return (
    <CatalogEntrySection
      id="count-badge"
      description={<p>One count bubble for tabs, rails and filter buttons. Counts above <Code>max</Code> (default 99) read as 99+.</p>}
    >
      <Preview>
        <div className="flex flex-wrap items-end gap-6">
          {(Object.keys(COUNT_TONES) as CountBadgeTone[]).map((tone) => (
            <div key={tone} className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-2 text-sm">
                Filters <CountBadge tone={tone} count={3} /> <CountBadge tone={tone} count={250} />
              </div>
              <SpecimenLabel>
                <Code>tone=&quot;{tone}&quot;</Code> {COUNT_TONES[tone]}
              </SpecimenLabel>
            </div>
          ))}
        </div>
      </Preview>
      <CodeBlock wrap caption={`countBadgeVariants({ tone: "primary" })`} code={countBadgeVariants({ tone: "primary" })} />
    </CatalogEntrySection>
  );
}

const CHIP_VALUES = ["Fire", "Water", "Order", "Chaos"];

export function ChipEntry() {
  const [selected, setSelected] = useState<string[]>(["Fire"]);
  const toggle = (value: string) =>
    setSelected((current) => (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]));
  return (
    <CatalogEntrySection
      id="chip"
      description={
        <p>
          An interactive pill built on <Code>Button</Code> (<Code>outline</Code>, <Code>rounded-full</Code>). <Code>size</Code> is{" "}
          <Code>sm</Code> (the default) or <Code>xs</Code> for dense filter grids, read from the control height tokens, so a call
          site never sets <Code>h-*</Code>. Selected reads the <Code>--selected-*</Code> role tokens. For a read-only tag use{" "}
          <Code>Badge</Code>.
        </p>
      }
    >
      <Preview>
        <div className="space-y-3">
          {(["sm", "xs"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-2">
              {CHIP_VALUES.map((value) => (
                <Chip key={value} size={size} selected={selected.includes(value)} onClick={() => toggle(value)}>
                  {value}
                </Chip>
              ))}
              <SpecimenLabel>size {size}</SpecimenLabel>
            </div>
          ))}
        </div>
      </Preview>
      <CodeBlock code={`import { Chip } from "@/components/ui/chip"\n\n<Chip selected={on} onClick={toggle}>Fire</Chip>\n<Chip size="xs" selected={on} onClick={toggle}>Fire</Chip>`} />
    </CatalogEntrySection>
  );
}

export function PanelEntry() {
  return (
    <CatalogEntrySection
      id="panel"
      description={
        <p>
          The inset panel inside a card, sidebar or dialog: <Code>rounded-surface border-surface bg-card-tint</Code>. Set
          padding and layout with <Code>className</Code>, never its fill or radius. <Code>asChild</Code> puts the recipe on a link.
        </p>
      }
    >
      <Surface className="gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel className="space-y-1 p-3">
            <div className="text-sm font-medium">Card type ratios</div>
            <div className="text-xs text-muted-foreground">18 characters · 27 attacks · 15 foundations</div>
          </Panel>
          <Panel className="space-y-1 p-3">
            <div className="text-sm font-medium">Block zones</div>
            <div className="text-xs text-muted-foreground">High 22 · Mid 20 · Low 18</div>
          </Panel>
        </div>
      </Surface>
      <CodeBlock code={`import { Panel } from "@/components/ui/panel"\n\n<Panel className="space-y-2 p-3">…</Panel>`} />
    </CatalogEntrySection>
  );
}

export function BannerEntry() {
  return (
    <CatalogEntrySection
      id="banner"
      description={<p>A one-line notice above content, such as read-only mode, guest browsing or a sign-in prompt. <Code>bg-muted-elevated</Code> on the surface border.</p>}
    >
      <Banner>
        <Eye className="size-3.5 text-muted-foreground" aria-hidden />
        You&apos;re viewing this deck in read-only mode.
      </Banner>
      <CodeBlock code={`import { Banner } from "@/components/ui/banner"\n\n<Banner>\n  <Eye className="size-3.5 text-muted-foreground" aria-hidden />\n  You're viewing this deck in read-only mode.\n</Banner>`} />
    </CatalogEntrySection>
  );
}

const EMPTY_VARIANTS: Record<EmptyStateVariant, string> = {
  page: "A page or tab with nothing in it",
  panel: "A section inside a page",
  inline: "A sidebar or picker list",
};

export function EmptyStateEntry() {
  return (
    <CatalogEntrySection
      id="empty-state"
      description={
        <p>
          The team hub recipe for every empty state: <Code>border-dashed border-placeholder bg-muted-tint rounded-surface</Code>,
          with fixed <Code>icon</Code>, <Code>title</Code>, <Code>description</Code> and <Code>action</Code> slots. The variant
          sets padding and type size only.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(EMPTY_VARIANTS) as EmptyStateVariant[]).map((variant) => (
          <div key={variant} className="space-y-2">
            <EmptyState
              variant={variant}
              icon={Layers}
              title="No decks yet"
              description={variant === "inline" ? "Create a deck to see it here." : "Build your first deck to see it here."}
              action={variant === "inline" ? null : <Button size="sm">Create deck</Button>}
            />
            <SpecimenLabel className="block">
              <Code>variant=&quot;{variant}&quot;</Code> {EMPTY_VARIANTS[variant]}
            </SpecimenLabel>
          </div>
        ))}
      </div>
      <CodeBlock wrap caption={`emptyStateVariants({ variant: "page" })`} code={emptyStateVariants({ variant: "page" })} />
      <CodeBlock
        code={`import { EmptyState } from "@/components/ui/empty-state"\n\n<EmptyState\n  variant="page"\n  icon={Layers}\n  title="No decks yet"\n  action={<Button onClick={create}>Create deck</Button>}\n/>`}
      />
    </CatalogEntrySection>
  );
}

type AlertVariant = NonNullable<ComponentProps<typeof Alert>["variant"]>;
const ALERT_VARIANTS: Record<AlertVariant, { title: string; body: string; icon: typeof Info }> = {
  default: { title: "Heads up", body: "Imports keep your existing tags.", icon: Terminal },
  destructive: { title: "Deck is not legal", body: "2 cards are banned in Standard.", icon: OctagonAlert },
  warning: { title: "Sync pending", body: "Your collection is still uploading.", icon: AlertTriangle },
  success: { title: "Saved", body: "Spellbook Control is up to date.", icon: CheckCircle2 },
  info: { title: "New set", body: "Alpha 2 cards are in the gallery.", icon: Info },
};

export function AlertEntry() {
  return (
    <CatalogEntrySection id="alert" description={<p>Renders <Code>role=&quot;alert&quot;</Code>. Put an icon first; the title and description indent past it.</p>}>
      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(ALERT_VARIANTS) as AlertVariant[]).map((variant) => {
          const { title, body, icon: Icon } = ALERT_VARIANTS[variant];
          return (
            <div key={variant} className="space-y-1.5">
              <Alert variant={variant}>
                <Icon className="size-4" />
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{body}</AlertDescription>
              </Alert>
              <SpecimenLabel className="block normal-case tracking-normal">variant=&quot;{variant}&quot;</SpecimenLabel>
            </div>
          );
        })}
      </div>
      <CodeBlock
        code={`import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"\n\n<Alert variant="warning">\n  <AlertTriangle className="size-4" />\n  <AlertTitle>Sync pending</AlertTitle>\n  <AlertDescription>Your collection is still uploading.</AlertDescription>\n</Alert>`}
      />
    </CatalogEntrySection>
  );
}

// An inline image, so the catalog makes no network request for it.
const AVATAR_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fff" fill-opacity=".85"/><rect x="14" y="41" width="36" height="18" rx="9" fill="#fff" fill-opacity=".85"/></svg>`,
  );

export function AvatarEntry() {
  return (
    <CatalogEntrySection id="avatar" description={<p>Default <Code>size-8</Code>; size with <Code>className</Code>. The fallback shows until the image loads, or when there is none.</p>}>
      <Preview>
        <div className="flex flex-wrap items-end gap-6">
          {(["size-8", "size-10", "size-14"] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Avatar className={size}>
                <AvatarImage src={AVATAR_SRC} alt="" />
                <AvatarFallback>AG</AvatarFallback>
              </Avatar>
              <SpecimenLabel>{size}</SpecimenLabel>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <Avatar className="size-10">
              <AvatarFallback>RK</AvatarFallback>
            </Avatar>
            <SpecimenLabel>fallback</SpecimenLabel>
          </div>
        </div>
      </Preview>
      <CodeBlock code={`import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"\n\n<Avatar className="size-10">\n  <AvatarImage src={user.image} alt="" />\n  <AvatarFallback>{initials}</AvatarFallback>\n</Avatar>`} />
    </CatalogEntrySection>
  );
}

const TABLE_ROWS = [
  { name: "Spellbook Control", format: "Standard", cards: 60, selected: false },
  { name: "Aggro Fire", format: "Standard", cards: 60, selected: true },
  { name: "Retro Order", format: "Retro", cards: 55, selected: false },
];

export function TableEntry() {
  return (
    <CatalogEntrySection id="table" description={<p>Wraps the table in a horizontal scroller. Rows highlight on hover; <Code>data-state=&quot;selected&quot;</Code> marks a selected row.</p>}>
      <div className="overflow-hidden rounded-lg border border-surface bg-card">
        <Table>
          <TableCaption className="pb-4">Three decks, one selected.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Deck</TableHead>
              <TableHead>Format</TableHead>
              <TableHead className="pr-4 text-right">Cards</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TABLE_ROWS.map((row) => (
              <TableRow key={row.name} data-state={row.selected ? "selected" : undefined}>
                <TableCell className="pl-4 font-medium">{row.name}</TableCell>
                <TableCell>{row.format}</TableCell>
                <TableCell className="pr-4 text-right tabular-nums">{row.cards}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-4" colSpan={2}>
                Total
              </TableCell>
              <TableCell className="pr-4 text-right tabular-nums">175</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <CodeBlock
        code={`import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"\n\n<Table>\n  <TableHeader><TableRow><TableHead>Deck</TableHead></TableRow></TableHeader>\n  <TableBody>\n    <TableRow data-state={selected ? "selected" : undefined}><TableCell>…</TableCell></TableRow>\n  </TableBody>\n</Table>`}
      />
    </CatalogEntrySection>
  );
}

export function StatBarEntry() {
  return (
    <CatalogEntrySection id="stat-bar" description={<p><Code>color</Code> takes a background class (default <Code>bg-primary</Code>). <Code>StatBarGroup</Code> computes the total from its items.</p>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Preview label="StatBar">
          <div className="space-y-3">
            <StatBar label="Characters" value={18} total={60} />
            <StatBar label="Attacks" value={27} total={60} color="bg-secondary" />
            <StatBar label="Foundations" value={15} total={60} color="bg-accent" showPercentage={false} />
          </div>
        </Preview>
        <Preview label="StatBarGroup">
          <StatBarGroup
            items={[
              { label: "High zone", value: 22, color: "bg-destructive" },
              { label: "Mid zone", value: 20, color: "bg-warning" },
              { label: "Low zone", value: 18, color: "bg-info" },
            ]}
          />
        </Preview>
      </div>
      <CodeBlock code={`import { StatBar, StatBarGroup } from "@/components/ui/stat-bar"\n\n<StatBar label="Attacks" value={27} total={60} color="bg-secondary" />\n<StatBarGroup items={[{ label: "High", value: 22 }, { label: "Low", value: 18 }]} />`} />
    </CatalogEntrySection>
  );
}

export function SkeletonEntry() {
  const [pulse, setPulse] = useState(false);
  return (
    <CatalogEntrySection
      id="skeleton"
      description={<p><Code>bg-muted animate-pulse rounded-md</Code>, one neutral tone everywhere, Teams included. Shape it with size classes. The pulse is paused here so the page stays still; it is static under reduced motion anyway.</p>}
    >
      <Preview>
        <div className="flex items-center gap-4" aria-hidden>
          <Skeleton className={cn("size-12 rounded-full", !pulse && "animate-none")} />
          <div className="flex-1 space-y-2">
            <Skeleton className={cn("h-4 w-3/5", !pulse && "animate-none")} />
            <Skeleton className={cn("h-4 w-2/5", !pulse && "animate-none")} />
          </div>
          <Skeleton className={cn("hidden h-24 w-[4.3rem] sm:block", !pulse && "animate-none")} />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Switch id="skeleton-pulse" checked={pulse} onCheckedChange={setPulse} />
          <Label htmlFor="skeleton-pulse" className="text-xs font-normal text-muted-foreground">
            Animate the pulse
          </Label>
        </div>
      </Preview>
      <CodeBlock code={`import { Skeleton } from "@/components/ui/skeleton"\n\n<Skeleton className="h-4 w-3/5" />\n<Skeleton className="size-12 rounded-full" />`} />
    </CatalogEntrySection>
  );
}

const SPINNER_SIZES: Record<SpinnerSize, string> = {
  sm: "In a button or row",
  md: "In a panel",
  lg: "A page",
};

export function SpinnerEntry() {
  return (
    <CatalogEntrySection
      id="spinner"
      description={<p>The one spinner: <Code>Loader2</Code> with <Code>animate-spin</Code>. It takes the text colour around it, so a button spinner matches the label.</p>}
    >
      <Preview>
        <div className="flex flex-wrap items-end gap-6 text-muted-foreground">
          {(Object.keys(SPINNER_SIZES) as SpinnerSize[]).map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Spinner size={size} />
              <SpecimenLabel>
                {size} · {SPINNER_SIZES[size]}
              </SpecimenLabel>
            </div>
          ))}
          <Button size="sm" disabled>
            <Spinner />
            Saving
          </Button>
        </div>
      </Preview>
      <CodeBlock code={`import { Spinner } from "@/components/ui/spinner"\n\n<Button disabled={saving}>{saving ? <Spinner /> : <Save />}Save</Button>`} />
    </CatalogEntrySection>
  );
}

export function LoadingStateEntry() {
  return (
    <CatalogEntrySection
      id="loading-state"
      description={<p>A centred spinner with an optional label, in muted text, announced with <Code>role=&quot;status&quot;</Code>.</p>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <LoadingState label="Loading decks" />
        </Panel>
        <Panel>
          <LoadingState size="sm" className="py-6" />
        </Panel>
      </div>
      <CodeBlock code={`import { LoadingState } from "@/components/ui/loading-state"\n\n<LoadingState label="Loading decks" />`} />
    </CatalogEntrySection>
  );
}

export function SeparatorEntry() {
  return (
    <CatalogEntrySection id="separator" description={<p>Decorative by default (<Code>bg-border</Code>, 1px). Pass <Code>decorative={"{false}"}</Code> when it separates content for screen readers.</p>}>
      <Preview>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium">Deck settings</div>
            <div className="text-xs text-muted-foreground">Format, visibility, sharing</div>
          </div>
          <Separator />
          <div className="flex h-5 items-center gap-3 text-sm">
            <span>Cards</span>
            <Separator orientation="vertical" />
            <span>Stats</span>
            <Separator orientation="vertical" />
            <span>Notes</span>
          </div>
        </div>
      </Preview>
      <CodeBlock code={`import { Separator } from "@/components/ui/separator"\n\n<Separator />\n<Separator orientation="vertical" />`} />
    </CatalogEntrySection>
  );
}

const RATIOS = [
  { ratio: 16 / 9, label: "16 / 9 · media" },
  { ratio: 1, label: "1 / 1 · tile" },
  { ratio: 63 / 88, label: "63 / 88 · playing card" },
];

export function AspectRatioEntry() {
  return (
    <CatalogEntrySection id="aspect-ratio" description={<p>Locks a box to a ratio; the child fills it. Card art uses 63/88.</p>}>
      <Preview>
        <div className="grid max-w-2xl grid-cols-[2fr_1fr_1fr] items-end gap-4">
          {RATIOS.map((row) => (
            <div key={row.label} className="min-w-0 space-y-1.5">
              <AspectRatio ratio={row.ratio}>
                <div className="flex size-full items-center justify-center rounded-lg border border-surface bg-[linear-gradient(135deg,var(--primary),var(--secondary))] text-primary-foreground">
                  <Sparkles className="size-5" aria-hidden />
                </div>
              </AspectRatio>
              <SpecimenLabel className="block truncate">{row.label}</SpecimenLabel>
            </div>
          ))}
        </div>
      </Preview>
      <CodeBlock code={`import { AspectRatio } from "@/components/ui/aspect-ratio"\n\n<AspectRatio ratio={63 / 88}>\n  <Image src={card.image} alt={card.name} fill className="rounded-lg object-cover" />\n</AspectRatio>`} />
    </CatalogEntrySection>
  );
}

export function DisplayChapter() {
  return (
    <>
      <BadgeEntry />
      <CountBadgeEntry />
      <ChipEntry />
      <CardEntry />
      <PanelEntry />
      <BannerEntry />
      <EmptyStateEntry />
      <AlertEntry />
      <AvatarEntry />
      <TableEntry />
      <StatBarEntry />
      <SkeletonEntry />
      <SpinnerEntry />
      <LoadingStateEntry />
      <SeparatorEntry />
      <AspectRatioEntry />
    </>
  );
}
