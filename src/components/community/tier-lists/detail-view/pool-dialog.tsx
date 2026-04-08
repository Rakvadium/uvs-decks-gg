"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCommunityTierListDetailContext } from "./context";

export function CommunityTierListDetailPoolDialog() {
  const {
    isPoolDialogOpen,
    setIsPoolDialogOpen,
    setSearch,
    setSetSearch,
    visibleSets,
    selectedSetCodes,
    toggleSetCode,
    sourceCards,
  } = useCommunityTierListDetailContext();

  return (
    <Dialog open={isPoolDialogOpen} onOpenChange={setIsPoolDialogOpen}>
      <DialogContent size="lg" className="overflow-hidden p-0">
        <div className="relative min-h-0 flex-1 overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Choose the Cards to Evaluate</DialogTitle>
            <DialogDescription>
              Select the sets that should feed the card pool for this tier list.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 pt-4">
            <Input
              value={setSearch}
              onChange={(event) => setSetSearch(event.target.value)}
              placeholder="Filter sets by code or name"
            />

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{selectedSetCodes.length} sets selected</Badge>
              <Badge variant="outline">{sourceCards.length} cards available</Badge>
            </div>

            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {visibleSets.map((set) => {
                const isSelected = selectedSetCodes.includes(set.code);

                return (
                  <button
                    key={set._id}
                    type="button"
                    onClick={() => toggleSetCode(set.code)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                      isSelected
                        ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_-10px_var(--primary)]"
                        : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{set.name}</p>
                      <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                        {set.code}
                        {set.cardCount ? ` / ${set.cardCount} cards` : ""}
                      </p>
                    </div>
                    <Badge variant={isSelected ? "default" : "outline"}>
                      {isSelected ? "Selected" : "Add Set"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </DialogBody>
        </div>
      </DialogContent>
    </Dialog>
  );
}
