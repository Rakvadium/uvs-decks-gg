"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Plus, Save, X } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toastConvexError } from "@/lib/convex-error-toast";
import { cn } from "@/lib/utils";
import type { CachedCard } from "@/lib/universus/card-store";
import { toast } from "sonner";

interface CardVariantSaveDialogProps {
  templateCard: CachedCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (card: CachedCard) => void;
}

export function CardVariantSaveDialog({
  templateCard,
  open,
  onOpenChange,
  onCreated,
}: CardVariantSaveDialogProps) {
  const [draft, setDraft] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const prevOpen = useRef(false);
  const createVariant = useMutation(api.admin.createCardVariantFromJson);

  useEffect(() => {
    if (open && !prevOpen.current) {
      const { _id, _creationTime, ...rest } = templateCard;
      setDraft(JSON.stringify(rest, null, 2));
      setParseError(null);
    }
    prevOpen.current = open;
  }, [open, templateCard]);

  const validateDraft = useCallback(() => {
    try {
      JSON.parse(draft);
      setParseError(null);
      return true;
    } catch {
      setParseError("Invalid JSON");
      return false;
    }
  }, [draft]);

  const handleSave = async () => {
    if (!validateDraft()) return;
    try {
      const created = await createVariant({
        templateCardId: templateCard._id,
        json: draft,
      });
      toast.success("Variant created");
      onCreated(created);
      onOpenChange(false);
    } catch (error) {
      toastConvexError(error, "Could not save variant");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "fixed inset-0 z-[280] bg-background/70 backdrop-blur-sm"
          )}
        />
        <DialogPrimitive.Content
          onCloseAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.stopPropagation()}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "fixed top-[50%] left-[50%] z-[281] flex max-h-[min(85dvh,720px)] w-[calc(100vw-1.5rem)] max-w-3xl",
            "-translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl duration-200",
            "border border-primary/25 bg-card/95 shadow-[0_0_2px_var(--primary)/35,0_0_12px_var(--primary)/22] backdrop-blur-md",
            "p-0 outline-none"
          )}
        >
          <DialogPrimitive.Title className="sr-only">Save card variant</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Create a new card from this template. The oracle ID must stay linked.
          </DialogPrimitive.Description>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/20 px-3 py-2 sm:px-4 sm:py-3">
            <div className="min-w-0">
              <span className="truncate text-xs font-mono font-semibold uppercase tracking-widest text-foreground">
                New variant
              </span>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                oracleId must match · use isVariant true for promo alt art hidden from the gallery
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 gap-1.5 text-[10px] font-mono uppercase tracking-wider"
                onClick={() => void handleSave()}
              >
                <Save className="h-3 w-3" />
                Save variant
              </Button>
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="min-h-0 flex-1 p-3 sm:p-4">
            <Textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setParseError(null);
              }}
              onBlur={() => {
                if (draft.trim()) validateDraft();
              }}
              spellCheck={false}
              className={cn(
                "min-h-[min(50dvh,400px)] resize-y font-mono text-[11px] leading-relaxed sm:text-xs",
                "border-primary/20 bg-background/50",
                parseError && "border-destructive/60"
              )}
            />
            {parseError ? <p className="mt-2 text-xs text-destructive">{parseError}</p> : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function CardVariantSaveTrigger({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className="h-8 gap-1.5 border-primary/25 text-[10px] font-mono uppercase tracking-wider"
      onClick={onClick}
    >
      <Plus className="h-3.5 w-3.5" />
      Add card
    </Button>
  );
}
