"use client";

import type { ComponentProps } from "react";
import {
  Kicker,
  PageHeading,
  SectionHeading,
  kickerVariants,
  pageHeadingVariants,
  sectionHeadingVariants,
} from "@/components/ui/typography-headings";
import { readRootToken, useRootSnapshot } from "../appearance/root-store";
import { CatalogEntrySection, Preview } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

type PageSize = NonNullable<ComponentProps<typeof PageHeading>["size"]>;
type SectionSize = NonNullable<ComponentProps<typeof SectionHeading>["size"]>;
type KickerSize = NonNullable<ComponentProps<typeof Kicker>["size"]>;
type KickerTone = NonNullable<ComponentProps<typeof Kicker>["tone"]>;

// Records, not arrays: typecheck fails if a primitive gains or drops a size.
const PAGE_SIZES: Record<PageSize, string> = {
  sm: "Compact page title",
  md: "Default page title",
  lg: "Landing sections",
  hero: "Marketing / 404",
};
const SECTION_SIZES: Record<SectionSize, string> = {
  xs: "Dense panel title",
  sm: "Sidebar group",
  md: "Default section",
  lg: "Community section headers",
  xl: "Feature section",
};
const KICKER_SIZES: Record<KickerSize, string> = { meta: "Meta (10px)", sm: "Default", md: "Large" };
const KICKER_TONES: Record<KickerTone, string> = { muted: "Default", primary: "Accent", foreground: "Strong" };

function ScaleRow({ name, note, classes, children }: { name: string; note: string; classes: string; children: React.ReactNode }) {
  return (
    <li className="grid gap-3 border-t border-hairline py-4 first:border-t-0 first:pt-0 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6">
      <div className="space-y-1">
        <Code>{name}</Code>
        <div className="text-[11px] text-muted-foreground">{note}</div>
      </div>
      <div className="min-w-0 space-y-1.5">
        {children}
        <div className="text-[11px] normal-case tracking-normal text-muted-foreground">{classes}</div>
      </div>
    </li>
  );
}

// Specimens are presentational: role="presentation" keeps 15 sample headings out of the page outline.
export function TypographyEntries() {
  return (
    <>
      <CatalogEntrySection
        id="page-heading"
        description={<p>Always an <Code>h1</Code>. On desktop app pages the title lives in the floating identity pill instead.</p>}
      >
        <Preview plain>
          <ul>
            {(Object.keys(PAGE_SIZES) as PageSize[]).map((size) => (
              <ScaleRow key={size} name={`size="${size}"`} note={PAGE_SIZES[size]} classes={pageHeadingVariants({ size })}>
                <PageHeading size={size} role="presentation" className="truncate">
                  Build the deck you want
                </PageHeading>
              </ScaleRow>
            ))}
          </ul>
        </Preview>
        <CodeBlock code={`import { PageHeading } from "@/components/ui/typography-headings"\n\n<PageHeading>Decks</PageHeading>               {/* md */}\n<PageHeading size="hero">404</PageHeading>`} />
      </CatalogEntrySection>

      <CatalogEntrySection id="section-heading" description={<p>Defaults to <Code>h2</Code>; pass <Code>as=&quot;h3&quot;</Code> or <Code>&quot;h4&quot;</Code> to keep the outline right.</p>}>
        <Preview plain>
          <ul>
            {(Object.keys(SECTION_SIZES) as SectionSize[]).map((size) => (
              <ScaleRow key={size} name={`size="${size}"`} note={SECTION_SIZES[size]} classes={sectionHeadingVariants({ size })}>
                <SectionHeading size={size} role="presentation" className="truncate">
                  Tier lists this week
                </SectionHeading>
              </ScaleRow>
            ))}
          </ul>
        </Preview>
        <CodeBlock code={`<SectionHeading>Recent decks</SectionHeading>\n<SectionHeading as="h3" size="sm">Filters</SectionHeading>`} />
      </CatalogEntrySection>

      <CatalogEntrySection id="kicker" description={<p>Eyebrows and meta labels. Casing comes from <Code>chrome-label-case</Code>, never a hardcoded <Code>uppercase</Code>.</p>}>
        <Preview plain>
          <ul>
            {(Object.keys(KICKER_SIZES) as KickerSize[]).map((size) => (
              <ScaleRow key={size} name={`size="${size}"`} note={KICKER_SIZES[size]} classes={kickerVariants({ size })}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {(Object.keys(KICKER_TONES) as KickerTone[]).map((tone) => (
                    <span key={tone} className="inline-flex items-baseline gap-2">
                      <Kicker size={size} tone={tone}>
                        Set {tone}
                      </Kicker>
                      <span className="text-[11px] normal-case tracking-normal text-muted-foreground">tone=&quot;{tone}&quot;</span>
                    </span>
                  ))}
                </div>
              </ScaleRow>
            ))}
          </ul>
        </Preview>
        <CodeBlock code={`<Kicker>Last updated</Kicker>\n<Kicker size="meta" tone="primary">New</Kicker>`} />
      </CatalogEntrySection>
    </>
  );
}

const CASING_TOKENS = [
  "--chrome-heading-transform",
  "--chrome-heading-letter-spacing",
  "--chrome-label-transform",
  "--chrome-label-letter-spacing",
  "--chrome-card-title-font",
] as const;

export function ChromeCasing() {
  const snapshot = useRootSnapshot(() => CASING_TOKENS.map(readRootToken).join("\n"));
  const values = snapshot.split("\n");

  return (
    <CatalogEntrySection
      id="chrome-casing"
      sourcePaths={["src/styles/base.css"]}
      description={
        <p>
          The chrome owns text-transform and letter spacing. Calm-family chromes resolve both to <Code>none</Code>;
          expressive-family chromes uppercase. Switch the chrome in the header to compare. Values that must never be
          transformed (set codes, usernames) opt out with <Code>normal-case tracking-normal</Code> on the leaf.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Preview label="Live sample">
          <div className="space-y-3">
            <div className="chrome-heading-case text-xl font-semibold">chrome-heading-case</div>
            <div className="chrome-label-case text-xs font-semibold text-muted-foreground">chrome-label-case</div>
            <div className="chrome-label-case text-xs font-semibold text-muted-foreground">
              Set <span className="normal-case tracking-normal text-foreground">UVS-ALPHA-01</span> opted out
            </div>
          </div>
        </Preview>
        <Preview label="Tokens on <html>" plain>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs">
            {CASING_TOKENS.map((token, index) => (
              <div key={token} className="contents">
                <dt className="normal-case tracking-normal text-muted-foreground">{token}</dt>
                <dd className="truncate normal-case tracking-normal text-foreground">{values[index] || "—"}</dd>
              </div>
            ))}
          </dl>
        </Preview>
      </div>
      <CodeBlock code={`<span className="chrome-label-case text-xs">Only when a primitive can't be used</span>\n<span className="normal-case tracking-normal">{setCode}</span>`} />
    </CatalogEntrySection>
  );
}
