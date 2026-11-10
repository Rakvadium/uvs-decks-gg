"use client";

import { splitPipeList } from "@shared/games/filters";
import { isCyberpunkLegendType } from "@shared/games/cyberpunk/card-types";
import type { CachedCard } from "@/lib/universus/card-store";
import { cn } from "@/lib/utils";
import {
  cyberpunkCardTitle,
  formatCyberpunkCardType,
  getCyberpunkCardTypeColor,
  getCyberpunkColorHex,
  getCyberpunkColorLabel,
} from "../config";
import { CyberpunkRulesText } from "./rules-text";

export type CyberpunkFrameCard = Pick<
  CachedCard,
  "name" | "subname" | "type" | "text" | "color" | "cost" | "power" | "ram" | "sellable" | "tags"
>;

/** Eddie (€$) coin; marks sellable cards. */
export function EddieCoin({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-label="Sellable (Eddie)"
      title="Sellable (Eddie)"
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-yellow-300/80 bg-yellow-400/20 font-black leading-none text-yellow-200",
        className
      )}
      style={style}
    >
      €$
    </span>
  );
}

/**
 * Text-only card face used when a card has no image: color stripe, cost / RAM / power, name,
 * type line, rules text excerpt and tags. Sizes scale with the tile width (container units),
 * so it reads at gallery thumbnail and dialog sizes alike.
 */
export function CyberpunkCardTextFrame({
  card,
  name,
  className,
}: {
  /** Omitted when only a name is known (generic callers of `CardImageDisplay`). */
  card?: CyberpunkFrameCard | null;
  name: string;
  className?: string;
}) {
  const { title, subname } = cyberpunkCardTitle({ name: card?.name ?? name, subname: card?.subname });
  const colorHex = getCyberpunkColorHex(card?.color);
  const type = formatCyberpunkCardType(card?.type);
  const typeColor = type ? getCyberpunkCardTypeColor(type) : undefined;
  const isLegend = isCyberpunkLegendType(card?.type);
  const tags = splitPipeList(card?.tags);
  const hasColor = Boolean(card?.color?.trim());

  return (
    <div
      role="img"
      aria-label={`${card?.name ?? name}${type ? `, ${type}` : ""} (no image)`}
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden bg-[#0b0e14] text-left text-slate-100 [container-type:inline-size]",
        className
      )}
      style={{ borderRadius: "inherit" }}
    >
      {/* Color wash + scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${colorHex}40 0%, transparent 42%), radial-gradient(ellipse 90% 60% at 100% 100%, ${colorHex}26 0%, transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 4px)" }}
      />
      {/* Color stripe */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0"
        style={{ width: "2.8cqw", backgroundColor: colorHex, boxShadow: `0 0 12px ${colorHex}` }}
      />
      {isLegend ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 border-2"
          style={{ borderColor: `${typeColor}99`, borderRadius: "inherit" }}
        />
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col" style={{ padding: "5cqw 5cqw 4.5cqw 7.5cqw", gap: "2.5cqw" }}>
        {/* Top row: cost + RAM */}
        <div className="flex items-start justify-between" style={{ gap: "2cqw" }}>
          {card?.cost !== undefined ? (
            <span
              className="flex items-center justify-center font-black tabular-nums leading-none text-black"
              style={{
                width: "13cqw",
                height: "13cqw",
                fontSize: "7.5cqw",
                backgroundColor: "#F5C518",
                clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
              }}
              title="Cost"
            >
              {card.cost}
            </span>
          ) : (
            <span />
          )}
          {card?.ram !== undefined ? (
            <span
              className="chrome-label-case inline-flex items-baseline rounded-sm border font-bold leading-none"
              style={{
                gap: "1cqw",
                padding: "1.2cqw 2cqw",
                fontSize: "4.4cqw",
                borderColor: `${colorHex}b3`,
                backgroundColor: `${colorHex}26`,
                color: colorHex,
              }}
              title={isLegend ? "RAM provided" : "RAM"}
            >
              RAM <span className="tabular-nums" style={{ fontSize: "6cqw" }}>{card.ram}</span>
            </span>
          ) : null}
        </div>

        {/* Name */}
        <div className="min-w-0">
          <p
            className="chrome-heading-case m-0 line-clamp-2 font-extrabold leading-[1.05] tracking-tight"
            style={{ fontSize: "8cqw" }}
          >
            {title}
          </p>
          {subname ? (
            <p className="m-0 truncate font-medium text-slate-300" style={{ fontSize: "5cqw", marginTop: "0.8cqw" }}>
              {subname}
            </p>
          ) : null}
        </div>

        {/* Type line */}
        {type || hasColor ? (
          <div className="chrome-label-case flex flex-wrap items-center font-bold" style={{ gap: "1.5cqw", fontSize: "4cqw" }}>
            {type ? (
              <span
                className="rounded-sm border leading-none"
                style={{ padding: "1cqw 2cqw", color: typeColor, borderColor: `${typeColor}99`, backgroundColor: `${typeColor}1f` }}
              >
                {type}
              </span>
            ) : null}
            {hasColor ? (
              <span className="inline-flex items-center text-slate-300" style={{ gap: "1cqw" }}>
                <span
                  aria-hidden
                  className="rounded-full"
                  style={{ width: "3cqw", height: "3cqw", backgroundColor: colorHex, boxShadow: `0 0 6px ${colorHex}` }}
                />
                {getCyberpunkColorLabel(card?.color)}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Rules text */}
        {card?.text ? (
          <div
            className="min-h-0 flex-1 overflow-hidden rounded-sm border border-white/10 bg-black/35 leading-snug text-slate-200"
            style={{ padding: "2.5cqw 3cqw", fontSize: "4.2cqw" }}
          >
            <CyberpunkRulesText text={card.text} compact className="line-clamp-[8]" />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Footer: tags / sellable / power */}
        <div className="flex items-end justify-between" style={{ gap: "2cqw" }}>
          <div className="flex min-w-0 flex-1 items-center" style={{ gap: "1.5cqw" }}>
            {card?.sellable ? (
              <EddieCoin style={{ width: "7.5cqw", height: "7.5cqw", fontSize: "3cqw" }} className="shrink-0" />
            ) : null}
            {tags.length > 0 ? (
              <span
                className="chrome-label-case min-w-0 truncate font-semibold text-slate-400"
                style={{ fontSize: "3.6cqw" }}
              >
                {tags.join(" · ")}
              </span>
            ) : null}
          </div>
          {card?.power !== undefined ? (
            <span
              className="inline-flex shrink-0 items-baseline rounded-sm font-black leading-none text-white"
              style={{
                gap: "1.2cqw",
                padding: "1.5cqw 2.5cqw",
                backgroundColor: `${colorHex}cc`,
                boxShadow: `0 0 10px ${colorHex}80`,
              }}
              title="Power"
            >
              <span className="chrome-label-case font-bold opacity-80" style={{ fontSize: "3.6cqw" }}>
                PWR
              </span>
              <span className="tabular-nums" style={{ fontSize: "7cqw" }}>
                {card.power}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
