"use client";

import { useMemo } from "react";
import { DeckVisibilityBadgeMenu } from "@/components/deck-details/deck-visibility-badge-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DeckVisibility } from "@/lib/deck/visibility";
import { deckVisibilityLabel, normalizeDeckVisibility } from "@/lib/deck/visibility";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

const VISIBILITY_OPTIONS: DeckVisibility[] = [
  "private",
  "share",
  "unlisted",
  "public",
  "tournament",
  "team",
];

export function DeckDetailsMetaPanel() {
  const {
    deck,
    isEditing,
    isOwner,
    isAdmin,
    startEditing,
    editDescription,
    editVisibility,
    editName,
    setEditDescription,
    setEditVisibility,
    setEditName,
  } = useDeckDetails();

  if (!deck) return null;

  const selectVisibilityOptions = useMemo(
    () =>
      VISIBILITY_OPTIONS.filter(
        (v) => v !== "tournament" || isAdmin || editVisibility === "tournament",
      ).filter((v) => v !== "team" || editVisibility === "team"),
    [isAdmin, editVisibility],
  );

  const handleVisibilitySelect = (value: DeckVisibility) => {
    if (!isEditing) startEditing();
    setEditVisibility(value);
  };

  return (
    <section className="min-w-0 flex-1 rounded-xl border border-border/50 bg-card/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="space-y-3">
        {isEditing ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="deck-name-mobile" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Deck Name
              </Label>
              <Input
                id="deck-name-mobile"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="h-9 font-display text-sm font-bold uppercase tracking-wide"
                placeholder="Deck name..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deck-description-mobile" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="deck-description-mobile"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={3}
                className="resize-none text-sm"
                placeholder="Describe your game plan..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deck-visibility-mobile" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Visibility
              </Label>
              <Select value={editVisibility} onValueChange={(v) => setEditVisibility(v as DeckVisibility)}>
                <SelectTrigger id="deck-visibility-mobile" className="h-9 w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectVisibilityOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {deckVisibilityLabel(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="line-clamp-2 text-lg font-display font-bold uppercase tracking-[0.16em] sm:text-xl" title={deck.name}>
                {deck.name}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <DeckVisibilityBadgeMenu
                  deck={deck}
                  isOwner={isOwner}
                  isEditing={false}
                  editVisibility={normalizeDeckVisibility(deck)}
                  onSelect={handleVisibilitySelect}
                  compact
                  canSetTournamentVisibility={isAdmin}
                />
                {deck.format ? (
                  <Badge variant="cyber" className="text-[10px]">
                    {deck.format}
                    {deck.subFormat ? ` / ${deck.subFormat}` : ""}
                  </Badge>
                ) : null}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {deck.description?.trim() ? deck.description : "No description yet."}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
