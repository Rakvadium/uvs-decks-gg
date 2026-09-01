"use client";

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
import {
  FloatingActionPill,
  FloatingBackPill,
  FloatingCapsuleCluster,
  FloatingPageBar,
} from "@/components/shell/floating-page-bar";
import { Input } from "@/components/ui/input";
import { COMMUNITY_TIER_RANKING, getRankingScopeLabel } from "../../../../../shared/app-config";
import { ChevronDown, Edit3, Globe, Loader2, Lock, Save, Trash2, X } from "lucide-react";
import { useProfanityDisplayText } from "@/lib/moderation/use-profanity-display-text";
import { useCommunityTierListDetailContext } from "./context";

export function CommunityTierListDetailFloatingTopBar() {
  const { display } = useProfanityDisplayText();
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
  } = useCommunityTierListDetailContext();

  if (detail === undefined || !detail) {
    return null;
  }

  const displayPublicity = isPublic ? "Public" : "Private";

  const publicityControl = isEditingMeta ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="chrome-label-case inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border/50 px-2.5 text-[10px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
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
    <Badge variant={isPublic ? "default" : "outline"} className="h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px]">
      {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {displayPublicity}
    </Badge>
  );

  const rankingScopeControl = isEditingMeta ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="chrome-label-case inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border/50 px-2.5 text-[10px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
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
    <Badge variant="outline" className="h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px]">
      {rankingScopeLabel}
    </Badge>
  );

  const viewTitle = canEdit ? title : display(title, false);

  return (
    <>
      <FloatingPageBar
        left={
          <>
            <FloatingBackPill href="/community/tier-lists" label="All tier lists" iconOnly />
            <FloatingCapsuleCluster
              className="min-w-0 max-w-[min(100%,22rem)]"
              bodyClassName="min-w-0 px-4"
              glow
            >
              {canEdit && isEditingMeta ? (
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Tier list name"
                  aria-label="Tier list name"
                  className="h-8 w-56 border-none bg-transparent px-0 text-sm font-semibold tracking-tight shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              ) : (
                <h1
                  className="chrome-heading-case truncate text-sm font-semibold text-foreground"
                  title={viewTitle}
                >
                  {viewTitle}
                </h1>
              )}
            </FloatingCapsuleCluster>
            <FloatingCapsuleCluster>
              {publicityControl}
              {rankingScopeControl}
            </FloatingCapsuleCluster>
          </>
        }
        right={
          canEdit ? (
            isEditingMeta ? (
              <>
                <FloatingActionPill
                  onClick={() =>
                    void persistTierList({
                      onSuccess: () => setIsEditingMeta(false),
                      successMessage: "Tier list details saved.",
                    })
                  }
                  className={isSaving ? "pointer-events-none opacity-70" : undefined}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="text-xs">Save</span>
                </FloatingActionPill>
                <FloatingActionPill variant="outline" onClick={cancelMetaEditing}>
                  <X className="h-4 w-4" />
                  <span className="text-xs">Cancel</span>
                </FloatingActionPill>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructiveOutline"
                      size="sm"
                      className="pointer-events-auto h-10 shrink-0 gap-1.5 rounded-full px-4"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-xs">Delete</span>
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
              </>
            ) : (
              <FloatingActionPill variant="outline" onClick={() => setIsEditingMeta(true)}>
                <Edit3 className="h-4 w-4" />
                <span className="text-xs">Edit</span>
              </FloatingActionPill>
            )
          ) : null
        }
      />
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
