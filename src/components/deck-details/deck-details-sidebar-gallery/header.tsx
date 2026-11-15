import { LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl, type SegmentedControlItem } from "@/components/ui/segmented-control";
import { useAvailableGallerySidebarContext } from "./context";
import type { SidebarGalleryViewMode } from "./hook";

const VIEW_MODE_ITEMS: (SegmentedControlItem & { value: SidebarGalleryViewMode })[] = [
  { value: "card", label: "card", icon: LayoutGrid },
  { value: "list", label: "list", icon: List },
];

export function DeckDetailsGallerySidebarHeader() {
  const { gallery, viewMode, setViewMode } = useAvailableGallerySidebarContext();
  const { meta } = gallery;

  return (
    <div className="shrink-0 border-b border-divider px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="chrome-label-case text-[10px] text-muted-foreground">Gallery</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="chrome-label-case text-[10px] text-muted-foreground">
              {meta.filteredCount.toLocaleString()} cards
            </span>
            {meta.activeFilterCount > 0 ? (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {meta.activeFilterCount} filter{meta.activeFilterCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
        </div>

        <SegmentedControl
          size="xs"
          aria-label="Gallery view"
          value={viewMode}
          onValueChange={(mode) => setViewMode(mode as SidebarGalleryViewMode)}
          items={VIEW_MODE_ITEMS}
        />
      </div>
    </div>
  );
}
