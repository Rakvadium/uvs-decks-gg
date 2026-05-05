"use client";

import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import type { DeckTeamSharing, DeckVisibility } from "@/lib/deck/visibility";
import {
  deckTeamSharingLabel,
  deckVisibilityLabel,
} from "@/lib/deck/visibility";
import { useDeckDetailsTopBarContext } from "./deck-details-top-bar/context";
import { DeckDetailsTopBarDeleteAction } from "./deck-details-top-bar/delete-action";

type VisibilityRow = Exclude<DeckVisibility, "team"> | "team_view" | "team_edit";

const BASE_VISIBILITY_ORDER: Exclude<DeckVisibility, "team" | "tournament">[] = [
  "private",
  "share",
  "unlisted",
  "public",
];

function visibilityRowValue(visibility: DeckVisibility, teamSharing: DeckTeamSharing): VisibilityRow {
  if (visibility === "team") {
    return teamSharing === "team_editable" ? "team_edit" : "team_view";
  }
  return visibility;
}

function applyVisibilityRow(
  row: VisibilityRow,
): { visibility: DeckVisibility; teamCollaboration?: DeckTeamSharing } {
  if (row === "team_view") {
    return { visibility: "team", teamCollaboration: "team_viewable" };
  }
  if (row === "team_edit") {
    return { visibility: "team", teamCollaboration: "team_editable" };
  }
  return { visibility: row };
}

function rowLabel(row: VisibilityRow): string {
  if (row === "team_view") return deckTeamSharingLabel("team_viewable");
  if (row === "team_edit") return deckTeamSharingLabel("team_editable");
  return deckVisibilityLabel(row);
}

export function DeckDetailsEditDialog() {
  const {
    deck,
    isOwner,
    isEditing,
    cancelEditing,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editVisibility,
    setEditVisibility,
    editTeamCollaboration,
    setEditTeamCollaboration,
    saveEdits,
    isSaving,
    isAdmin,
    canSetTeamVisibility,
  } = useDeckDetailsTopBarContext();

  const dialogOpen = Boolean(isOwner && isEditing);

  const selectVisibilityOptions = useMemo((): VisibilityRow[] => {
    const rows: VisibilityRow[] = [...BASE_VISIBILITY_ORDER];
    if (isAdmin || editVisibility === "tournament") {
      rows.push("tournament");
    }
    if (canSetTeamVisibility || editVisibility === "team") {
      rows.push("team_view", "team_edit");
    }
    return rows;
  }, [isAdmin, editVisibility, canSetTeamVisibility]);

  const selectRowValue = visibilityRowValue(editVisibility, editTeamCollaboration);

  const handleVisibilityRowChange = (row: VisibilityRow) => {
    const parsed = applyVisibilityRow(row);
    setEditVisibility(parsed.visibility);
    if (parsed.teamCollaboration !== undefined) {
      setEditTeamCollaboration(parsed.teamCollaboration);
    }
  };

  if (!isOwner || !deck) return null;

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) {
          cancelEditing();
        }
      }}
    >
      <DialogContent
        size="md"
        showCloseButton
        footer={
          <div className="flex w-full flex-col-reverse gap-2 max-md:flex-col-reverse md:flex-row md:items-center md:justify-between">
            <DeckDetailsTopBarDeleteAction />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => cancelEditing()} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void saveEdits()} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        }
        onPointerDownOutside={(event) => {
          if (isSaving) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isSaving) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit deck details</DialogTitle>
          <DialogDescription>Change the name, description, and who can view this deck.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deck-edit-name">Deck name</Label>
            <Input
              id="deck-edit-name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="h-10 font-display text-sm font-semibold uppercase tracking-wide"
              placeholder="Deck name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deck-edit-description">Description</Label>
            <Textarea
              id="deck-edit-description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              rows={4}
              className="resize-y text-sm"
              placeholder="Add a short description"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deck-edit-visibility">Visibility</Label>
            <Select value={selectRowValue} onValueChange={(v) => handleVisibilityRowChange(v as VisibilityRow)}>
              <SelectTrigger id="deck-edit-visibility" className="h-10 w-full" size="default">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectVisibilityOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {rowLabel(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
