"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { FloatingIsland } from "@/components/shell/floating-island";
import { IconToolbarButton } from "@/components/ui/icon-toolbar-button";
import { useSlashToFocus } from "@/hooks/use-slash-to-focus";
import { useGalleryTopBarFiltersContext } from "../context";
import { AnchoredFilterPanel } from "./anchored-filter-panel";
import { FilterTokens } from "./filter-tokens";
import {
  InlineFunnelButton,
  InlineResultCount,
  InlineScopeSelect,
  InlineViewModeButton,
  ToolbarDivider,
} from "./toolbar-bits";

export function GalleryTopBarIslandVariant() {
  const { state, actions } = useGalleryTopBarFiltersContext();
  const inputRef = useRef<HTMLInputElement>(null);
  useSlashToFocus(inputRef);

  const placeholder =
    state.searchMode === "name"
      ? "Search by card name…"
      : state.searchMode === "text"
        ? "Search for card text…"
        : "Search all card information…";

  return (
    <FloatingIsland
      anchored={<AnchoredFilterPanel />}
      below={<FilterTokens centered className="pointer-events-auto" />}
    >
      <Search className="size-4 shrink-0 text-[color:var(--control-dual-mix)]" />
      <input
        ref={inputRef}
        type="text"
        value={state.search}
        onChange={(event) => actions.setSearch(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full min-w-0 flex-1 bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        name="gallery-search"
        aria-label="Search cards"
        autoComplete="off"
        spellCheck={false}
      />
      {state.search.length > 0 ? (
        <IconToolbarButton shape="island" label="Clear search" onClick={() => actions.setSearch("")}>
          <X />
        </IconToolbarButton>
      ) : (
        <kbd className="hidden shrink-0 select-none items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground lg:flex">
          /
        </kbd>
      )}
      <InlineScopeSelect shape="island" />
      <ToolbarDivider className="h-4" />
      <InlineResultCount className="hidden px-1 md:inline" />
      <ToolbarDivider className="h-4" />
      <InlineFunnelButton />
      <InlineViewModeButton />
    </FloatingIsland>
  );
}
