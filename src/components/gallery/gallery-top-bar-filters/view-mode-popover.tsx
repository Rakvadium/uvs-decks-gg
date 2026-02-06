import { FileText, LayoutGrid, List } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useGalleryTopBarFiltersContext } from "./context";

const VIEW_MODE_ICONS = {
  card: LayoutGrid,
  list: List,
  details: FileText,
};

export function GalleryViewModePopover() {
  const { state, actions } = useGalleryTopBarFiltersContext();
  const CurrentViewIcon = VIEW_MODE_ICONS[state.viewMode];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Change view mode"
        >
          <CurrentViewIcon className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="end">
        <div className="space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">View Mode</span>

          <div className="flex gap-1">
            {(["card", "list", "details"] as const).map((mode) => {
              const Icon = VIEW_MODE_ICONS[mode];

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => actions.setViewMode(mode)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-md border p-2 transition-all",
                    state.viewMode === mode
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

          {state.viewMode === "card" ? (
            <div className="space-y-2 border-t border-border/30 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">Cards per row</span>
                <span className="font-mono text-xs text-primary">{state.cardsPerRow}</span>
              </div>
              <Slider
                min={3}
                max={10}
                step={1}
                value={[state.cardsPerRow]}
                onValueChange={([value]) => actions.setCardsPerRow(value)}
              />
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
