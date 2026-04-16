"use client";

import { Fragment, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Gauge,
  Hand,
  HeartPulse,
  Shield,
  SlidersHorizontal,
  Swords,
  Sword,
  Wind,
  Zap,
} from "lucide-react";
import { OPERATOR_OPTIONS } from "@/components/gallery/filter-dialog/constants";
import type { CardFilters, StatFilterValue, StatOperator } from "@/providers/UIStateProvider";
import { cn } from "@/lib/utils";

function operatorSymbol(op: StatOperator): string {
  return OPERATOR_OPTIONS.find((o) => o.value === op)?.label ?? "=";
}

function formatZones(zones: string[] | undefined): string | null {
  if (!zones?.length) return null;
  const abbrev: Record<string, string> = { High: "Hi", Mid: "Md", Low: "Lo" };
  return zones.map((z) => abbrev[z] ?? z.slice(0, 2)).join("·");
}

function statActive(f: StatFilterValue | undefined): f is StatFilterValue {
  return f !== undefined && f.value !== undefined;
}

const miniIconClass = "size-3 shrink-0 opacity-90";

const generalChipShell =
  "inline-flex max-w-[9rem] shrink-0 items-center gap-0.5 rounded-md border px-1 py-px text-[9px] font-bold font-mono uppercase tracking-[0.08em] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";

const GENERAL_STATS: Array<{
  key: keyof Pick<
    CardFilters,
    "difficulty" | "control" | "health" | "handSize" | "stamina"
  >;
  icon: LucideIcon;
  chipClass: string;
}> = [
  {
    key: "difficulty",
    icon: Gauge,
    chipClass: "border-violet-400/35 bg-violet-500/15 text-violet-100",
  },
  {
    key: "control",
    icon: SlidersHorizontal,
    chipClass: "border-sky-400/35 bg-sky-500/15 text-sky-100",
  },
  {
    key: "health",
    icon: HeartPulse,
    chipClass: "border-rose-400/35 bg-rose-500/15 text-rose-100",
  },
  {
    key: "handSize",
    icon: Hand,
    chipClass: "border-amber-400/35 bg-amber-500/15 text-amber-100",
  },
  {
    key: "stamina",
    icon: Zap,
    chipClass: "border-lime-400/35 bg-lime-500/15 text-lime-100",
  },
];

function GeneralStatChip({
  icon: Icon,
  chipClass,
  filter,
}: {
  icon: LucideIcon;
  chipClass: string;
  filter: StatFilterValue;
}) {
  return (
    <span className={cn(generalChipShell, chipClass)} title={`${operatorSymbol(filter.operator)} ${filter.value}`}>
      <Icon className={miniIconClass} strokeWidth={2.25} />
      <span className="shrink-0 normal-case">{operatorSymbol(filter.operator)}</span>
      <span className="min-w-0 truncate normal-case tabular-nums">{filter.value}</span>
    </span>
  );
}

function BlockStatsChip({
  zones,
  modifier,
}: {
  zones: string[] | undefined;
  modifier: StatFilterValue | undefined;
}) {
  const z = formatZones(zones);
  const mod = statActive(modifier) ? modifier : undefined;
  if (!z && !mod) return null;

  return (
    <span
      className={cn(
        generalChipShell,
        "max-w-[14rem] border-cyan-400/35 bg-gradient-to-br from-cyan-500/20 via-slate-900/40 to-blue-600/15 text-cyan-50"
      )}
      title={[z, mod ? `${operatorSymbol(mod.operator)} ${mod.value}` : ""].filter(Boolean).join(" · ")}
    >
      <Shield className={cn(miniIconClass, "text-cyan-200")} strokeWidth={2.25} />
      {mod ? (
        <span className="shrink-0 normal-case text-cyan-100/90">{operatorSymbol(mod.operator)}</span>
      ) : null}
      {z ? <span className="min-w-0 truncate normal-case tracking-normal text-cyan-100/85">{z}</span> : null}
      {mod ? <span className="shrink-0 tabular-nums text-cyan-50">{mod.value}</span> : null}
    </span>
  );
}

function AttackStatsChip({
  zones,
  speed,
  damage,
}: {
  zones: string[] | undefined;
  speed: StatFilterValue | undefined;
  damage: StatFilterValue | undefined;
}) {
  const z = formatZones(zones);
  const sp = statActive(speed) ? speed : undefined;
  const dm = statActive(damage) ? damage : undefined;
  if (!z && !sp && !dm) return null;

  const segmentClass =
    "inline-flex items-center gap-0.5 normal-case tabular-nums text-[9px] font-bold font-mono";

  if (z && !sp && !dm) {
    return (
      <span
        className={cn(
          generalChipShell,
          "max-w-[12rem] border-orange-400/35 bg-gradient-to-br from-orange-500/18 via-red-950/25 to-amber-600/12 text-orange-50"
        )}
        title={zones?.join(", ")}
      >
        <Swords className={cn(miniIconClass, "text-orange-200")} strokeWidth={2.25} />
        <span className="min-w-0 truncate tracking-normal">{z}</span>
      </span>
    );
  }

  const pieces: Array<{ key: string; node: ReactNode }> = [];
  if (sp) {
    pieces.push({
      key: "sp",
      node: (
        <span className={cn(segmentClass, "text-amber-100")} title={`Speed ${operatorSymbol(sp.operator)} ${sp.value}`}>
          <Wind className={cn(miniIconClass, "text-amber-200")} strokeWidth={2.25} />
          <span>{operatorSymbol(sp.operator)}</span>
          <span>{sp.value}</span>
        </span>
      ),
    });
  }
  if (z) {
    pieces.push({
      key: "z",
      node: (
        <span
          className={cn(segmentClass, "min-w-0 truncate tracking-normal text-orange-100/90")}
          title={zones?.join(", ")}
        >
          {z}
        </span>
      ),
    });
  }
  if (dm) {
    pieces.push({
      key: "dm",
      node: (
        <span className={cn(segmentClass, "text-rose-100")} title={`Damage ${operatorSymbol(dm.operator)} ${dm.value}`}>
          <Sword className={cn(miniIconClass, "text-rose-200")} strokeWidth={2.25} />
          <span>{operatorSymbol(dm.operator)}</span>
          <span>{dm.value}</span>
        </span>
      ),
    });
  }

  return (
    <span
      className={cn(
        generalChipShell,
        "max-w-[18rem] border-orange-400/35 bg-gradient-to-br from-orange-500/18 via-red-950/25 to-amber-600/12 text-orange-50"
      )}
    >
      {pieces.map((piece, i) => (
        <Fragment key={piece.key}>
          {i > 0 ? (
            <span className="text-[8px] text-orange-200/40" aria-hidden>
              │
            </span>
          ) : null}
          {piece.node}
        </Fragment>
      ))}
    </span>
  );
}

export function StatsQuickFilterAdornment({ filters }: { filters: CardFilters }) {
  const general = GENERAL_STATS.map((s) => {
    const v = filters[s.key];
    if (!statActive(v)) return null;
    return <GeneralStatChip key={s.key} icon={s.icon} chipClass={s.chipClass} filter={v} />;
  }).filter(Boolean);

  const nodes = [
    ...general,
    <BlockStatsChip key="block" zones={filters.blockZone} modifier={filters.blockModifier} />,
    <AttackStatsChip
      key="attack"
      zones={filters.attackZone}
      speed={filters.speed}
      damage={filters.damage}
    />,
  ].filter(Boolean);
  if (nodes.length === 0) return null;

  return (
    <span className="flex min-w-0 flex-wrap items-center justify-end gap-0.5">
      {nodes}
    </span>
  );
}
