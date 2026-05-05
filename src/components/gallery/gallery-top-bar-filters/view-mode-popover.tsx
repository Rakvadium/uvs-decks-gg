import { FileText, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { galleryToolbarControlClassName } from "@/components/ui/gallery-search-field";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { useGalleryTopBarFiltersContext } from "./context";

const VIEW_MODE_ICONS = {
  card: LayoutGrid,
  list: List,
  details: FileText,
};

export function GalleryViewModeFields({
  layout = "popover",
}: {
  layout?: "popover" | "panel";
}) {
  const { state, actions } = useGalleryTopBarFiltersContext();
  const isMobile = useIsMobile();
  const availableModes = isMobile
    ? (["card", "list"] as const)
    : (["card", "list", "details"] as const);
  const currentMode = isMobile && state.viewMode === "details" ? "list" : state.viewMode;

  return (
    <div className={cn("space-y-3", layout === "panel" && "rounded-lg border border-border/40 bg-muted/20 p-3")}>
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">View Mode</span>

      <div className="flex gap-1">
        {availableModes.map((mode) => {
          const Icon = VIEW_MODE_ICONS[mode];

          return (
            <button
              key={mode}
              type="button"
              onClick={() => actions.setViewMode(mode)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-md border p-2 transition-all",
                currentMode === mode
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

      {currentMode === "card" ? (
        <div className="space-y-2 border-t border-border/30 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Cards per row</span>
            <span className="font-mono text-xs text-primary">{state.cardsPerRow}</span>
          </div>
          {isMobile ? (
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2].map((value) => (
                <button
                  key={`mobile-cards-per-row-${value}`}
                  type="button"
                  onClick={() => actions.setCardsPerRow(value)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-mono uppercase tracking-wider transition-colors",
                    state.cardsPerRow === value
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : (
            <Slider
              min={3}
              max={10}
              step={1}
              value={[state.cardsPerRow]}
              onValueChange={([value]) => actions.setCardsPerRow(value)}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function GalleryViewModePopover({ triggerStyle = "icon" }: { triggerStyle?: "icon" | "labeled" }) {
  const { state } = useGalleryTopBarFiltersContext();
  const isMobile = useIsMobile();
  const currentMode = isMobile && state.viewMode === "details" ? "list" : state.viewMode;
  const CurrentViewIcon = VIEW_MODE_ICONS[currentMode];

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        {triggerStyle === "labeled" ? (
          <Button
            type="button"
            variant="outline"
            className={cn(galleryToolbarControlClassName, "shrink-0 gap-1.5 px-4")}
            aria-label="Change view mode"
          >
            <CurrentViewIcon className="size-4 shrink-0" />
            View mode
          </Button>
        ) : (
          <button
            type="button"
            className={cn(
              "flex items-center justify-center rounded-md transition-colors",
              isMobile
                ? "h-9 w-9 border border-primary/40 bg-background/50 text-muted-foreground shadow-[var(--chrome-search-field-shadow)] hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                : "h-9 w-9 border border-primary/40 bg-background/50 text-muted-foreground shadow-[var(--chrome-search-field-shadow)] hover:border-primary/50 hover:bg-muted hover:text-foreground"
            )}
            aria-label="Change view mode"
          >
            <CurrentViewIcon className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="z-[200] w-48 p-3" align="end">
        <GalleryViewModeFields layout="popover" />
      </PopoverContent>
    </Popover>
  );
}
