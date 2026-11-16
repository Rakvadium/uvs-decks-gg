import { ChevronDown, FileText, LayoutGrid, List, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { OptionTile } from "@/components/ui/option-tile";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { useGalleryTopBarFiltersContext } from "./context";

type ViewMode = "card" | "list" | "details";

const VIEW_MODE_ICONS: Record<ViewMode, LucideIcon> = {
  card: LayoutGrid,
  list: List,
  details: FileText,
};

export function ViewModeOptions<Mode extends ViewMode>({
  modes,
  value,
  onValueChange,
}: {
  modes: readonly Mode[];
  value: Mode;
  onValueChange: (mode: Mode) => void;
}) {
  return (
    <div className="flex gap-1">
      {modes.map((mode) => {
        const Icon: LucideIcon = VIEW_MODE_ICONS[mode];
        return (
          <OptionTile
            key={mode}
            variant="ghost"
            selected={value === mode}
            onClick={() => onValueChange(mode)}
            className="flex flex-1 flex-col items-center gap-1 p-2"
          >
            <Icon className="size-4" />
            <span className="chrome-label-case text-[10px]">{mode}</span>
          </OptionTile>
        );
      })}
    </div>
  );
}

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
      <ViewModeOptions modes={availableModes} value={currentMode} onValueChange={actions.setViewMode} />

      {currentMode === "card" ? (
        <div className="space-y-2 border-t border-hairline pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Cards per row</span>
            <span className="text-xs text-[color:var(--control-dual-mix)]">{state.cardsPerRow}</span>
          </div>
          {isMobile ? (
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2].map((value) => (
                <OptionTile
                  key={`mobile-cards-per-row-${value}`}
                  selected={state.cardsPerRow === value}
                  onClick={() => actions.setCardsPerRow(value)}
                  className="chrome-label-case px-2 py-1 text-xs"
                >
                  {value}
                </OptionTile>
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
          <span className="chrome-label-case text-xs text-muted-foreground">View Mode</span>
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
      <span className="chrome-label-case text-xs text-muted-foreground">View Mode</span>
      {modeAndDensity}
    </div>
  );
}

