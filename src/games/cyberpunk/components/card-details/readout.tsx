"use client";

import type { ReactNode } from "react";
import { splitPipeList } from "@shared/games/filters";
import { isCyberpunkLegendType } from "@shared/games/cyberpunk/card-types";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/ui/typography-headings";
import { useCardReferenceData } from "@/lib/universus/card-data-provider";
import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";
import {
  cyberpunkCardTitle,
  formatCyberpunkCardType,
  getCyberpunkCardTypeColor,
  getCyberpunkColorHex,
  getCyberpunkColorLabel,
} from "../../config";
import { EddieCoin } from "../card-text-frame";
import { CyberpunkRulesText } from "../rules-text";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <p className="chrome-label-case m-0 shrink-0 text-xs font-semibold text-muted-foreground">{children}</p>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-border/50 via-border/30 to-transparent" />
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1 border-l border-border/40 pl-3 first:border-l-0 first:pl-0">
      <dt className="chrome-label-case m-0 text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="m-0 text-2xl font-extrabold tabular-nums leading-none tracking-tight" style={{ color: accent }}>
        {value}
      </dd>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-3">
      <dt className="chrome-label-case w-20 shrink-0 text-[11px] font-semibold text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 text-sm text-foreground/90">{children}</dd>
    </div>
  );
}

function LegalityRows({ card }: { card: CachedCard }) {
  const { formats, getBannedFormatNames, isSetLegalInFormat } = useCardReferenceData();
  const banned = new Set(getBannedFormatNames(card._id));
  if (formats.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {formats.map((format) => {
        const isBanned = banned.has(format.name);
        const isLegal = !isBanned && (!card.setCode || isSetLegalInFormat(card.setCode, format.key));
        return (
          <Badge key={format.key} tone={isBanned ? "destructive" : isLegal ? "success" : "muted"}>
            {format.name}: {isBanned ? "Banned" : isLegal ? "Legal" : "Not legal"}
          </Badge>
        );
      })}
    </div>
  );
}

/** Card readout: title, type/color chips, cost / PWR / RAM, tags, keywords, rules, meta. */
export function CyberpunkCardReadout({ card, className }: { card: CachedCard; className?: string }) {
  const { title, subname } = cyberpunkCardTitle(card);
  const type = formatCyberpunkCardType(card.type);
  const typeColor = type ? getCyberpunkCardTypeColor(type) : undefined;
  const colorHex = getCyberpunkColorHex(card.color);
  const isLegend = isCyberpunkLegendType(card.type);
  const tags = splitPipeList(card.tags);
  const keywords = splitPipeList(card.keywords);
  const stats = [
    card.cost !== undefined ? { label: "Cost", value: card.cost, accent: "#F5C518" } : null,
    card.power !== undefined ? { label: "Power", value: card.power, accent: colorHex } : null,
    card.ram !== undefined ? { label: isLegend ? "RAM given" : "RAM", value: card.ram, accent: colorHex } : null,
  ].filter((stat): stat is { label: string; value: number; accent: string } => stat !== null);
  const setLine = [card.setName ?? card.setCode, card.collectorNumber ? `#${card.collectorNumber}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn("relative z-[1] space-y-6 px-5 py-5 pr-12 md:px-8 md:py-6", className)}>
      <header>
        <PageHeading size="lg" className="min-w-0 leading-[1.05] text-foreground">
          {title}
        </PageHeading>
        {subname ? <p className="m-0 mt-1 text-base font-medium text-muted-foreground">{subname}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {type && typeColor ? (
            <span
              className="chrome-label-case inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: `${typeColor}33`, borderColor: `${typeColor}99`, color: typeColor }}
            >
              {type}
            </span>
          ) : null}
          {card.color ? (
            <span className="chrome-label-case inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/30 px-3 py-1 text-xs font-bold">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: colorHex, boxShadow: `0 0 8px ${colorHex}` }}
              />
              {getCyberpunkColorLabel(card.color)}
            </span>
          ) : null}
          {card.sellable ? (
            <span className="chrome-label-case inline-flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 py-1 pl-1 pr-3 text-xs font-bold text-yellow-200">
              <EddieCoin className="size-5 text-[8px]" />
              Sellable
            </span>
          ) : null}
          {card.rarity ? <Badge tone="muted">{card.rarity}</Badge> : null}
        </div>
      </header>

      {stats.length > 0 ? (
        <section aria-label="Card statistics">
          <dl className="m-0 flex flex-wrap gap-x-6 gap-y-3">
            {stats.map((stat) => (
              <StatCell key={stat.label} {...stat} />
            ))}
          </dl>
        </section>
      ) : null}

      {keywords.length > 0 ? (
        <section aria-label="Keywords">
          <SectionLabel>Keywords</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <Badge key={keyword} tone="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {card.text ? (
        <section aria-label="Card text">
          <SectionLabel>Abilities</SectionLabel>
          <CyberpunkRulesText text={card.text} />
        </section>
      ) : null}

      {tags.length > 0 ? (
        <section aria-label="Tags">
          <SectionLabel>Tags</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} tone="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Card info">
        <SectionLabel>Info</SectionLabel>
        <dl className="m-0 space-y-2">
          {setLine ? <MetaRow label="Set">{setLine}</MetaRow> : null}
          {card.artist ? <MetaRow label="Artist">{card.artist}</MetaRow> : null}
          <MetaRow label="Legality">
            <LegalityRows card={card} />
          </MetaRow>
        </dl>
      </section>
    </div>
  );
}
