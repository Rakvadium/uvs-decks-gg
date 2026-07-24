"use client";

import { UsersRound } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { FloatingCapsuleCluster } from "@/components/shell/floating-page-bar";
import { TeamLogoCropDialog } from "./team-logo-crop-dialog";
import { useTeamLogoPicker, type TeamLogoPresentation } from "./use-team-logo-picker";

interface TeamIdentityPillProps {
  teamId: Id<"teams">;
  name: string | null;
  presentation: TeamLogoPresentation | null | undefined;
  loading: boolean;
}

function noticeText(presentation: TeamLogoPresentation | null | undefined): string | null {
  const notice = presentation?.editorNotice ?? null;
  if (!notice) return null;
  if (notice.kind === "rejected") {
    return "Logo didn't pass content guidelines. Try a different image.";
  }
  return "Your logo is awaiting review.";
}

export function TeamIdentityPill({ teamId, name, presentation, loading }: TeamIdentityPillProps) {
  const { inputRef, cropOpen, cropSrc, cropMime, onPickFile, onCropDialogOpenChange, openPicker } =
    useTeamLogoPicker();

  if (loading || !name) {
    return (
      <FloatingCapsuleCluster bodyClassName="gap-2 pl-1.5 pr-4">
        <span className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
        <span className="h-3.5 w-24 animate-pulse rounded-full bg-muted" />
      </FloatingCapsuleCluster>
    );
  }

  const displayUrl = presentation?.displayUrl ?? null;
  const canManage = presentation?.canManageLogo ?? false;
  const notice = noticeText(presentation);

  const avatar = (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted/50">
      {displayUrl ? (
        <img src={displayUrl} alt="" className="size-full object-cover" />
      ) : (
        <UsersRound className="size-4 text-muted-foreground" aria-hidden />
      )}
    </span>
  );

  return (
    <FloatingCapsuleCluster
      className="min-w-0 max-w-[16rem]"
      bodyClassName="min-w-0 gap-2 pl-1.5 pr-4"
      glow
    >
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
          <button
            type="button"
            onClick={openPicker}
            aria-label="Upload team logo"
            title={notice ?? "Upload team logo"}
            className="relative shrink-0 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {avatar}
            {notice ? (
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 size-2.5 rounded-full border border-background",
                  presentation?.editorNotice?.kind === "rejected" ? "bg-destructive" : "bg-amber-500"
                )}
                aria-hidden
              />
            ) : null}
          </button>
          <TeamLogoCropDialog
            open={cropOpen}
            onOpenChange={onCropDialogOpenChange}
            imageSrc={cropSrc}
            sourceMimeType={cropMime}
            teamId={teamId}
          />
        </>
      ) : (
        avatar
      )}
      <h1 className="truncate text-sm font-semibold tracking-tight text-foreground" title={name}>
        {name}
      </h1>
    </FloatingCapsuleCluster>
  );
}
