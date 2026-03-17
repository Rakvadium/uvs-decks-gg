import { Button } from "@/components/ui/button";
import { CardGridItem } from "@/components/universus/card-grid-item";
import { SidebarGalleryListItem } from "../deck-details-card-items";
import { useAvailableGallerySidebarContext } from "./context";

export function DeckDetailsGallerySidebarBody() {
  const {
    cardIdMap,
    hasMore,
    loadMore,
    setHoveredListCardId,
    viewMode,
    visibleCards,
  } = useAvailableGallerySidebarContext();

  return (
    <div className="min-h-0 flex-1 px-3 py-3">
      {visibleCards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
          No cards match your current filters.
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-2 gap-2">
          {visibleCards.map((card) => {
            const backCard = card.backCardId ? cardIdMap.get(card.backCardId) : undefined;
            return <CardGridItem key={card._id} card={card} backCard={backCard} />;
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleCards.map((card) => {
            const backCard = card.backCardId ? cardIdMap.get(card.backCardId) : undefined;
            return (
              <SidebarGalleryListItem
                key={card._id}
                card={card}
                backCard={backCard}
                onHoverCard={(hoverCard) => setHoveredListCardId(hoverCard._id)}
                onClearHover={() => setHoveredListCardId(null)}
              />
            );
          })}
        </div>
      )}

      {hasMore ? (
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={loadMore}>
          Load More
        </Button>
      ) : null}
    </div>
  );
}
