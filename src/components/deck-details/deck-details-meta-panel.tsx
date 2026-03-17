"use client";

import { Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeckDetails } from "@/providers/DeckDetailsProvider";

export function DeckDetailsMetaPanel() {
  const {
    deck,
    isEditing,
    editDescription,
    editIsPublic,
    editName,
    setEditDescription,
    setEditIsPublic,
    setEditName,
  } = useDeckDetails();

  if (!deck) return null;

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

            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <div className="space-y-0.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Visibility</p>
                <p className="text-xs">{editIsPublic ? "Public deck" : "Private deck"}</p>
              </div>
              <Switch checked={editIsPublic} onCheckedChange={setEditIsPublic} aria-label="Toggle deck visibility" />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="line-clamp-2 text-lg font-display font-bold uppercase tracking-[0.16em] sm:text-xl" title={deck.name}>
                {deck.name}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={deck.isPublic ? "default" : "outline"} className="text-[10px]">
                  {deck.isPublic ? <Globe className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                  {deck.isPublic ? "Public" : "Private"}
                </Badge>
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
