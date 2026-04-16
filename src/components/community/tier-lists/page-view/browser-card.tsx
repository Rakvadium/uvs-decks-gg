"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import type { CachedCard } from "@/lib/universus";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TierListPreviewGrid } from "../preview-grid";
import { getTierListScopeLabel } from "../utils";

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

interface TierListBrowserCardProps {
  tierList: Doc<"tierLists">;
  authorLabel: string;
  cardMap: Map<string, CachedCard>;
  href: string;
}

export function TierListBrowserCard({
  tierList,
  authorLabel,
  cardMap,
  href,
}: TierListBrowserCardProps) {
  const previewCards = useMemo(
    () =>
      tierList.previewCardIds
        .map((cardId) => cardMap.get(cardId.toString()))
        .filter((card): card is CachedCard => Boolean(card))
        .slice(0, 4),
    [cardMap, tierList.previewCardIds]
  );

  return (
    <Link
      href={href}
      aria-label={`Open tier list: ${tierList.title}`}
      className={cn(
        "block h-full rounded-lg outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <Card className="h-full cursor-pointer border-border/60 bg-card/75 shadow-[0_18px_50px_-38px_rgba(0,0,0,0.8)] transition-colors hover:border-primary/25">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="entity">Tier List</Badge>
              <Badge variant={tierList.isPublic ? "default" : "outline"}>
                {tierList.isPublic ? "Public" : "Private"}
              </Badge>
              <Badge variant="outline">{getTierListScopeLabel(tierList.rankingScope)}</Badge>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {formatDate(tierList.updatedAt)}
            </span>
          </div>

          <div className="space-y-1">
            <CardTitle className="line-clamp-2 text-lg leading-snug">{tierList.title}</CardTitle>
            <CardDescription>{authorLabel}</CardDescription>
          </div>

          {tierList.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{tierList.description}</p>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">
          <TierListPreviewGrid cards={previewCards} emptyLabel="Slot" />

          <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            <span>{tierList.itemCount} cards</span>
            <span>{tierList.tierCount} tiers</span>
            {tierList.selectedSetCodes.slice(0, 2).map((setCode) => (
              <Badge key={setCode} variant="outline" className="text-[9px]">
                {setCode}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
