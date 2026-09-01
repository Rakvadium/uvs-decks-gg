"use client";

import { FileText, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
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

export const variantPopoverClassName =
  "z-[200] border border-[color:var(--control-dual-border)] bg-popover/95 p-3 shadow-[var(--chrome-popover-shadow),var(--popover-dual-glow)] backdrop-blur-lg outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";

const inlineControlClassName =
  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[color:var(--control-dual-mix)] transition-colors hover:bg-[color:var(--control-dual-surface-hover)] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--control-dual-ring)]";

const VIEW_MODE_ICONS = {
  card: LayoutGrid,
  list: List,
  details: FileText,
};

export function InlineFunnelButton({ className }: { className?: string }) {
  const { meta, isFilterPanelOpen, setFilterPanelOpen } = useGalleryTopBarFiltersContext();

  return (
    <button
      type="button"
      data-gallery-filter-panel-trigger=""
      className={cn(
        inlineControlClassName,
        isFilterPanelOpen && "bg-[color:var(--control-dual-surface-hover)] text-primary",
        className
      )}
      aria-label="Toggle filter panel"
      aria-expanded={isFilterPanelOpen}
      onClick={() => setFilterPanelOpen(!isFilterPanelOpen)}
    >
      <SlidersHorizontal className="size-4" />
      {meta.activeFilterCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold tabular-nums text-primary-foreground">
          {meta.activeFilterCount}
        </span>
      ) : null}
    </button>
  );
}

export function InlineViewModeButton({ className }: { className?: string }) {
  const { state } = useGalleryTopBarFiltersContext();
  const currentMode = state.viewMode;
  const CurrentIcon = VIEW_MODE_ICONS[currentMode] ?? LayoutGrid;

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(inlineControlClassName, className)}
          aria-label="Change view mode"
        >
          <CurrentIcon className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(variantPopoverClassName, "w-52")} align="end" sideOffset={10}>
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
      title={`${meta.filteredCount.toLocaleString()} of ${meta.totalCards.toLocaleString()} cards`}
    >
      <span className="text-[color:var(--control-dual-mix)]">
        {meta.filteredCount.toLocaleString()}
      </span>
      <span className="mx-0.5 opacity-50">/</span>
      {meta.totalCards.toLocaleString()}
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
