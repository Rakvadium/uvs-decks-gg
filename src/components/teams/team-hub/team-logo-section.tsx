"use client";

import { Loader2, UsersRound } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamLogoCropDialog } from "./team-logo-crop-dialog";
import { useTeamLogoPicker, type TeamLogoPresentation } from "./use-team-logo-picker";

interface TeamLogoSectionProps {
  teamId: Id<"teams">;
  presentation: TeamLogoPresentation | null | undefined;
}

export function TeamLogoSection({ teamId, presentation }: TeamLogoSectionProps) {
  const { inputRef, cropOpen, cropSrc, cropMime, onPickFile, onCropDialogOpenChange } =
    useTeamLogoPicker();

  const loadingPresentation = presentation === undefined;
  const displayUrl = presentation?.displayUrl ?? null;
  const editorNotice = presentation?.editorNotice ?? null;
  const canManage = presentation?.canManageLogo ?? false;

  return (
    <div className="flex shrink-0 flex-col items-center gap-3">
      <TeamLogoCropDialog
        open={cropOpen}
        onOpenChange={onCropDialogOpenChange}
        imageSrc={cropSrc}
        sourceMimeType={cropMime}
        teamId={teamId}
      />
      <div
        className={cn(
          "relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-muted/50",
          "shadow-[var(--chrome-shell-nav-active-shadow)]",
        )}
      >
        {loadingPresentation ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        ) : displayUrl ? (
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <UsersRound className="h-10 w-10 text-muted-foreground" aria-hidden />
        )}
      </div>
      {canManage ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              onPickFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-mono text-xs uppercase tracking-wider"
            disabled={loadingPresentation}
            onClick={() => inputRef.current?.click()}
          >
            Upload logo
          </Button>
        </>
      ) : null}
      {canManage && editorNotice?.kind === "pending" ? (
        <Alert className="max-w-xs border-border/50 bg-muted/20 py-2">
          <AlertDescription className="text-xs text-muted-foreground">
            Your logo is being reviewed. It will appear for everyone once approved.
          </AlertDescription>
        </Alert>
      ) : null}
      {canManage && editorNotice?.kind === "needs_review" ? (
        <Alert className="max-w-xs border-border/50 bg-muted/20 py-2">
          <AlertDescription className="text-xs text-muted-foreground">
            Your logo is awaiting manual review.
          </AlertDescription>
        </Alert>
      ) : null}
      {canManage && editorNotice?.kind === "rejected" ? (
        <Alert className="max-w-xs border-destructive/30 bg-destructive/5 py-2">
          <AlertDescription className="text-xs text-muted-foreground">
            Logo didn&apos;t pass content guidelines. Try a different image.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
