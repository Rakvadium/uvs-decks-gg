import { ChevronDown, FileText, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

  const modeAndDensity = (
    <>
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
                  ? "border-[color:var(--control-dual-border-strong)] bg-[color:var(--control-dual-surface-hover)] text-primary shadow-[0_0_14px_-6px_color-mix(in_oklch,var(--secondary)_30%,transparent)] [&_svg]:text-secondary/90"
                  : "border-transparent hover:border-[color:var(--control-dual-border)] hover:bg-muted"
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
            <span className="font-mono text-xs text-[color:var(--control-dual-mix)]">{state.cardsPerRow}</span>
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
                      ? "border-[color:var(--control-dual-border-strong)] bg-[color:var(--control-dual-surface-hover)] text-primary"
                      : "border-[color:var(--control-dual-border)] text-muted-foreground hover:bg-muted hover:border-[color:var(--control-dual-border-strong)]"
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
    </>
  );

  if (layout === "panel") {
    return (
      <Collapsible
        defaultOpen={false}
        className="rounded-lg border border-[color:var(--control-dual-border)] bg-muted/20"
      >
        <CollapsibleTrigger
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 p-3 text-left outline-none",
            "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "[&[data-state=open]_svg]:rotate-180"
          )}
        >
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">View Mode</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 px-3 pb-3">{modeAndDensity}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">View Mode</span>
      {modeAndDensity}
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
                ? "h-9 w-9 border border-[color:var(--control-dual-border)] bg-background/50 text-muted-foreground shadow-[var(--chrome-search-field-shadow)] hover:border-[color:var(--control-dual-border-strong)] hover:bg-[color:var(--control-dual-surface-hover)] hover:text-foreground"
                : "h-9 w-9 border border-[color:var(--control-dual-border)] bg-background/50 text-muted-foreground shadow-[var(--chrome-search-field-shadow)] hover:border-[color:var(--control-dual-border-strong)] hover:bg-muted hover:text-foreground"
            )}
            aria-label="Change view mode"
          >
            <CurrentViewIcon className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="z-[200] w-48 border-[color:var(--control-dual-border)] p-3 shadow-[var(--chrome-popover-shadow),var(--popover-dual-glow)]"
        align="end"
      >
        <GalleryViewModeFields layout="popover" />
      </PopoverContent>
    </Popover>
  );
}
