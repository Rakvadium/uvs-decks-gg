import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGalleryFilterDialogContext } from "./context";

export function GalleryFilterDialogHeader() {
  const { actions, hasActiveFilters, meta } = useGalleryFilterDialogContext();

  return (
    <div className="relative z-10 shrink-0 border-b border-border/30 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex flex-1 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/20 shadow-[0_0_12px_-3px_var(--primary)]">
            <Filter className="h-4 w-4 text-primary drop-shadow-[0_0_4px_var(--primary)]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-display font-bold uppercase tracking-wide">Filter Cards</h2>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {meta.filteredCount.toLocaleString()} of {meta.totalCards.toLocaleString()} cards
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {hasActiveFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={actions.clearAllFilters}
              className="hidden gap-2 border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/10 md:flex"
            >
              <X className="h-3.5 w-3.5" />
              <span className="text-xs font-mono uppercase tracking-wider">Clear All</span>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
