"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Edit3,
  Globe,
  Loader2,
  Lock,
  Save,
  X,
} from "lucide-react";
import { AppPageHeader } from "@/components/shell/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
    editIsPublic,
    setEditIsPublic,
    cancelEditing,
    isSaving,
    saveEdits,
    startEditing,
    isOwner,
  } = useDeckDetailsTopBarContext();

  if (isLoading || !deck) {
    return null;
  }

  const displayIsPublic = isEditing ? editIsPublic : deck.isPublic;

  const handlePublicitySelect = (value: boolean) => {
    if (!isEditing) startEditing();
    setEditIsPublic(value);
  };

  const publicityBadge = (
    <Badge
      variant={displayIsPublic ? "default" : "outline"}
      className={cn(
        "h-8 shrink-0 items-center gap-1.5 px-2.5 text-[9px] inline-flex",
        isOwner && "cursor-pointer"
      )}
    >
      {displayIsPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {displayIsPublic ? "Public" : "Private"}
      {isOwner ? <ChevronDown className="h-3 w-3 opacity-70" /> : null}
    </Badge>
  );

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
      {isOwner ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 appearance-none border-0 bg-transparent p-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              {publicityBadge}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handlePublicitySelect(false)}>
              <Lock className="h-4 w-4" />
              Private
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePublicitySelect(true)}>
              <Globe className="h-4 w-4" />
              Public
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        publicityBadge
      )}
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
