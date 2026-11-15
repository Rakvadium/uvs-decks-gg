"use client";

import { FileText, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { IconToolbarButton } from "@/components/ui/icon-toolbar-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGalleryFilterDialogContext } from "@/components/gallery/filter-dialog/context";
import { cn } from "@/lib/utils";
import { useGalleryTopBarFiltersContext } from "../context";
import { GalleryViewModeFields } from "../view-mode-popover";

const VIEW_MODE_ICONS = {
  card: LayoutGrid,
  list: List,
  details: FileText,
};

export function InlineFunnelButton() {
  const { meta, isFilterPanelOpen, setFilterPanelOpen } = useGalleryTopBarFiltersContext();

  return (
    <IconToolbarButton
      data-gallery-filter-panel-trigger=""
      shape="island"
      label="Toggle filter panel"
      active={isFilterPanelOpen}
      aria-expanded={isFilterPanelOpen}
      onClick={() => setFilterPanelOpen(!isFilterPanelOpen)}
    >
      <SlidersHorizontal className="size-4" />
      {meta.activeFilterCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold tabular-nums text-primary-foreground">
          {meta.activeFilterCount}
        </span>
      ) : null}
    </IconToolbarButton>
  );
}

export function InlineViewModeButton() {
  const { state } = useGalleryTopBarFiltersContext();
  const currentMode = state.viewMode;
  const CurrentIcon = VIEW_MODE_ICONS[currentMode] ?? LayoutGrid;

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <IconToolbarButton shape="island" label="Change view mode">
          <CurrentIcon />
        </IconToolbarButton>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="end" sideOffset={10}>
        <GalleryViewModeFields layout="popover" />
      </PopoverContent>
    </Popover>
  );
}

export function InlineResultCount({ className }: { className?: string }) {
  const { meta } = useGalleryFilterDialogContext();

  return (
    <span
      className={cn(
        "shrink-0 select-none text-[11px] tabular-nums text-muted-foreground",
        className
      )}
      title={`${meta.filteredCount.toLocaleString()} of ${meta.formatCardCount.toLocaleString()} cards`}
    >
      <span className="text-[color:var(--control-dual-mix)]">
        {meta.filteredCount.toLocaleString()}
      </span>
      <span className="mx-0.5 opacity-50">/</span>
      {meta.formatCardCount.toLocaleString()}
    </span>
  );
}

export function InlineScopeSelect({ className }: { className?: string }) {
  const { state, actions } = useGalleryTopBarFiltersContext();

  return (
    <Select
      value={state.searchMode}
      onValueChange={(value) => actions.setSearchMode(value as "name" | "text" | "all")}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "chrome-label-case h-6 min-w-[3.25rem] shrink-0 rounded-sm border-none bg-transparent px-1.5 py-0 text-[11px] text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--control-dual-ring)] focus-visible:shadow-none",
          className
        )}
        aria-label="Search scope"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="name">Name</SelectItem>
        <SelectItem value="text">Text</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ToolbarDivider({ className }: { className?: string }) {
  return <span className={cn("h-5 w-px shrink-0 bg-border/60", className)} aria-hidden />;
}
