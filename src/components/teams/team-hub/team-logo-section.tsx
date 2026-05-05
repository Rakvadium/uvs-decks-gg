"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, UsersRound } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamLogoCropDialog } from "./team-logo-crop-dialog";

type EditorNotice =
  | null
  | { kind: "pending" }
  | { kind: "needs_review" }
  | { kind: "rejected" };

type Presentation = {
  displayUrl: string | null;
  editorNotice: EditorNotice;
  canManageLogo: boolean;
};

interface TeamLogoSectionProps {
  teamId: Id<"teams">;
  presentation: Presentation | null | undefined;
}

export function TeamLogoSection({ teamId, presentation }: TeamLogoSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropMime, setCropMime] = useState("image/jpeg");

  const onPickFile = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setCropMime(file.type);
    setCropOpen(true);
  }, []);

  const onCropDialogOpenChange = useCallback((open: boolean) => {
    setCropOpen(open);
    if (!open) {
      setCropSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, []);

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
          "relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/40",
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
        <Alert className="max-w-xs border-border/60 bg-muted/30 py-2">
          <AlertDescription className="text-xs text-muted-foreground">
            Your logo is being reviewed. It will appear for everyone once approved.
          </AlertDescription>
        </Alert>
      ) : null}
      {canManage && editorNotice?.kind === "needs_review" ? (
        <Alert className="max-w-xs border-border/60 bg-muted/30 py-2">
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
