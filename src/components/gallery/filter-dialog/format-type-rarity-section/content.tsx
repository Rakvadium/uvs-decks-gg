import { FormatRow } from "./format-row";
import { Panel } from "@/components/ui/panel";
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
      <span className="chrome-label-case w-16 shrink-0 text-[10px] text-muted-foreground">
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
      <div className="space-y-3">
        <Panel className="space-y-3 p-3">
          <FormatRow />
        </Panel>
        <Panel className="space-y-3 p-3">
          <TypeRow />
        </Panel>
        <Panel className="space-y-3 p-3">
          <RarityRow />
        </Panel>
      </div>
    );
  }

  return (
    <Panel className="space-y-2.5 p-2.5">
      <SearchModeRow />
      <FormatRow />
      <TypeRow />
    </Panel>
  );
}
