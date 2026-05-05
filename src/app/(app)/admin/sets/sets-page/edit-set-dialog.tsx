"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { AdminSetRow } from "./types";

type EditSetDialogProps = {
  row: AdminSetRow | null;
  onOpenChange: (open: boolean) => void;
};

function formatDateForInput(ts: number | undefined): string {
  if (ts === undefined) {
    return "";
  }
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EditSetDialog({ row, onOpenChange }: EditSetDialogProps) {
  const open = row !== null;
  const updateSet = useMutation(api.admin.updateSet);
  const s = row?.set;
  const [name, setName] = useState("");
  const [setNumber, setSetNumber] = useState("");
  const [cardCount, setCardCount] = useState("");
  const [releasedAt, setReleasedAt] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [legality, setLegality] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [isFuture, setIsFuture] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!s) {
      return;
    }
    setName(s.name);
    setSetNumber(
      s.setNumber !== undefined && s.setNumber !== null
        ? String(s.setNumber)
        : ""
    );
    setCardCount(
      s.cardCount !== undefined && s.cardCount !== null
        ? String(s.cardCount)
        : ""
    );
    setReleasedAt(formatDateForInput(s.releasedAt));
    setIconUrl(s.iconUrl ?? "");
    setLegality(s.legality ?? "");
    setIsRotating(s.isRotating === true);
    setIsFuture(s.isFuture === true);
  }, [s]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s) {
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required");
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
      } else {
        released = undefined;
      }
      await updateSet({
        setId: s._id,
        name: name.trim(),
        setNumber: sn,
        cardCount: cc,
        releasedAt: released,
        iconUrl: iconUrl.trim() || undefined,
        legality: legality.trim() || undefined,
        isRotating,
        isFuture,
      });
      toast.success("Set updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg p-0">
        <DialogHeader className="px-4 pt-6 md:px-6">
          <DialogTitle>Edit set</DialogTitle>
        </DialogHeader>
        {s ? (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <DialogBody className="space-y-4 px-4 md:px-6">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input className="font-mono" value={s.code} disabled readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-name">Name</Label>
              <Input
                id="ed-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-num">Set # (optional)</Label>
              <Input
                id="ed-num"
                type="number"
                value={setNumber}
                onChange={(e) => setSetNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-cc">Card count (optional)</Label>
              <Input
                id="ed-cc"
                type="number"
                value={cardCount}
                onChange={(e) => setCardCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-rel">Released (optional, local date)</Label>
              <Input
                id="ed-rel"
                type="date"
                value={releasedAt}
                onChange={(e) => setReleasedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-icon">Icon URL (optional)</Label>
              <Input
                id="ed-icon"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed-leg">Legality notes (optional)</Label>
              <Input
                id="ed-leg"
                value={legality}
                onChange={(e) => setLegality(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="ed-rot">Rotating</Label>
              <Switch
                id="ed-rot"
                checked={isRotating}
                onCheckedChange={setIsRotating}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="ed-fut">Future (unreleased)</Label>
              <Switch
                id="ed-fut"
                checked={isFuture}
                onCheckedChange={setIsFuture}
              />
            </div>
            </DialogBody>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
