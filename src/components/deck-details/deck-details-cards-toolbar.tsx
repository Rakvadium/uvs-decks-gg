"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIST_SORT_SELECT_OPTIONS } from "./deck-list-utils";
import { useDeckCardsSectionContext } from "./deck-details-cards-section-context";

export function DeckCardsToolbar() {
  const model = useDeckCardsSectionContext();

  if (model.viewMode !== "list") return null;

  return (
    <div className="pb-1 flex justify-end">
      <Select value={model.selectedListSortValue} onValueChange={model.onSelectSort}>
        <SelectTrigger className="h-7 w-[180px] text-[11px]">
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
    </div>
  );
}
