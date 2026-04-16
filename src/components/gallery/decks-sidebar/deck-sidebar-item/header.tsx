import Image from "next/image";
import Link from "next/link";
import { Globe, Hexagon, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDeckSidebarItemContext } from "./context";

export function DeckSidebarItemHeader() {
  const isMobile = useIsMobile();
  const { deck, deckImageName, deckImageUrl, isActive } = useDeckSidebarItemContext();

  return (
    <div className="flex items-start gap-3">
      {isMobile ? (
        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted/40">
          {deckImageUrl ? (
            <Image
              src={deckImageUrl}
              alt={deckImageName}
              fill
              sizes="40px"
              className="object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Hexagon className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
        </div>
      ) : null}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="min-w-0 flex items-center gap-2">
          <Link
            href={`/decks/${deck._id}`}
            className="truncate font-display text-sm font-bold uppercase tracking-wide transition-colors hover:text-primary"
            title={deck.name}
          >
            {deck.name}
          </Link>
          {isActive ? (
            <Badge
              variant="outline"
              className="border-primary/40 text-[9px] font-mono uppercase tracking-wider text-primary"
            >
              Active
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {deck.isPublic ? <Globe className="h-3 w-3 text-primary" /> : <Lock className="h-3 w-3" />}
            {deck.isPublic ? "Public" : "Private"}
          </span>
          {deck.format ? <span className="text-primary/80">{deck.format}</span> : null}
        </div>
      </div>
    </div>
  );
}
