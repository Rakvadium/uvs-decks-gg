"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Hexagon, Layers, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Kicker, SectionHeading } from "@/components/ui/typography-headings";
import { cn } from "@/lib/utils";
import { useDeckGridItemContext } from "../context";
import { MAIN_DECK_TARGET } from "../hook";
import { VisibilityGlyph } from "./shared";

const TILE_SURFACE =
  "border border-border/50 shadow-[var(--chrome-card-shadow)] transition-[border-color,box-shadow] duration-150 group-hover:border-[var(--chrome-deck-grid-border-hover)] group-hover:shadow-[var(--chrome-deck-grid-shadow-hover)]";

export function DeckRowItem() {
  const {
    deck,
    displayImage,
    displayName,
    startingCharacterName,
    visibility,
    coverImagePriority,
    counts,
    isReady,
    showAuthor,
    authorLabel,
    selected,
    trailingAction,
  } = useDeckGridItemContext();

  return (
    <article
      className={cn(
        "group relative flex items-stretch gap-3 rounded-lg bg-card p-2 text-card-foreground",
        TILE_SURFACE,
        selected && "border-primary/40 bg-primary/10 hover:border-primary/60 group-hover:border-primary/60"
      )}
    >
      <Link
        href={`/decks/${deck._id}`}
        className="flex min-w-0 flex-1 items-stretch gap-3"
      >
        <span className="relative h-[5.5rem] w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={displayName}
              fill
              sizes="64px"
              className="origin-top scale-[1.12] object-cover object-[50%_18%]"
              priority={coverImagePriority}
              loading={coverImagePriority ? undefined : "lazy"}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
              <span className="relative">
                <Hexagon className="h-8 w-8 text-primary/20" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Layers className="h-3.5 w-3.5 text-primary/40" />
                </span>
              </span>
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <span className="min-w-0">
            <SectionHeading as="h3" size="xs" className="line-clamp-2 leading-tight">
              {displayName}
            </SectionHeading>
            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">{startingCharacterName ?? "No character selected"}</span>
              {showAuthor ? (
                <>
                  <span aria-hidden className="text-border">
                    ·
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-0.5">
                    <User className="h-2.5 w-2.5 shrink-0" />
                    <span className="max-w-[7rem] truncate normal-case tracking-normal">{authorLabel}</span>
                  </span>
                </>
              ) : null}
            </span>
          </span>

          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-background/50 px-1.5 py-1 text-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", isReady ? "bg-success" : "bg-warning")} />
              <Layers className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-bold leading-none tabular-nums">
                {counts.main}
                <span className="font-medium text-muted-foreground">/{MAIN_DECK_TARGET}</span>
              </span>
              {counts.side > 0 ? (
                <span className="inline-flex items-center gap-0.5 border-l border-border/40 pl-1.5 text-xs leading-none tabular-nums text-muted-foreground">
                  <BookOpen className="h-2.5 w-2.5" />
                  {counts.side}
                </span>
              ) : null}
            </span>
            <Badge tone={isReady ? "success" : "warning"} className="px-1.5 py-0 text-[10px]">
              {isReady ? "Ready" : "Building"}
            </Badge>
            <VisibilityGlyph deck={deck} visibility={visibility} className="h-6 w-6" />
            {deck.format ? (
              <Kicker size="meta" className="min-w-0 truncate font-medium">
                {deck.format}
              </Kicker>
            ) : null}
          </span>
        </span>
      </Link>

      {trailingAction ? (
        <div className="flex shrink-0 items-center self-center">{trailingAction}</div>
      ) : null}
    </article>
  );
}
