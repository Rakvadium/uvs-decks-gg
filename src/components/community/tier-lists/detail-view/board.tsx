"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useCommunityTierListDetailContext } from "./context";
import { CommunityTierListLaneRow } from "./lane-row";

export function CommunityTierListDetailBoard() {
  const { canEdit, addTier, tiers, isRankedScope } = useCommunityTierListDetailContext();

  return (
    <Card className="border-border/60 bg-card/75 shadow-[0_18px_50px_-38px_rgba(0,0,0,0.8)]">
      <CardHeader className="space-y-3 pb-0 pt-6">
        <div className="md:hidden">
          <CardDescription>
            {canEdit
              ? isRankedScope
                ? "Drag cards into the fixed S-F lanes and rankings save automatically as you go."
                : "Drag cards into lanes and your rankings save automatically as you go."
              : "Browse the published lane breakdown for this tier list."}
          </CardDescription>
        </div>
        {canEdit && !isRankedScope ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4" />
              Add Tier
            </Button>
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {tiers.map((tier) => (
            <CommunityTierListLaneRow key={tier.id} tier={tier} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
