import { LayoutGrid, List, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAvailableGallerySidebarContext } from "./context";
import type { SidebarGalleryViewMode } from "./hook";

export function DeckDetailsGallerySidebarHeader() {
  const { gallery, viewMode, setViewMode, setIsFilterDialogOpen } = useAvailableGallerySidebarContext();
  const { state, actions, meta } = gallery;

  return (
    <div className="shrink-0 space-y-3 border-b border-border/40 px-3 py-3">
      <div className="flex items-center gap-2">
        <div className="relative flex min-w-0 flex-1 items-center">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/70" />
          <Select value={state.searchMode} onValueChange={(value) => actions.setSearchMode(value as "name" | "text" | "all")}>
            <SelectTrigger
              size="sm"
              className="absolute left-7 top-1/2 h-6 w-[60px] -translate-y-1/2 rounded-none border-x border-y-0 border-primary/30 bg-transparent px-1 font-mono text-[10px] shadow-none focus-visible:ring-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={state.search}
            onChange={(event) => actions.setSearch(event.target.value)}
            placeholder="Search cards..."
            className="h-8 pl-[5.9rem] pr-2 text-xs"
          />
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative h-8 w-8 shrink-0"
          onClick={() => setIsFilterDialogOpen(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {meta.activeFilterCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[9px]">{meta.activeFilterCount}</Badge>
          ) : null}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {meta.filteredCount.toLocaleString()} cards
        </div>

        <div className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/30 p-0.5">
          {(["card", "list"] as SidebarGalleryViewMode[]).map((mode) => {
            const Icon = mode === "card" ? LayoutGrid : List;
            const isActive = viewMode === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={
                  isActive
                    ? "flex items-center gap-1 rounded bg-primary/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary transition-colors"
                    : "flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {mode}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
