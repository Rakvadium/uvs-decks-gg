"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LIST_SORT_SELECT_OPTIONS } from "./deck-list-utils";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

type DeckListSortSelectProps = {
  triggerClassName?: string;
};

export function DeckListSortSelect({ triggerClassName }: DeckListSortSelectProps) {
  const model = useDeckCardsSectionContext();

  return (
    <Select value={model.selectedListSortValue} onValueChange={model.onSelectSort}>
      <SelectTrigger size="sm" className={cn(triggerClassName)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LIST_SORT_SELECT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-[11px]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DeckDetailsDesktopListSort() {
  const model = useDeckCardsSectionContext();
  if (model.viewMode !== "list") return null;
  return (
    <DeckListSortSelect triggerClassName="h-8 max-h-8 w-full px-3 py-1.5 text-[11px] leading-none md:h-7 md:max-h-7 md:py-1 md:[&_svg]:size-3.5" />
  );
}
