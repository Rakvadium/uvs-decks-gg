"use client";

import { cn } from "@/lib/utils";
import { SymbolIcon } from "../symbol-icon";
import { AbilityText } from "./ability-text";
import { useCardDetailsContent } from "./content-context";
import { KeywordBadge } from "./keyword-badge";

const ACCENT = {
  general: "#7dd3fc",
  block: "#fb7185",
  attack: "#fbbf24",
} as const;

type StatRow = { key: string; value: string };

type StatColumn = { title: string; accent: string; rows: StatRow[] };

function CompactStatsBand({ columns }: { columns: StatColumn[] }) {
  if (columns.length === 0) return null;

  const multi = columns.length > 1;
  const hasAttack = columns.some((c) => c.title === "Attack");
  const hasGeneral = columns.some((c) => c.title === "General");
  const hasBlock = columns.some((c) => c.title === "Block");
  const mobileAttackSecondRow = multi && hasAttack;

  return (
    <div
      className={cn(
        "min-w-0",
        mobileAttackSecondRow &&
          "grid max-sm:grid-cols-2 max-sm:gap-x-2 max-sm:gap-y-2 max-sm:overflow-visible sm:flex sm:flex-row sm:gap-x-4 md:gap-x-6",
        multi &&
          !mobileAttackSecondRow &&
          "flex flex-row gap-x-2 overflow-x-auto overscroll-x-contain sm:gap-x-4 md:gap-x-6 sm:overflow-visible",
        !multi && "flex flex-col"
      )}
    >
      {columns.map((col, ci) => {
        const isAttackCol =
          mobileAttackSecondRow && col.title === "Attack";
        const leftDivider = multi
          ? mobileAttackSecondRow
            ? col.title === "Block" && hasGeneral
            : ci > 0
          : false;

        return (
          <div
            key={col.title}
            className={cn(
            "min-w-0 sm:flex-1 sm:basis-auto",
            !mobileAttackSecondRow && multi && "flex-1 basis-0",
            mobileAttackSecondRow && "max-sm:min-w-0",
            isAttackCol && "max-sm:col-span-2 max-sm:row-start-2",
            col.title === "General" &&
              mobileAttackSecondRow &&
              (hasBlock
                ? "max-sm:col-start-1 max-sm:row-start-1"
                : "max-sm:col-span-2 max-sm:row-start-1"),
            col.title === "Block" &&
              mobileAttackSecondRow &&
              (hasGeneral
                ? "max-sm:col-start-2 max-sm:row-start-1"
                : "max-sm:col-span-2 max-sm:row-start-1"),
            leftDivider &&
              "border-l border-white/[0.06] pl-2 sm:pl-3 md:pl-4",
            isAttackCol &&
              "max-sm:border-l-0 max-sm:pl-0 max-sm:border-t max-sm:border-white/[0.06] max-sm:pt-2 sm:border-l sm:border-t-0 sm:pt-0 sm:pl-3 md:pl-4"
            )}
          >
            <div className="mb-1 flex items-center gap-1 sm:mb-1.5 sm:gap-1.5">
            <span
              className="h-1 w-1 shrink-0 rounded-full ring-2 ring-white/10 sm:h-1.5 sm:w-1.5"
              style={{
                backgroundColor: col.accent,
                boxShadow: `0 0 8px ${col.accent}`,
              }}
            />
            <h2
              className="text-[8px] font-mono font-semibold uppercase tracking-[0.22em] text-muted-foreground/75 sm:text-[9px] sm:tracking-[0.3em]"
              style={{ color: col.accent }}
            >
              {col.title}
            </h2>
            </div>
            <dl className="m-0 flex min-w-0 flex-wrap content-start gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-1">
              {col.rows.map((row) => (
                <div
                  key={row.key}
                  className="flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:gap-x-1.5 sm:gap-y-0 md:gap-x-2"
                >
                  <dt className="order-2 m-0 max-w-full text-[7px] font-semibold uppercase leading-tight tracking-[0.05em] text-muted-foreground/70 sm:order-1 sm:shrink-0 sm:text-[9px] sm:tracking-[0.08em]">
                    {row.key}
                  </dt>
                  <dd
                    className="order-1 m-0 min-w-0 font-display text-xs font-extrabold tabular-nums leading-none tracking-[-0.02em] sm:order-2 sm:text-sm md:text-base"
                    style={{ color: col.accent }}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
}

export function CardDetailsReadoutSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_95%_70%_at_100%_-15%,color-mix(in_oklab,var(--primary)_22%,transparent)_0%,transparent_58%),radial-gradient(ellipse_80%_55%_at_-10%_105%,color-mix(in_oklab,var(--chart-2)_16%,transparent)_0%,transparent_52%)] opacity-90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.055] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}

export function CardDetailsReadoutPanel() {
  const { card, symbols, keywordAbilities, otherKeywords } =
    useCardDetailsContent();

  const generalRows: StatRow[] = [];
  if (card.difficulty !== undefined) {
    generalRows.push({ key: "Difficulty", value: String(card.difficulty) });
  }
  if (card.control !== undefined) {
    generalRows.push({ key: "Check", value: String(card.control) });
  }
  if (card.handSize !== undefined) {
    generalRows.push({ key: "Hand", value: String(card.handSize) });
  }
  if (card.health !== undefined) {
    generalRows.push({ key: "Health", value: String(card.health) });
  }
  if (card.stamina !== undefined) {
    generalRows.push({ key: "Vitality", value: String(card.stamina) });
  }

  const blockRows: StatRow[] = [];
  if (card.blockZone) {
    blockRows.push({
      key: "Zone",
      value: card.blockZone.toUpperCase(),
    });
  }
  if (card.blockModifier !== undefined) {
    blockRows.push({ key: "Modifier", value: String(card.blockModifier) });
  }

  const attackRows: StatRow[] = [];
  if (card.speed !== undefined) {
    attackRows.push({ key: "Speed", value: String(card.speed) });
  }
  if (card.attackZone) {
    attackRows.push({
      key: "Zone",
      value: card.attackZone.toUpperCase(),
    });
  }
  if (card.damage !== undefined) {
    attackRows.push({ key: "Damage", value: String(card.damage) });
  }

  const hasKeywords = keywordAbilities.length > 0 || otherKeywords.length > 0;
  const hasAnyStats =
    generalRows.length > 0 ||
    blockRows.length > 0 ||
    attackRows.length > 0;

  const statColumns: StatColumn[] = [];
  if (generalRows.length > 0) {
    statColumns.push({
      title: "General",
      accent: ACCENT.general,
      rows: generalRows,
    });
  }
  if (blockRows.length > 0) {
    statColumns.push({
      title: "Block",
      accent: ACCENT.block,
      rows: blockRows,
    });
  }
  if (attackRows.length > 0) {
    statColumns.push({
      title: "Attack",
      accent: ACCENT.attack,
      rows: attackRows,
    });
  }

  return (
    <div className="relative z-[1] px-5 py-5 max-md:pr-12 md:px-8 md:py-6 md:pr-8 lg:px-9 lg:py-7">
      <header className="mb-6 md:mb-7">
        <h1 className="max-w-[22ch] text-[clamp(1.35rem,3.35vw,2.2rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-foreground">
          {card.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {card.type && (
            <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/[0.12] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary">
              {card.type}
            </span>
          )}
          {symbols.length > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-background/35 px-2.5 py-1 backdrop-blur-md">
              {symbols.map((s) => (
                <SymbolIcon key={s} symbol={s} size="md" />
              ))}
            </div>
          )}
        </div>
      </header>

      {hasAnyStats && (
        <section className="mb-4 md:mb-5" aria-label="Card statistics">
          <CompactStatsBand columns={statColumns} />
        </section>
      )}

      {hasKeywords && (
        <section className="mb-6 md:mb-7" aria-label="Keywords">
          <div className="mb-2 flex items-center gap-3">
            <p className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.38em] text-muted-foreground/50">
              Keywords
            </p>
            <span className="h-px flex-1 bg-gradient-to-r from-border/60 via-border/25 to-transparent" />
          </div>
          <div className="flex flex-wrap gap-2">
            {keywordAbilities.map((kw, i) => (
              <KeywordBadge key={`a-${i}`} keyword={kw} />
            ))}
            {keywordAbilities.length > 0 && otherKeywords.length > 0 && (
              <span
                className="mx-0.5 hidden h-5 w-px self-center bg-border/35 sm:block"
                aria-hidden
              />
            )}
            {otherKeywords.map((kw, i) => (
              <KeywordBadge key={`o-${i}`} keyword={kw} />
            ))}
          </div>
        </section>
      )}

      {card.text && (
        <section aria-label="Card text">
          <div className="mb-2 flex items-center gap-3">
            <p className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.38em] text-muted-foreground/50">
              Abilities
            </p>
            <span className="h-px flex-1 bg-gradient-to-r from-border/60 via-border/25 to-transparent" />
          </div>
          <AbilityText text={card.text} showHeading={false} />
        </section>
      )}
    </div>
  );
}
