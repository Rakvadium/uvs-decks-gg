"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Hexagon, Layers, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Kicker, SectionHeading } from "@/components/ui/typography-headings";
import { getSymbolPath } from "@/components/universus/symbol-icon/utils";
import { getSymbolColor } from "@/config/universus";
import { cn } from "@/lib/utils";
import { useDeckGridItemContext } from "../context";
import { MAIN_DECK_TARGET } from "../hook";
import { VisibilityGlyph } from "./shared";

const SYMBOL_SIZE = 44;
const SYMBOL_RING = 2;
const SYMBOL_BLEED = 2;
const SYMBOL_CLEARANCE = 5;
const TILE_GAP = 8;
const NOTCH_RADIUS = SYMBOL_SIZE / 2 + SYMBOL_RING + SYMBOL_CLEARANCE;

const TILE_SURFACE =
  "border border-border/50 shadow-[var(--chrome-card-shadow)] transition-[border-color,box-shadow] duration-150 group-hover:border-[var(--chrome-deck-grid-border-hover)] group-hover:shadow-[var(--chrome-deck-grid-shadow-hover)]";

function notchMask(edge: "top" | "bottom") {
  const anchor = edge === "top" ? `50% ${-TILE_GAP / 2}px` : `50% calc(100% + ${TILE_GAP / 2}px)`;
  return `radial-gradient(circle at ${anchor}, transparent ${NOTCH_RADIUS - 0.5}px, #000 ${NOTCH_RADIUS + 0.5}px)`;
}

function notchStyle(edge: "top" | "bottom") {
  const mask = notchMask(edge);
  return { maskImage: mask, WebkitMaskImage: mask };
}

export function DeckNameplateItem() {
  const {
    deck,
    displayImage,
    displayName,
    startingCharacterName,
    accentSymbol,
    visibility,
    coverImagePriority,
    counts,
    isReady,
    showAuthor,
    authorLabel,
  } = useDeckGridItemContext();

  const symbolPath = accentSymbol ? getSymbolPath(accentSymbol) : null;
  const symbolColor = accentSymbol ? getSymbolColor(accentSymbol) : null;
  const hasBadge = Boolean(symbolPath);

  return (
    <Link href={`/decks/${deck._id}`} className="group block">
      <article
        className="relative flex flex-col transition-transform duration-150 group-hover:-translate-y-0.5"
        style={{ gap: TILE_GAP }}
      >
        <div className="relative">
          <div
            className={cn("relative aspect-[16/10] overflow-hidden rounded-lg bg-muted", TILE_SURFACE)}
            style={hasBadge ? notchStyle("bottom") : undefined}
          >
            {displayImage ? (
              <Image
                src={displayImage}
                alt={displayName}
                fill
                sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                className="origin-top scale-[1.12] object-cover object-[50%_18%] transition-transform duration-150 group-hover:scale-[1.16]"
                priority={coverImagePriority}
                loading={coverImagePriority ? undefined : "lazy"}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Hexagon className="h-12 w-12 text-primary/20 transition-colors duration-150 group-hover:text-primary/40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-primary/40" />
                  </div>
                </div>
              </div>
            )}

            <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-card/80 px-1.5 py-1 text-foreground backdrop-blur-sm">
                <span className={cn("h-1.5 w-1.5 rounded-full", isReady ? "bg-success" : "bg-warning")} />
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-bold leading-none tabular-nums">
                  {counts.main}
                  <span className="font-medium text-muted-foreground">/{MAIN_DECK_TARGET}</span>
                </span>
                {counts.side > 0 ? (
                  <span className="inline-flex items-center gap-0.5 border-l border-border/40 pl-1.5 text-[10px] leading-none tabular-nums text-muted-foreground">
                    <BookOpen className="h-2.5 w-2.5" />
                    {counts.side}
                  </span>
                ) : null}
              </span>
              <VisibilityGlyph deck={deck} visibility={visibility} className="h-6 w-6" />
            </div>
          </div>

          {symbolPath && accentSymbol && symbolColor ? (
            <span
              className={cn(
                "absolute left-1/2 z-10 block -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-card transition-transform duration-150 will-change-transform group-hover:scale-105",
                symbolColor.text
              )}
              style={{
                width: SYMBOL_SIZE,
                height: SYMBOL_SIZE,
                top: `calc(100% + ${TILE_GAP / 2}px)`,
                boxShadow: `0 0 0 ${SYMBOL_RING}px currentColor`,
              }}
              title={accentSymbol}
            >
              <Image
                src={symbolPath}
                alt={accentSymbol}
                width={SYMBOL_SIZE + SYMBOL_BLEED * 2}
                height={SYMBOL_SIZE + SYMBOL_BLEED * 2}
                className="absolute block max-w-none"
                style={{
                  top: -SYMBOL_BLEED,
                  left: -SYMBOL_BLEED,
                  width: SYMBOL_SIZE + SYMBOL_BLEED * 2,
                  height: SYMBOL_SIZE + SYMBOL_BLEED * 2,
                }}
              />
            </span>
          ) : null}
        </div>

        <div
          className={cn("relative rounded-lg bg-card px-3 pb-2.5 text-center text-card-foreground", TILE_SURFACE)}
          style={{
            paddingTop: hasBadge ? NOTCH_RADIUS - TILE_GAP / 2 + 6 : 10,
            ...(hasBadge ? notchStyle("top") : {}),
          }}
        >
          <SectionHeading
            as="h3"
            size="xs"
            className="truncate leading-tight transition-colors duration-150 group-hover:text-primary"
          >
            {displayName}
          </SectionHeading>
          <p className="mt-0.5 flex min-w-0 items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{startingCharacterName ?? "No character selected"}</span>
            {showAuthor ? (
              <>
                <span aria-hidden className="text-border">
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-0.5">
                  <User className="h-2.5 w-2.5 shrink-0" />
                  <span className="max-w-[110px] truncate normal-case tracking-normal">{authorLabel}</span>
                </span>
              </>
            ) : null}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/30 pt-1.5">
            <Badge tone={isReady ? "success" : "warning"} className="px-1.5 py-0 text-[10px]">
              {isReady ? "Ready" : "Building"}
            </Badge>
            {deck.format ? (
              <Kicker size="meta" className="truncate font-medium">
                {deck.format}
                {deck.subFormat ? ` / ${deck.subFormat}` : ""}
              </Kicker>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
