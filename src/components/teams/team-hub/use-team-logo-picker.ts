"use client";

import { useCallback, useRef, useState } from "react";

export type TeamLogoEditorNotice =
  | null
  | { kind: "pending" }
  | { kind: "needs_review" }
  | { kind: "rejected" };

export type TeamLogoPresentation = {
  displayUrl: string | null;
  editorNotice: TeamLogoEditorNotice;
  canManageLogo: boolean;
};

export function useTeamLogoPicker() {
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

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    inputRef,
    cropOpen,
    cropSrc,
    cropMime,
    onPickFile,
    onCropDialogOpenChange,
    openPicker,
  };
}
