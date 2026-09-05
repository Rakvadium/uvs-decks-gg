"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Hexagon, Layers, User } from "lucide-react";
import { SymbolIcon } from "@/components/universus/symbol-icon";
import { cn } from "@/lib/utils";
import { useDeckGridItemContext } from "../context";
import { MAIN_DECK_TARGET } from "../hook";
import { ProgressRing, VisibilityGlyph } from "./shared";
import { accentCssVars, symbolAccentFor } from "./splash-accent";

export function DeckSplashItem() {
  const {
    deck,
    displayImage,
    displayName,
    startingCharacterName,
    characterSymbols,
    accentSymbol,
    visibility,
    coverImagePriority,
    counts,
    progress,
    isReady,
    showAuthor,
    authorLabel,
  } = useDeckGridItemContext();

  const accent = symbolAccentFor(accentSymbol, deck._id);

  return (
    <Link
      href={`/decks/${deck._id}`}
      className="group block"
      style={accentCssVars(accent)}
    >
      <article
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[var(--chrome-elevation-low)]",
          "transition-[transform,box-shadow,border-color] duration-300 ease-out",
          "group-hover:-translate-y-1 group-hover:border-[hsl(var(--accent-h)_var(--accent-s)_var(--accent-l)/0.6)] group-hover:shadow-[0_18px_40px_-18px_hsl(var(--accent-h)_var(--accent-s)_var(--accent-l)/0.55)]",
        )}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={displayName}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="origin-top scale-[1.48] object-cover object-top motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:group-hover:scale-[1.56]"
            priority={coverImagePriority}
            loading={coverImagePriority ? undefined : "lazy"}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 0%, hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.35), transparent 60%), hsl(var(--accent-h) 20% 10%)",
            }}
          >
            <Hexagon className="h-16 w-16 text-white/10" />
            <Layers className="absolute h-6 w-6 text-white/40" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/5" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black via-black/85 to-transparent" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-70 mix-blend-screen motion-safe:transition-opacity motion-safe:duration-150 motion-safe:group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 100%, hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.35), transparent 70%)",
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          {accentSymbol ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 p-1 pr-1.5 backdrop-blur-sm">
              <SymbolIcon symbol={accentSymbol} size="sm" />
              {characterSymbols.length > 1 ? (
                <span className="text-[10px] font-semibold tabular-nums text-white/70">
                  +{characterSymbols.length - 1}
                </span>
              ) : null}
            </span>
          ) : (
            <span />
          )}
          <VisibilityGlyph
            deck={deck}
            visibility={visibility}
            className="h-6 w-6"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3">
          {deck.format ? (
            <span className="chrome-label-case text-[10px] font-semibold text-[hsl(var(--accent-h)_var(--accent-s)_72%)]">
              {deck.format}
              {deck.subFormat ? (
                <span className="text-white/50"> / {deck.subFormat}</span>
              ) : null}
            </span>
          ) : null}

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-bold leading-tight tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {displayName}
            </h3>
            {startingCharacterName ? (
              <p className="mt-0.5 truncate text-[11px] text-white/65">
                {startingCharacterName}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
            <div className="flex items-center gap-2">
              <ProgressRing
                progress={progress}
                size={34}
                stroke={3}
                className="text-white"
              >
                <span className="text-[10px] font-bold tabular-nums text-white">
                  {counts.main}
                </span>
              </ProgressRing>
              <div className="flex flex-col leading-none">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    isReady ? "text-success" : "text-warning",
                  )}
                >
                  {isReady ? "Ready" : "Building"}
                </span>
                <span className="mt-0.5 text-[10px] tabular-nums text-white/55">
                  {counts.main}/{MAIN_DECK_TARGET}
                  {counts.side > 0 ? (
                    <span className="ml-1.5 inline-flex items-center gap-0.5">
                      <BookOpen className="h-2.5 w-2.5" />
                      {counts.side}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            {showAuthor ? (
              <span className="inline-flex min-w-0 items-center gap-1 text-[10px] text-white/60">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{authorLabel}</span>
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
