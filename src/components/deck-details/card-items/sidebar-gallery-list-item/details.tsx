import { formatUniversusCardType } from "@/config/universus";
import { useSidebarGalleryListItemContext } from "./context";

export function SidebarGalleryListItemDetails() {
  const { card } = useSidebarGalleryListItemContext();

  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium">{card.name}</p>
      <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {card.type ? <span>{formatUniversusCardType(card.type) ?? card.type}</span> : null}
        {card.difficulty !== undefined ? <span>D{card.difficulty}</span> : null}
        {card.control !== undefined ? <span>C{card.control}</span> : null}
      </div>
    </div>
  );
}
