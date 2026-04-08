"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CommunitySectionHeader } from "@/components/community/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TierListFeedCard } from "./card";
import { useCommunityTierListFeed } from "./hook";
import { TierListFeedSkeleton } from "./skeleton";

interface TierListFeedProps {
  title: string;
  description: string;
  limit?: number;
  compact?: boolean;
  showBrowseLink?: boolean;
  action?: ReactNode;
  className?: string;
}

export function TierListFeed({
  title,
  description,
  limit = 6,
  compact = false,
  showBrowseLink = true,
  action,
  className,
}: TierListFeedProps) {
  const { feed, isLoading, cardMap } = useCommunityTierListFeed(limit);

  return (
    <section className={cn("space-y-4", className)}>
      <CommunitySectionHeader
        title={title}
        description={description}
        action={
          action ?? (showBrowseLink ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/community/tier-lists">Open Tier Lab</Link>
            </Button>
          ) : null)
        }
      />

      {isLoading ? (
        <TierListFeedSkeleton compact={compact} />
      ) : feed && feed.length > 0 ? (
        <div className={compact ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "grid gap-4 lg:grid-cols-2"}>
          {feed.map((entry) => (
            <TierListFeedCard
              key={entry.tierList._id}
              compact={compact}
              cardMap={cardMap}
              {...entry}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <Sparkles className="h-6 w-6 text-primary" />
            <p className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">
              No public tier lists yet
            </p>
            <Button size="sm" asChild>
              <Link href="/community/tier-lists">Be the first to publish one</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
