"use client";

import { Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent
        size="md"
        className="overflow-hidden p-0"
        showCloseButton={false}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline" className="h-11 px-6">
                Close
              </Button>
            </DialogClose>
            <Button className="h-11 px-6" onClick={() => void handleCreate()} disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </>
        }
      >
        <div className="relative flex min-h-0 flex-col">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-10 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-16 right-10 h-24 w-24 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto p-6">
            <DialogHeader className="border-border/20 pb-4">
              <DialogTitle className="text-xl">Create New Tier List</DialogTitle>
              <DialogDescription>
                Choose whether this list is just for fun or should count toward a community ranking. New lists start private.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-5 pt-4">
              <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                List name
              </label>
              <div className="relative mt-2">
                <PenLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  placeholder="Tier list name..."
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  className="h-12 border-border/60 bg-background/40 pl-10 text-base focus-visible:ring-primary/25"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleCreate();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  Ranking scope
                </label>

                <div className="grid gap-3">
                  {CREATE_SCOPE_OPTIONS.map((option) => {
                    const isSelected = newRankingScope === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewRankingScope(option.value)}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left transition-all",
                          isSelected
                            ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_-10px_var(--primary)]"
                            : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{getRankingScopeLabel(option.value)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex h-3 w-3 shrink-0 rounded-full border transition-colors",
                              isSelected ? "border-primary bg-primary" : "border-border/60 bg-transparent"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </DialogBody>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
