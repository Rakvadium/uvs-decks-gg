"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

function useDebounced<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setD(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return d;
}

type AddSetDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function AddSetDialog({ open, onOpenChange }: AddSetDialogProps) {
  const createSet = useMutation(api.admin.createSet);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [setNumber, setSetNumber] = useState("");
  const [cardCount, setCardCount] = useState("");
  const [releasedAt, setReleasedAt] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [legality, setLegality] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [isFuture, setIsFuture] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dCode = useDebounced(code.trim(), 300);
  const codeCheck = useQuery(
    api.sets.isSetCodeAvailable,
    open && dCode.length > 0 ? { code: dCode } : "skip"
  );

  useEffect(() => {
    if (!open) {
      setCode("");
      setName("");
      setSetNumber("");
      setCardCount("");
      setReleasedAt("");
      setIconUrl("");
      setLegality("");
      setIsRotating(false);
      setIsFuture(false);
    }
  }, [open]);

  const codeError =
    dCode.length > 0 && codeCheck === false
      ? "A set with this code already exists"
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || !name.trim()) {
      toast.error("Code and name are required");
      return;
    }
    if (codeCheck === false) {
      toast.error("Choose a unique code");
      return;
    }
    setSubmitting(true);
    try {
      const sn = setNumber.trim() ? parseInt(setNumber, 10) : undefined;
      if (setNumber.trim() && (Number.isNaN(sn) || sn === undefined)) {
        toast.error("Invalid set number");
        setSubmitting(false);
        return;
      }
      const cc = cardCount.trim() ? parseInt(cardCount, 10) : undefined;
      if (cardCount.trim() && (cc === undefined || Number.isNaN(cc))) {
        toast.error("Invalid card count");
        setSubmitting(false);
        return;
      }
      let released: number | undefined;
      if (releasedAt) {
        const t = new Date(releasedAt).getTime();
        if (!Number.isNaN(t)) {
          released = t;
        }
      }
      await createSet({
        code: trimmed,
        name: name.trim(),
        setNumber: sn,
        cardCount: cc,
        releasedAt: released,
        iconUrl: iconUrl.trim() || undefined,
        legality: legality.trim() || undefined,
        isRotating,
        isFuture,
      });
      toast.success("Set created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create set");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 pt-6 md:px-6">
          <DialogTitle>Add set</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col">
        <DialogBody className="space-y-4 px-4 md:px-6">
          <div className="space-y-2">
            <Label htmlFor="add-code">Code</Label>
            <Input
              id="add-code"
              className="font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
            />
            {codeError ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {codeError}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-name">Name</Label>
            <Input
              id="add-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-num">Set # (optional)</Label>
            <Input
              id="add-num"
              type="number"
              value={setNumber}
              onChange={(e) => setSetNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-cc">Card count (optional)</Label>
            <Input
              id="add-cc"
              type="number"
              value={cardCount}
              onChange={(e) => setCardCount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-rel">Released (optional, local date)</Label>
            <Input
              id="add-rel"
              type="date"
              value={releasedAt}
              onChange={(e) => setReleasedAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-icon">Icon URL (optional)</Label>
            <Input
              id="add-icon"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-leg">Legality notes (optional)</Label>
            <Input
              id="add-leg"
              value={legality}
              onChange={(e) => setLegality(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="add-rot">Rotating</Label>
            <Switch
              id="add-rot"
              checked={isRotating}
              onCheckedChange={setIsRotating}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="add-fut">Future (unreleased)</Label>
            <Switch
              id="add-fut"
              checked={isFuture}
              onCheckedChange={setIsFuture}
            />
          </div>
        </DialogBody>
          <div className="flex justify-end gap-2 border-t border-border/30 px-4 py-4 md:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || codeCheck === false}>
              {submitting ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
