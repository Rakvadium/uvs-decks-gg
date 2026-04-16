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
import { COMMUNITY_TIER_RANKING, getRankingScopeLabel } from "../../../../../shared/app-config";
import { ArrowLeft, ChevronDown, Edit3, Globe, Loader2, Lock, Save, Trash2, X } from "lucide-react";
import { useCommunityTierListDetailContext } from "./context";

export function CommunityTierListDetailDesktopHeader() {
  const {
    detail,
    canEdit,
    title,
    setTitle,
    isPublic,
    setIsPublic,
    rankingScopeLabel,
    isRankedScope,
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
  } = useCommunityTierListDetailContext();

  if (detail === undefined || !detail) {
    return null;
  }

  const displayPublicity = isPublic ? "Public" : "Private";

  const description =
    canEdit
      ? isRankedScope
        ? "Drag cards into the fixed S-F lanes and rankings save automatically as you go."
        : "Drag cards into lanes and your rankings save automatically as you go."
      : "Browse the published lane breakdown for this tier list.";

  const saveMetaButton = (
    <Button
      size="sm"
      className="h-9 gap-1.5"
      onClick={() =>
        void persistTierList({
          onSuccess: () => setIsEditingMeta(false),
          successMessage: "Tier list details saved.",
        })
      }
      disabled={isSaving}
    >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Save
    </Button>
  );

  const publicityControl = isEditingMeta ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border/60 px-2.5 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {displayPublicity}
          <ChevronDown className="h-3 w-3 opacity-70" />
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
    <Badge variant={isPublic ? "default" : "outline"} className="h-8 shrink-0 items-center gap-1.5 px-2.5 text-[9px]">
      {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {displayPublicity}
    </Badge>
  );

  const rankingScopeControl = isEditingMeta ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border/60 px-2.5 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {rankingScopeLabel}
          <ChevronDown className="h-3 w-3 opacity-70" />
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
    <Badge variant="outline" className="h-8 shrink-0 items-center gap-1.5 px-2.5 text-[9px]">
      {rankingScopeLabel}
    </Badge>
  );

  const deleteButton = canEdit && isEditingMeta ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
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

  const titleNode = isEditingMeta ? (
    <Input
      value={title}
      onChange={(event) => setTitle(event.target.value)}
      className="h-11 max-w-2xl text-xl font-semibold tracking-tight md:text-2xl"
      placeholder="Tier list name"
    />
  ) : (
    <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{title}</h1>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" className="gap-2" asChild>
        <Link href="/community/tier-lists">
          <ArrowLeft className="h-4 w-4" />
          All tier lists
        </Link>
      </Button>
      {publicityControl}
      {rankingScopeControl}
    </div>
  );

  const actions = canEdit ? (
    <div className="flex flex-wrap items-center gap-2">
      {isEditingMeta ? (
        <>
          {saveMetaButton}
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={cancelMetaEditing}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          {deleteButton}
        </>
      ) : (
        <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setIsEditingMeta(true)}>
          <Edit3 className="h-4 w-4" />
          Edit
        </Button>
      )}
    </div>
  ) : null;

  return (
    <>
      <AppPageHeader title={titleNode} description={description} toolbar={toolbar} actions={actions} />
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
