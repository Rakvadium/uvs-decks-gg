"use client";

import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/ui/typography-headings";
import { COMMUNITY_TIER_RANKING, getRankingScopeLabel } from "../../../../../shared/app-config";
import { ArrowLeft, ChevronDown, Edit3, Globe, Loader2, Lock, Save, Trash2, X } from "lucide-react";
import { useProfanityDisplayText } from "@/lib/moderation/use-profanity-display-text";
import { useOptionalCommunityTierListDetailContext } from "./context";

export function CommunityTierListDetailTopBar() {
  const { display } = useProfanityDisplayText();
  const context = useOptionalCommunityTierListDetailContext();

  if (!context) {
    return null;
  }

  const {
    detail,
    canEdit,
    title,
    setTitle,
    isPublic,
    setIsPublic,
    rankingScopeLabel,
    isSaving,
    isDeleting,
    isEditingMeta,
    setIsEditingMeta,
    persistTierList,
    handleDelete,
    cancelMetaEditing,
    requestRankingScopeChange,
    shouldConfirmRankedScopeReset,
    cancelPendingRankingScopeChange,
    confirmPendingRankingScopeChange,
  } = context;

  if (detail === undefined) {
    return (
      <div className="flex w-full min-w-0 items-center gap-2">
        <Link href="/community/tier-lists" aria-label="Tier lists">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Tier lists">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="chrome-label-case flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Tier List</span>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex w-full min-w-0 items-center gap-2">
        <Link href="/community/tier-lists" aria-label="Tier lists">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Tier lists">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="chrome-label-case truncate text-sm text-muted-foreground">
          Tier List Unavailable
        </span>
      </div>
    );
  }

  const displayPublicity = isPublic ? "Public" : "Private";

  const saveMetaButton = (
    <Button
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() =>
        void persistTierList({
          onSuccess: () => setIsEditingMeta(false),
          successMessage: "Tier list details saved.",
        })
      }
      disabled={isSaving}
      aria-label="Save tier list details"
    >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
    </Button>
  );

  const publicityControl = isEditingMeta ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="chrome-label-case inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border/50 px-2.5 text-[10px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {displayPublicity}
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setIsPublic(false)}>
          <Lock className="h-4 w-4" />
          Private
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsPublic(true)}>
          <Globe className="h-4 w-4" />
          Public
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Badge variant={isPublic ? "default" : "outline"} className="hidden h-8 items-center gap-1.5 px-2.5 text-[10px] sm:inline-flex">
      {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {displayPublicity}
    </Badge>
  );

  const rankingScopeControl = isEditingMeta ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="chrome-label-case inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border/50 px-2.5 text-[10px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {rankingScopeLabel}
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {[COMMUNITY_TIER_RANKING.scopes.unranked, COMMUNITY_TIER_RANKING.scopes.global, COMMUNITY_TIER_RANKING.scopes.setScope].map((scope) => (
          <DropdownMenuItem key={scope} onClick={() => requestRankingScopeChange(scope)}>
            {getRankingScopeLabel(scope)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Badge variant="outline" className="hidden h-8 items-center gap-1.5 px-2.5 text-[10px] sm:inline-flex">
      {rankingScopeLabel}
    </Badge>
  );

  const deleteButton = canEdit && isEditingMeta ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructiveOutline"
          size="icon"
          className="h-8 w-8 shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this tier list?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the tier list, its card placements, likes, and comments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => void handleDelete()}
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  const viewTitle = canEdit ? title : display(title, false);

  const cancelButton = isEditingMeta ? (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={cancelMetaEditing}
      aria-label="Cancel tier list detail edits"
    >
      <X className="h-4 w-4" />
    </Button>
  ) : null;

  return (
    <>
      <div className="flex w-full min-w-0 items-center gap-2">
        <Link href="/community/tier-lists" aria-label="Tier lists">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Tier lists">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div className="min-w-0 flex-1">
          {canEdit && isEditingMeta ? (
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="chrome-label-case h-8 min-w-0 text-sm font-bold"
              placeholder="Tier list name..."
            />
          ) : (
            <PageHeading
              className="truncate text-sm font-bold"
              title={viewTitle}
            >
              {viewTitle}
            </PageHeading>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!isEditingMeta ? publicityControl : null}
          {!isEditingMeta ? rankingScopeControl : null}
          {canEdit ? (isEditingMeta ? saveMetaButton : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              onClick={() => setIsEditingMeta(true)}
              aria-label="Edit tier list details"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )) : null}
          {isEditingMeta ? publicityControl : null}
          {isEditingMeta ? rankingScopeControl : null}
          {cancelButton}
          {deleteButton}
        </div>
      </div>

      <AlertDialog open={shouldConfirmRankedScopeReset} onOpenChange={(open) => !open && cancelPendingRankingScopeChange()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this tier list to ranked lanes?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to a ranked scope replaces your custom lane setup with the fixed S, A, B, C, D, and F lanes. Cards currently placed in custom lanes will move back to the card pool.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPendingRankingScopeChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingRankingScopeChange}>Convert to Ranked Lanes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
