"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Braces, Copy, Save, X } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toastConvexError } from "@/lib/convex-error-toast";
import { cn } from "@/lib/utils";
import type { CachedCard } from "@/lib/universus/card-store";
import { toast } from "sonner";

interface CardDetailsAdminJsonControlsProps {
  card: CachedCard;
  enabled: boolean;
  onSaved?: (card: CachedCard) => void;
}

export function CardDetailsAdminJsonControls({
  card,
  enabled,
  onSaved,
}: CardDetailsAdminJsonControlsProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const canonical = useMemo(() => JSON.stringify(card, null, 2), [card]);
  const updateCardFromJson = useMutation(api.admin.updateCardFromJson);

  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  useEffect(() => {
    if (open) {
      setDraft(canonical);
      setParseError(null);
    }
  }, [open, canonical]);

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
      const updated = await updateCardFromJson({ cardId: card._id, json: draft });
      toast.success("Card saved to database");
      onSaved?.(updated);
      setOpen(false);
    } catch (error) {
      toastConvexError(error, "Could not save card");
    }
  };

  if (!enabled) return null;

  return (
    <>
      <div
        className={cn(
          "pointer-events-auto absolute right-0 bottom-0 z-20 flex w-max min-w-0 max-w-full items-stretch",
          "rounded-br-xl rounded-tr-none rounded-tl-xl rounded-bl-none",
          "border border-primary/25 bg-card/95 shadow-none backdrop-blur-sm"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-9 max-w-full min-w-0 items-center gap-1.5 py-0 pr-1.5 pl-2 sm:gap-2 sm:pr-2.5 sm:pl-2.5",
            "text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          )}
        >
          <Braces className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate text-xs font-mono font-semibold uppercase tracking-widest">JSON</span>
        </button>
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "fixed inset-0 z-[250] bg-background/70 backdrop-blur-sm"
            )}
          />
          <DialogPrimitive.Content
            onCloseAutoFocus={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.stopPropagation()}
            className={cn(
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "fixed top-[50%] left-[50%] z-[251] flex max-h-[min(85dvh,720px)] w-[calc(100vw-1.5rem)] max-w-3xl",
              "-translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl duration-200",
              "border border-primary/25 bg-card/95 shadow-[0_0_2px_var(--primary)/35,0_0_12px_var(--primary)/22] backdrop-blur-md",
              "p-0 outline-none"
            )}
          >
            <DialogPrimitive.Title className="sr-only">Card JSON data</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Edit raw card document as JSON. Admin only. Save writes to the database.
            </DialogPrimitive.Description>

            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/20 px-3 py-2 sm:px-4 sm:py-3">
              <span className="truncate text-xs font-mono font-semibold uppercase tracking-widest text-foreground">
                Card JSON
              </span>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-primary/25 text-[10px] font-mono uppercase tracking-wider"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(draft);
                      toast.success("Copied");
                    } catch {}
                  }}
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-8 gap-1.5 text-[10px] font-mono uppercase tracking-wider"
                  onClick={() => void handleSave()}
                >
                  <Save className="h-3 w-3" />
                  Save
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
              {parseError ? (
                <p className="mt-2 text-xs text-destructive">{parseError}</p>
              ) : null}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
