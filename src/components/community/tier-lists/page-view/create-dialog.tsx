"use client";

import { ListOrdered } from "lucide-react";
import { CreateEntityDialog, createEntityLabelClassName } from "@/components/ui/create-entity-dialog";
import { OptionTile } from "@/components/ui/option-tile";
import { cn } from "@/lib/utils";
import { useCommunityTierListsPageContext } from "./context";
import {
  COMMUNITY_TIER_RANKING,
  getRankingScopeLabel,
  type CommunityTierRankingScope,
} from "../../../../../shared/app-config";

const CREATE_SCOPE_OPTIONS: Array<{
  value: CommunityTierRankingScope;
  description: string;
}> = [
  {
    value: COMMUNITY_TIER_RANKING.scopes.unranked,
    description: "Fully custom lanes. Never affects community rankings.",
  },
  {
    value: COMMUNITY_TIER_RANKING.scopes.global,
    description: "Fixed S-F lanes. Counts toward the global community ranking once public.",
  },
  {
    value: COMMUNITY_TIER_RANKING.scopes.setScope,
    description: "Fixed S-F lanes. Counts only inside the selected set scope once public.",
  },
];

export function CommunityTierListsPageCreateDialog() {
  const {
    isCreateOpen,
    setIsCreateOpen,
    newListName,
    setNewListName,
    newRankingScope,
    setNewRankingScope,
    isCreating,
    handleCreate,
  } = useCommunityTierListsPageContext();

  return (
    <CreateEntityDialog
      open={isCreateOpen}
      onOpenChange={setIsCreateOpen}
      icon={ListOrdered}
      title="Create New Tier List"
      description="Choose whether this list is just for fun or should count toward a community ranking. New lists start private."
      name={{
        id: "create-tier-list-name",
        label: "List name",
        placeholder: "Tier list name...",
        value: newListName,
        onChange: setNewListName,
      }}
      submitLabel="Create"
      submitting={isCreating}
      onSubmit={() => void handleCreate()}
    >
      <div className="space-y-2">
        <p className={createEntityLabelClassName}>Ranking scope</p>

        <div className="grid gap-3">
          {CREATE_SCOPE_OPTIONS.map((option) => {
            const isSelected = newRankingScope === option.value;

            return (
              <OptionTile
                key={option.value}
                selected={isSelected}
                onClick={() => setNewRankingScope(option.value)}
                className="px-4 py-3 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{getRankingScopeLabel(option.value)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex h-3 w-3 shrink-0 rounded-full border transition-colors",
                      isSelected ? "border-(--selected-border) bg-(--selected-fg)" : "border-surface bg-transparent"
                    )}
                  />
                </div>
              </OptionTile>
            );
          })}
        </div>
      </div>
    </CreateEntityDialog>
  );
}
