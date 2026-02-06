import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGalleryTopBarFiltersContext } from "./context";

export function GallerySearchControls() {
  const { state, actions } = useGalleryTopBarFiltersContext();

  return (
    <>
      <div className="absolute left-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
        <Search className="ml-1 h-4 w-4 text-primary/70" />
        <Select
          value={state.searchMode}
          onValueChange={(value) => actions.setSearchMode(value as "name" | "text" | "all")}
        >
          <SelectTrigger
            size="sm"
            className="mx-1 h-6 min-w-[3.5rem] rounded-none border-x-1 border-y-0 border-primary/40 px-2 py-0 text-[10px] shadow-none focus-visible:ring-0 focus-visible:shadow-none"
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

      <Input
        placeholder={
          state.searchMode === "name"
            ? "Search by name…"
            : state.searchMode === "text"
              ? "Search card text…"
              : "Search all fields…"
        }
        value={state.search}
        onChange={(event) => actions.setSearch(event.target.value)}
        className="h-9 border-primary/40 bg-background/50 pl-[6.5rem] pr-20 text-sm shadow-[0_0_10px_-3px_var(--primary)] focus-visible:border-primary focus-visible:shadow-[0_0_15px_-3px_var(--primary)]"
        name="gallery-search"
        spellCheck={false}
      />
    </>
  );
}
