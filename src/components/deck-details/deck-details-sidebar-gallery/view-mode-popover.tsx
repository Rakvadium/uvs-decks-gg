import { LayoutGrid, List } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAvailableGallerySidebarContext } from "./context";
import type { SidebarGalleryViewMode } from "./hook";

const VIEW_MODE_ICONS: Record<SidebarGalleryViewMode, typeof LayoutGrid> = {
  card: LayoutGrid,
  list: List,
};

export function DeckDetailsGalleryViewModePopover() {
  const { viewMode, setViewMode } = useAvailableGallerySidebarContext();
  const CurrentViewIcon = VIEW_MODE_ICONS[viewMode];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-background/60 text-muted-foreground transition-colors",
            "hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
          )}
          aria-label="Change view mode"
        >
          <CurrentViewIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="end">
        <div className="space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">View Mode</span>

          <div className="flex gap-1">
            {(["card", "list"] as const).map((mode) => {
              const Icon = VIEW_MODE_ICONS[mode];

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-md border p-2 transition-all",
                    viewMode === mode
                      ? "border-primary/30 bg-primary/15 text-primary"
                      : "border-transparent hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-mono text-[10px] uppercase">{mode}</span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
