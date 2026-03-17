import { FormatRow } from "./format-row";
import { RarityRow } from "./rarity-row";
import { TypeRow } from "./type-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGalleryFilterDialogContext } from "../context";
import { useIsMobile } from "@/hooks/useIsMobile";

function SearchModeRow() {
  const { state, actions } = useGalleryFilterDialogContext();

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Search In
      </span>
      <Select
        value={state.searchMode}
        onValueChange={(value) => actions.setSearchMode(value as "name" | "text" | "all")}
      >
        <SelectTrigger size="sm" className="h-8 w-full text-[10px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="text">Text</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function FormatTypeRaritySection() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="space-y-3 rounded-lg border border-border/50 bg-card/30 p-3 backdrop-blur-sm">
        <FormatRow />
        <TypeRow />
        <RarityRow />
      </div>
    );
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-border/50 bg-card/30 p-2.5 backdrop-blur-sm">
      <SearchModeRow />
      <FormatRow />
      <TypeRow />
    </div>
  );
}
