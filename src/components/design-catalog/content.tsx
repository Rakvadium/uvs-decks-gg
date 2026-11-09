"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Kicker, PageHeading } from "@/components/ui/typography-headings";
import { CHROME_OPTIONS, COLOR_PRESET_OPTIONS } from "@/providers/ColorSchemeProvider";
import { CatalogAppearanceProvider, useCatalogAppearance } from "./appearance/context";
import type { CatalogOverride } from "./appearance/params";
import { AppearanceLinkActions, AppearanceSwitcher } from "./appearance/switcher";
import { ThemeTiles } from "./appearance/theme-tiles";
import { ChapterSection } from "./chapter";
import { ActionsChapter } from "./components/actions";
import { DisplayChapter } from "./components/display";
import { FormsChapter } from "./components/forms";
import { NavigationChapter } from "./components/navigation";
import { OverlaysChapter } from "./components/overlays";
import { ColorTokens } from "./foundations/colors";
import { BorderLadder, SurfaceLadder, ToneLadder } from "./foundations/ladders";
import { MotionEntry, ZIndexEntry } from "./foundations/layers";
import { ElevationEntry, RadiusEntry } from "./foundations/shape";
import { ChromeCasing, TypographyEntries } from "./foundations/typography";
import { ALL_CHAPTERS, CatalogNav, useActiveEntry } from "./nav/content";
import { MobileSectionsSheet } from "./nav/mobile-sheet";
import { PatternsChapter } from "./patterns/content";
import type { ChapterId } from "./registry";
import type { CatalogSource } from "./source/read";
import { CatalogEntrySection } from "./specimen/entry";
import { Code, CodeBlock } from "./specimen/code-block";

const UI_FILE_COUNT = new Set(ALL_CHAPTERS.flatMap((chapter) => chapter.entries.flatMap((entry) => entry.ui ?? []).map((ui) => ui.file))).size;

function Overview() {
  return (
    <CatalogEntrySection
      id="themes"
      description={
        <p>
          Pick a preset to pin it for this page; mode and chrome are in the header. Pins live in the URL, so a link
          reproduces exactly what you see. Nothing is saved to your account, and leaving the page restores your own
          appearance. The reset button (↺) in the header drops the pins.
        </p>
      }
    >
      <ThemeTiles />
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeBlock
          caption="Deep links"
          code={`/design?theme=cyberpunk&mode=dark\n/design?theme=sorbet&mode=light&chrome=expressive\n/design?focus=forms            # one chapter on its own`}
        />
        <dl className="grid grid-cols-3 gap-3 self-start">
          {[
            [String(UI_FILE_COUNT), "ui primitives"],
            [String(COLOR_PRESET_OPTIONS.length), "color presets"],
            [String(CHROME_OPTIONS.length), "chromes"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-surface bg-card-soft p-4">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </CatalogEntrySection>
  );
}

function renderChapter(id: ChapterId, source: CatalogSource): ReactNode {
  switch (id) {
    case "overview":
      return <Overview />;
    case "colors":
      return <ColorTokens tokens={source.colorTokens} />;
    case "typography":
      return (
        <>
          <TypographyEntries />
          <ChromeCasing />
        </>
      );
    case "shape":
      return (
        <>
          <RadiusEntry />
          <ElevationEntry />
        </>
      );
    case "ladders":
      return (
        <>
          <BorderLadder ladders={source.ladders} />
          <SurfaceLadder ladders={source.ladders} />
          <ToneLadder ladders={source.ladders} />
        </>
      );
    case "layers":
      return (
        <>
          <ZIndexEntry steps={source.ladders.zIndex} />
          <MotionEntry />
        </>
      );
    case "actions":
      return <ActionsChapter />;
    case "display":
      return <DisplayChapter />;
    case "forms":
      return <FormsChapter />;
    case "overlays":
      return <OverlaysChapter />;
    case "navigation":
      return <NavigationChapter />;
    case "patterns":
      return <PatternsChapter />;
  }
}

function CatalogLayout({ source }: { source: CatalogSource }) {
  const { focus, setFocus } = useCatalogAppearance();
  const chapters = focus ? ALL_CHAPTERS.filter((chapter) => chapter.id === focus) : ALL_CHAPTERS;
  const active = useActiveEntry(focus);
  const focused = focus ? ALL_CHAPTERS.find((chapter) => chapter.id === focus) : null;

  return (
    <div id="top" className="min-h-dvh bg-background text-foreground">
      <a
        href="#catalog-main"
        className="sr-only z-chrome rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to the catalog
      </a>
      <header className="sticky top-0 z-sticky border-b border-hairline bg-background-elevated backdrop-blur-sm">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3 md:px-6">
          <div className="order-1 mr-auto flex min-w-0 items-center gap-2.5">
            <Image src="/brand-mark.svg" alt="" width={28} height={28} className="size-7 shrink-0" priority />
            <div className="min-w-0">
              <Kicker size="meta" className="block leading-tight">
                UVSDECKS.GG
              </Kicker>
              <PageHeading size="sm" className="truncate text-base leading-tight">
                Design system
              </PageHeading>
            </div>
          </div>
          {/* Phones: brand · links · Sections, then the selects on their own row. lg: one row. */}
          <AppearanceLinkActions className="order-2 lg:order-4" />
          <div className="order-3 lg:hidden">
            <MobileSectionsSheet chapters={chapters} active={active} />
          </div>
          <AppearanceSwitcher className="order-4 w-full lg:order-3 lg:w-auto" />
        </div>
      </header>

      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 md:px-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain py-8 pr-2">
            <CatalogNav chapters={chapters} active={active} />
          </div>
        </aside>
        <main id="catalog-main" tabIndex={-1} className="min-w-0 space-y-10 py-8 pb-24 outline-none">
          {focused ? (
            <Alert variant="info">
              <AlertTitle>
                Showing <span className="font-semibold">{focused.label}</span> on its own
              </AlertTitle>
              <AlertDescription className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-muted-foreground">
                  <Code>?focus={focused.id}</Code> isolates one chapter for review and captures.
                </span>
                <Button size="sm" variant="outline" onClick={() => setFocus(null)}>
                  <X />
                  Show the whole catalog
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-20">
            {chapters.map((chapter) => (
              <ChapterSection key={chapter.id} chapter={chapter} number={ALL_CHAPTERS.indexOf(chapter)}>
                {renderChapter(chapter.id as ChapterId, source)}
              </ChapterSection>
            ))}
          </div>
          <footer className="border-t border-hairline pt-6 text-xs text-muted-foreground">
            Built from the real primitives in <Code>src/components/ui</Code>. Tables are read from{" "}
            <Code>src/styles</Code> on each request; values are read from <Code>&lt;html&gt;</Code> live.
          </footer>
        </main>
      </div>
    </div>
  );
}

export function DesignCatalog({
  source,
  initialOverride,
  initialFocus,
}: {
  source: CatalogSource;
  initialOverride: CatalogOverride;
  initialFocus: string | null;
}) {
  return (
    <CatalogAppearanceProvider initialOverride={initialOverride} initialFocus={initialFocus}>
      <CatalogLayout source={source} />
    </CatalogAppearanceProvider>
  );
}
