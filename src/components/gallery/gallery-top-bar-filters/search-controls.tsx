import { Search } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GallerySearchField } from "@/components/ui/gallery-search-field";
import { useGalleryTopBarFiltersContext } from "./context";

export function GallerySearchControls() {
  const { state, actions } = useGalleryTopBarFiltersContext();
  const isMobile = useIsMobile();

  const placeholder =
    state.searchMode === "name"
      ? "Search by name…"
      : state.searchMode === "text"
        ? "Search card text…"
        : "Search all fields…";

  if (isMobile) {
    return (
      <GallerySearchField
        placeholder={placeholder}
        value={state.search}
        onChange={(event) => actions.setSearch(event.target.value)}
        onClear={() => actions.setSearch("")}
        name="gallery-search"
        spellCheck={false}
      />
    );
  }

  return (
    <GallerySearchField
      placeholder={placeholder}
      value={state.search}
      onChange={(event) => actions.setSearch(event.target.value)}
      onClear={() => actions.setSearch("")}
      name="gallery-search"
      spellCheck={false}
      leadingSlot={
        <div className="absolute left-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
          <Search className="ml-1 h-4 w-4 text-primary/70" />
          <Select
            value={state.searchMode}
            onValueChange={(value) => actions.setSearchMode(value as "name" | "text" | "all")}
          >
            <SelectTrigger
              size="sm"
              className="mx-1 h-7 min-w-[3.5rem] rounded-sm border-x border-y-0 border-primary/40 bg-transparent px-2 py-0 text-xs shadow-none focus-visible:ring-0 focus-visible:shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      inputClassName="pl-[6.5rem] pr-3"
    />
  );
}
