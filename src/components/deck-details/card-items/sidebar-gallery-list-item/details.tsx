import { useSidebarGalleryListItemContext } from "./context";
import { useGameModule } from "@/games/game-context";

export function SidebarGalleryListItemDetails() {
  const { formatCardType } = useGameModule().ui;
  const { card } = useSidebarGalleryListItemContext();

  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium">{card.name}</p>
      <div className="chrome-label-case mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {card.type ? <span>{formatCardType(card.type) ?? card.type}</span> : null}
        {card.difficulty !== undefined ? <span>D{card.difficulty}</span> : null}
        {card.control !== undefined ? <span>C{card.control}</span> : null}
      </div>
    </div>
  );
}
