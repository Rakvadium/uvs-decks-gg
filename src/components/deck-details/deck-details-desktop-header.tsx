"use client";

import Link from "next/link";
import { ArrowLeft, Edit3, Loader2, Save, X } from "lucide-react";
import { AppPageHeader } from "@/components/shell/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeckVisibilityBadgeMenu } from "@/components/deck-details/deck-visibility-badge-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DeckVisibility } from "@/lib/deck/visibility";
import { useDeckDetailsTopBarContext } from "./deck-details-top-bar/context";
import { DeckDetailsTopBarDeleteAction } from "./deck-details-top-bar/delete-action";
import { DeckDetailsTopBarViewActions } from "./deck-details-top-bar/view-actions";

export function DeckDetailsDesktopHeader() {
  const {
    deck,
    isLoading,
    isEditing,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editVisibility,
    setEditVisibility,
    cancelEditing,
    isSaving,
    saveEdits,
    startEditing,
    isOwner,
    isAdmin,
  } = useDeckDetailsTopBarContext();

  if (isLoading || !deck) {
    return null;
  }

  const handleVisibilitySelect = (value: DeckVisibility) => {
    if (!isEditing) startEditing();
    setEditVisibility(value);
  };

  const titleNode = isEditing ? (
    <Input
      value={editName}
      onChange={(event) => setEditName(event.target.value)}
      className="h-11 max-w-2xl text-xl font-semibold tracking-tight md:text-2xl"
      placeholder="Deck name"
    />
  ) : (
    <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{deck.name}</h1>
  );

  const descriptionNode = isEditing ? (
    <Textarea
      value={editDescription}
      onChange={(event) => setEditDescription(event.target.value)}
      placeholder="Add a short description…"
      className="min-h-[4.5rem] max-w-2xl resize-y text-sm"
    />
  ) : (
    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
      {deck.description?.trim()
        ? deck.description
        : "No description yet."}
    </p>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" className="gap-2" asChild>
        <Link href="/decks">
          <ArrowLeft className="h-4 w-4" />
          All decks
        </Link>
      </Button>
      {deck.format ? (
        <Badge variant="cyber" className="h-8 items-center text-[9px]">
          {deck.format}
          {deck.subFormat ? ` / ${deck.subFormat}` : ""}
        </Badge>
      ) : null}
      <DeckVisibilityBadgeMenu
        deck={deck}
        isOwner={isOwner}
        isEditing={isEditing}
        editVisibility={editVisibility}
        onSelect={handleVisibilitySelect}
        canSetTournamentVisibility={isAdmin}
      />
    </div>
  );

  const actions = isOwner ? (
    <div className="flex flex-wrap items-center gap-2">
      {isEditing ? (
        <>
          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => void saveEdits()}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={cancelEditing}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <DeckDetailsTopBarDeleteAction />
        </>
      ) : (
        <>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={startEditing}>
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
          <DeckDetailsTopBarViewActions />
        </>
      )}
    </div>
  ) : null;

  return (
    <AppPageHeader
      title={titleNode}
      description={descriptionNode}
      toolbar={toolbar}
      actions={actions}
    />
  );
}
