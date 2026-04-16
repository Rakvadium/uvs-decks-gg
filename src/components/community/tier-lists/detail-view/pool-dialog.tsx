"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCardData } from "@/lib/universus/card-data-provider";
import { formatTierListPoolScopeLabel } from "../utils";
import { tierListPoolScopeKey } from "../../../../../shared/tier-list-pool";
import { useCommunityTierListDetailContext } from "./context";

export function CommunityTierListDetailPoolDialog() {
  const {
    isPoolDialogOpen,
    setIsPoolDialogOpen,
    setSearch,
    setSetSearch,
    visibleSets,
    poolScopes,
    addPoolScope,
    removePoolScope,
    sourceCards,
  } = useCommunityTierListDetailContext();

  const { cards } = useCardData();
  const [draftSetCode, setDraftSetCode] = useState("");
  const [draftCardType, setDraftCardType] = useState("");

  useEffect(() => {
    if (!draftSetCode || visibleSets.some((set) => set.code === draftSetCode)) {
      return;
    }
    setDraftSetCode(visibleSets[0]?.code ?? "");
  }, [draftSetCode, visibleSets]);

  useEffect(() => {
    if (!isPoolDialogOpen || draftSetCode || !visibleSets[0]?.code) {
      return;
    }
    setDraftSetCode(visibleSets[0].code);
  }, [draftSetCode, isPoolDialogOpen, visibleSets]);

  const typesForDraftSet = useMemo(() => {
    if (!draftSetCode) {
      return [] as string[];
    }
    const types = new Set<string>();
    for (const card of cards) {
      if (card.isFrontFace === false || card.isVariant === true) {
        continue;
      }
      if (card.setCode !== draftSetCode || !card.type) {
        continue;
      }
      types.add(card.type);
    }
    return Array.from(types).sort((left, right) => left.localeCompare(right));
  }, [cards, draftSetCode]);

  const draftSetName = useMemo(
    () => visibleSets.find((set) => set.code === draftSetCode)?.name,
    [draftSetCode, visibleSets]
  );

  const handleAddScope = () => {
    if (!draftSetCode || !draftCardType) {
      return;
    }
    addPoolScope({ setCode: draftSetCode, cardType: draftCardType });
  };

  return (
    <Dialog
      open={isPoolDialogOpen}
      onOpenChange={(open) => {
        setIsPoolDialogOpen(open);
        if (open) {
          const first = visibleSets[0]?.code ?? "";
          setDraftSetCode(first);
          setDraftCardType("");
        }
      }}
    >
      <DialogContent size="lg" className="overflow-hidden p-0">
        <div className="relative min-h-0 flex-1 overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Choose the Cards to Evaluate</DialogTitle>
            <DialogDescription>
              Pick a set, then a card type from that set. Add multiple rows to combine scopes (for example several
              types from the same set).
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 pt-4">
            <Input
              value={setSearch}
              onChange={(event) => setSetSearch(event.target.value)}
              placeholder="Filter sets by code or name"
            />

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{poolScopes.length} pool {poolScopes.length === 1 ? "rule" : "rules"}</Badge>
              <Badge variant="outline">{sourceCards.length} cards available</Badge>
            </div>

            {poolScopes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  Active pool
                </p>
                <ul className="max-h-[28vh] space-y-2 overflow-y-auto pr-1">
                  {poolScopes.map((scope) => (
                    <li
                      key={tierListPoolScopeKey(scope)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2"
                    >
                      <span className="min-w-0 text-sm">
                        {formatTierListPoolScopeLabel(
                          scope,
                          visibleSets.find((set) => set.code === scope.setCode)?.name
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removePoolScope(scope)}
                        aria-label="Remove pool rule"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-3 rounded-xl border border-border/50 bg-card/40 p-4">
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Add to pool</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">Set</p>
                  <Select value={draftSetCode || undefined} onValueChange={setDraftSetCode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a set" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleSets.map((set) => (
                        <SelectItem key={set._id} value={set.code}>
                          {set.name} ({set.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">Card type</p>
                  <Select
                    value={draftCardType || undefined}
                    onValueChange={setDraftCardType}
                    disabled={!draftSetCode || typesForDraftSet.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !draftSetCode
                            ? "Choose a set first"
                            : typesForDraftSet.length === 0
                              ? "No typed cards in set"
                              : "Choose type"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {typesForDraftSet.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  className={cn("h-10 shrink-0 sm:w-auto")}
                  onClick={handleAddScope}
                  disabled={!draftSetCode || !draftCardType}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              {draftSetCode && draftSetName ? (
                <p className="text-xs text-muted-foreground">
                  Types listed are from {draftSetName} in your local card cache. Lists with only backs or missing type
                  data may look empty until those cards are available.
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Lists created before this change used entire sets; they may show as one “All types” rule per set. Remove
              those and add set + type rows here to narrow the pool.
            </div>
          </DialogBody>
        </div>
      </DialogContent>
    </Dialog>
  );
}
