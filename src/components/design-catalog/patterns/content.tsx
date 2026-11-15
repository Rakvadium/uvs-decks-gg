"use client";

import { useState } from "react";
import { BookOpen, Filter, Layers, LayoutGrid, PanelBottomOpen, Plus, Search, SlidersHorizontal, UserRound, Users } from "lucide-react";
import {
  FloatingActionPill,
  FloatingBackPill,
  FloatingCapsuleCluster,
  FloatingPageBar,
  FloatingSearchCapsule,
  FloatingTabsPill,
  PAGE_WASH_CLASS_NAMES,
  type PageWash,
} from "@/components/shell/floating-page-bar";
import { PanelFooter, PanelHeader } from "@/components/shell/right-sidebar/expanded-panel";
import {
  SHELL_ACCOUNT_ROW_HEIGHT_CLASS,
  SHELL_NAV_ITEM_ACTIVE,
  SHELL_NAV_ITEM_BASE,
  SHELL_NAV_ITEM_IDLE,
  SHELL_RAIL_ITEM_COLLAPSED_CLASS,
} from "@/components/shell/shell-chrome";
import { Button } from "@/components/ui/button";
import { IconToolbarButton } from "@/components/ui/icon-toolbar-button";
import { MobileActButton } from "@/components/shell/mobile-tab-bar/act-button";
import { MobileGlassCapsule } from "@/components/shell/mobile-tab-bar/glass-capsule";
import {
  MOBILE_PEEK_PLACEMENT,
  MOBILE_TAB_ICON_CLASS,
  MOBILE_TAB_ITEM_WIDTH_CLASS,
  MOBILE_TAB_METRICS,
  MOBILE_TAB_METRIC_VARS,
  MOBILE_TAB_ROW_HEIGHT_CLASS,
} from "@/components/shell/mobile-tab-bar/metrics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { REPO_BLOB_URL } from "../registry";
import { CatalogEntrySection, Preview, ScrollRow, SpecimenLabel } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

function DocLink({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <a
      href={`${REPO_BLOB_URL}/${path}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md font-medium text-foreground underline decoration-primary underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BookOpen className="size-4 text-primary" aria-hidden />
      {children}
      <span className="sr-only">(opens GitHub)</span>
    </a>
  );
}

function SlotTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Slot</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="pr-4">Contents</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([slot, role, contents]) => (
            <TableRow key={slot}>
              <TableCell className="whitespace-nowrap pl-4 font-medium">{slot}</TableCell>
              <TableCell>{role}</TableCell>
              <TableCell className="pr-4 text-muted-foreground">{contents}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** A strip of page background for the bars to float over, at desktop width even on a phone. */
function DesktopStage({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure className="space-y-2">
      <div role="region" aria-label={caption} tabIndex={0} className="relative overflow-x-auto rounded-lg border border-hairline outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="min-w-[60rem] bg-[image:var(--chrome-page-bg)] px-6 pb-10 pt-4">{children}</div>
      </div>
      <figcaption>
        <SpecimenLabel>{caption}</SpecimenLabel>
      </figcaption>
    </figure>
  );
}

export function FloatingIslandsEntry() {
  const [tab, setTab] = useState("mine");
  const [query, setQuery] = useState("");

  return (
    <CatalogEntrySection
      id="floating-islands"
      sourcePaths={["src/components/shell/floating-page-bar.tsx", "src/components/shell/floating-island.tsx"]}
      description={
        <p>
          Desktop pages float capsules over the scroll area in a three-slot grid. Roles are strict, occupancy is lenient:
          empty slots stay empty, roles never move. The page title is the left identity pill, never an in-content hero.{" "}
          <DocLink path="docs/floating-header-islands.md">docs/floating-header-islands.md</DocLink>
        </p>
      }
    >
      <SlotTable
        rows={[
          ["Left", "Context: where am I", "Back pill (icon-only), identity pill (h1), local nav tabs"],
          ["Center", "Content tool", "Search / filter capsule, or nothing"],
          ["Right", "Actions", "Filled primary FloatingActionPill, floating secondaries, overflow menu"],
        ]}
      />
      <DesktopStage caption="Decks list: tabs left, search center, primary action right.">
        <FloatingPageBar
          left={
            <FloatingTabsPill
              value={tab}
              onValueChange={setTab}
              items={[
                { value: "mine", label: "My decks", icon: Layers, hideLabelBelowLg: false },
                { value: "public", label: "Public", icon: Users, hideLabelBelowLg: false },
              ]}
            />
          }
          center={
            <FloatingSearchCapsule value={query} onChange={setQuery} placeholder="Search decks…" name="catalog-island-search" aria-label="Search decks" />
          }
          right={
            <FloatingActionPill>
              <Plus className="size-4" />
              New Deck
            </FloatingActionPill>
          }
        />
      </DesktopStage>
      <DesktopStage caption="Card gallery: untitled, search with its scope in the same 26rem center slot, count and view tools right.">
        <FloatingPageBar
          center={
            <FloatingSearchCapsule value={query} onChange={setQuery} placeholder="Search all card information…" name="catalog-gallery-search" aria-label="Search cards">
              <span className="chrome-label-case shrink-0 px-1.5 text-[11px] text-muted-foreground">All</span>
            </FloatingSearchCapsule>
          }
          right={
            <FloatingCapsuleCluster>
              <span className="px-1 text-[11px] tabular-nums text-muted-foreground">2,622 / 2,622</span>
              <IconToolbarButton shape="island" label="Toggle filter panel">
                <SlidersHorizontal />
              </IconToolbarButton>
              <IconToolbarButton shape="island" label="Change view mode">
                <LayoutGrid />
              </IconToolbarButton>
            </FloatingCapsuleCluster>
          }
        />
      </DesktopStage>
      <DesktopStage caption="Deck details: icon-only back + identity pill left, center empty, owner actions right.">
        <FloatingPageBar
          left={
            <>
              <FloatingBackPill label="Decks" onClick={() => undefined} />
              <FloatingCapsuleCluster bodyClassName="px-4" glow>
                {/* The real page uses FloatingPageTitle, which renders the page h1. */}
                <span className="chrome-heading-case truncate text-sm font-semibold text-foreground">Spellbook Control</span>
              </FloatingCapsuleCluster>
            </>
          }
          right={
            <>
              <FloatingActionPill variant="floating">Duplicate</FloatingActionPill>
              <FloatingActionPill>Edit</FloatingActionPill>
            </>
          }
        />
      </DesktopStage>
      <CodeBlock
        code={`import { FloatingActionPill, FloatingBackPill, FloatingPageBar, FloatingPageLayout, FloatingPageTitle } from "@/components/shell/floating-page-bar"\n\n<FloatingPageLayout\n  bar={\n    <FloatingPageBar\n      left={<><FloatingBackPill href="/decks" label="Decks" /><FloatingPageTitle>{deck.name}</FloatingPageTitle></>}\n      right={<FloatingActionPill>Edit</FloatingActionPill>}\n    />\n  }\n>\n  {children}\n</FloatingPageLayout>`}
      />
    </CatalogEntrySection>
  );
}

const PAGE_WASH_USES: Record<PageWash, string> = {
  fade: "Teams hub, team decks, teams landing",
  radial: "Tier lists, rankings, tier list detail",
  grid: "Community hub, creator program",
  glow: "Card gallery, home",
};

export function PageWashEntry() {
  return (
    <CatalogEntrySection
      id="page-wash"
      sourcePaths={["src/components/shell/floating-page-bar.tsx"]}
      description={
        <p>
          A page background is a <Code>pageWash</Code> prop on <Code>FloatingPageLayout</Code>, never a layer the page
          paints itself. Each recipe mixes <Code>--primary</Code>, <Code>--secondary</Code> or <Code>--border</Code>, so
          it follows the palette and never holds a literal colour. The wash sits behind the scroller and does not scroll.
        </p>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(PAGE_WASH_CLASS_NAMES) as PageWash[]).map((wash) => (
          <Preview key={wash} label={`pageWash="${wash}"`}>
            <div className="relative h-36 overflow-hidden rounded-lg border border-hairline bg-background">
              <div aria-hidden className={cn("absolute inset-0", PAGE_WASH_CLASS_NAMES[wash])} />
              <p className="relative p-3 text-xs text-muted-foreground">{PAGE_WASH_USES[wash]}</p>
            </div>
          </Preview>
        ))}
      </div>
      <CodeBlock code={`<FloatingPageLayout bar={<CommunityTierListsFloatingTopBar />} pageWash="radial">\n  <CommunityTierListsPageView />\n</FloatingPageLayout>`} />
    </CatalogEntrySection>
  );
}

export function RailPanelEntry() {
  return (
    <CatalogEntrySection
      id="rail-panel"
      sourcePaths={["src/components/shell/right-sidebar/expanded-panel.tsx"]}
      description={
        <p>
          The expanded right rail draws one <Code>PanelHeader</Code> (the slot <Code>label</Code> and an{" "}
          <Code>IconToolbarButton</Code> close) and one opaque <Code>PanelFooter</Code> for the slot&apos;s{" "}
          <Code>footer</Code>. Panels render only their body. A dynamic title goes in the slot <Code>label</Code>.
        </p>
      }
    >
      <Preview label="Active deck panel">
        <div className="flex h-64 max-w-sm flex-col overflow-hidden rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground">
          <PanelHeader title="Spellbook Control" onClose={() => undefined} />
          <div className="min-h-0 flex-1 p-4 text-sm text-muted-foreground">Panel body</div>
          <PanelFooter>
            <Button size="sm">Open Deck Details</Button>
          </PanelFooter>
        </div>
      </Preview>
      <CodeBlock code={`useRegisterSlot("right-sidebar", "active-deck", ActiveDeckSidebar, {\n  label: activeDeck?.name ?? "Active Deck",\n  footer: ActiveDeckFooter,\n})`} />
    </CatalogEntrySection>
  );
}

export function SidebarRowsEntry() {
  return (
    <CatalogEntrySection
      id="sidebar-rows"
      sourcePaths={["src/components/shell/shell-chrome.ts"]}
      description={
        <p>
          Left sidebar rows read the control heights from <Code>shell-chrome.ts</Code>. Nav rows, the game switcher and
          Teams use <Code>SHELL_NAV_ITEM_BASE</Code> at <Code>--control-h-md</Code>. The account row uses{" "}
          <Code>SHELL_ACCOUNT_ROW_HEIGHT_CLASS</Code> at <Code>--control-h-lg</Code>. Collapsed rail items are{" "}
          <Code>--control-h-md</Code> squares.
        </p>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[16rem_auto]">
        <Preview label="Expanded">
          <div className="flex flex-col gap-1 rounded-lg bg-sidebar p-2">
            <span className={cn(SHELL_NAV_ITEM_BASE, SHELL_NAV_ITEM_ACTIVE)}>
              <LayoutGrid className="size-4" />
              <span className="chrome-label-case text-xs">Card Gallery</span>
            </span>
            <span className={cn(SHELL_NAV_ITEM_BASE, SHELL_NAV_ITEM_IDLE)}>
              <Layers className="size-4" />
              <span className="chrome-label-case text-xs">Decks</span>
            </span>
            <span className={cn(SHELL_NAV_ITEM_BASE, SHELL_NAV_ITEM_IDLE, SHELL_ACCOUNT_ROW_HEIGHT_CLASS)}>
              <UserRound className="size-5" />
              <span className="text-xs">Account row</span>
            </span>
          </div>
        </Preview>
        <Preview label="Collapsed">
          <div className="flex flex-col items-center gap-2 rounded-lg bg-sidebar p-1">
            <span aria-label="Card Gallery" role="img" className={cn(SHELL_NAV_ITEM_BASE, SHELL_RAIL_ITEM_COLLAPSED_CLASS, SHELL_NAV_ITEM_ACTIVE)}>
              <LayoutGrid className="size-4" />
            </span>
            <span aria-label="Decks" role="img" className={cn(SHELL_NAV_ITEM_BASE, SHELL_RAIL_ITEM_COLLAPSED_CLASS, SHELL_NAV_ITEM_IDLE)}>
              <Layers className="size-4" />
            </span>
          </div>
        </Preview>
      </div>
    </CatalogEntrySection>
  );
}

const GO_TABS = [
  { label: "Cards", icon: LayoutGrid },
  { label: "Decks", icon: Layers, current: true },
  { label: "Community", icon: Users },
  { label: "Profile", icon: UserRound },
];

export function MobileShellEntry() {
  const metrics = Object.entries(MOBILE_TAB_METRICS) as [keyof typeof MOBILE_TAB_METRICS, number][];

  return (
    <CatalogEntrySection
      id="mobile-shell"
      sourcePaths={["src/components/shell/mobile-tab-bar", "src/components/shell/mobile-nav-bar"]}
      description={
        <p>
          Phones get a compact top nav plus a floating bottom stack. Every bottom control is one of three verbs: Peek
          (more about this page), Go (another section) or Act (do something here).{" "}
          <DocLink path="docs/mobile-shell.md">docs/mobile-shell.md</DocLink>
        </p>
      }
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <SlotTable
          rows={[
            ["Top · leading", "Context", "Brand mark, or back to the parent (aria-label = destination)"],
            ["Top · center", "Identity", "Compact title; sr-only on brand roots"],
            ["Top · trailing", "Persistent chrome", "Media dock toggle"],
            ["Bottom · Go", "Go", "Cards, Decks, Community, Profile: always these four"],
            ["Bottom · Act", "Act", "Search, page actions (≤ 1 primary), then Peek"],
          ]}
        />
        <Preview label={`Bottom stack · peek placement "${MOBILE_PEEK_PLACEMENT}"`} className="flex flex-col justify-end gap-6">
          {/* Real metrics: on the narrowest phones the row scrolls instead of shrinking. */}
          <ScrollRow label="Mobile bottom stack" className="flex justify-center">
            <div style={MOBILE_TAB_METRIC_VARS} className="flex items-center justify-center gap-[var(--mobile-tab-row-gap)]">
              <MobileGlassCapsule bodyClassName={cn(MOBILE_TAB_ROW_HEIGHT_CLASS, "items-stretch gap-0.5 p-0.5")}>
                {GO_TABS.map((tab) => (
                  <span
                    key={tab.label}
                    aria-label={tab.label}
                    role="img"
                    className={cn(
                      "flex items-center justify-center rounded-full",
                      MOBILE_TAB_ITEM_WIDTH_CLASS,
                      tab.current ? "bg-primary-selected text-primary" : "text-muted-foreground",
                    )}
                  >
                    <tab.icon className={MOBILE_TAB_ICON_CLASS} />
                  </span>
                ))}
              </MobileGlassCapsule>
              <MobileGlassCapsule bodyClassName={cn(MOBILE_TAB_ROW_HEIGHT_CLASS, "items-center gap-0.5 p-0.5")}>
                <MobileActButton label="Search">
                  <Search className={MOBILE_TAB_ICON_CLASS} />
                </MobileActButton>
                <MobileActButton label="Filters" badge={2}>
                  <Filter className={MOBILE_TAB_ICON_CLASS} />
                </MobileActButton>
                <MobileActButton label="New deck" tone="primary">
                  <Plus className={MOBILE_TAB_ICON_CLASS} />
                </MobileActButton>
                <span aria-hidden className="w-px shrink-0 self-center bg-border [height:calc(var(--mobile-tab-icon)+4px)]" />
                <MobileActButton label="Deck panels">
                  <PanelBottomOpen className={MOBILE_TAB_ICON_CLASS} />
                </MobileActButton>
              </MobileGlassCapsule>
            </div>
          </ScrollRow>
          <SpecimenLabel className="text-center">Go capsule (left) · Act capsule with Search, Filters, a primary and Peek (right)</SpecimenLabel>
        </Preview>
      </div>
      <div className="overflow-hidden rounded-lg border border-hairline">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">MOBILE_TAB_METRICS</TableHead>
              <TableHead className="pr-4 text-right">px</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map(([name, value]) => (
              <TableRow key={name}>
                <TableCell className="pl-4">
                  <Code>{name}</Code>
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CodeBlock
        code={`// Sizes come from mobile-tab-bar/metrics.ts. Never hardcode them in a page.\nimport { MOBILE_TAB_ACT_SIZE_CLASS, MOBILE_TAB_ICON_CLASS } from "@/components/shell/mobile-tab-bar/metrics"\n\n// Pages register Search + Actions in resolveMobileBottomTools (mobile-tab-bar/page-tools.tsx),\n// and Peek panels as right-sidebar slots.`}
      />
    </CatalogEntrySection>
  );
}

export function PatternsChapter() {
  return (
    <>
      <FloatingIslandsEntry />
      <PageWashEntry />
      <RailPanelEntry />
      <SidebarRowsEntry />
      <MobileShellEntry />
    </>
  );
}
