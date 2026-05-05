"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { ComponentProps } from "react";

type CatalogReleaseDialogProps = {
  triggerLabel?: string;
  buttonVariant?: ComponentProps<typeof Button>["variant"];
  buttonSize?: ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
};

export function CatalogReleaseDialog({
  triggerLabel = "Release catalog",
  buttonVariant = "outline",
  buttonSize = "default",
  buttonClassName,
}: CatalogReleaseDialogProps) {
  const versionDoc = useQuery(api.admin.getCardDataVersion, {});
  const releaseCards = useMutation(api.admin.releaseCards);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [publishAnnounce, setPublishAnnounce] = useState("");

  const onConfirm = async () => {
    setBusy(true);
    try {
      const r = await releaseCards({});
      const line = `Published catalog version ${r.version} (${r.cardCount.toLocaleString()} gallery-eligible cards).`;
      setPublishAnnounce(line);
      window.setTimeout(() => setPublishAnnounce(""), 8000);
      toast.success(line);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish catalog");
    } finally {
      setBusy(false);
    }
  };

  const lastAt =
    versionDoc != null
      ? new Date(versionDoc.updatedAt).toLocaleString()
      : null;

  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {publishAnnounce}
      </div>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={buttonClassName}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish catalog to players?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This bumps the global{" "}
                  <span className="font-mono text-foreground">cardDataVersion</span>,
                  rebuilds catalog aggregates, and triggers clients to pick up the
                  new snapshot on their next sync.
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    Current published version:{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {versionDoc != null ? versionDoc.version : "— (none yet)"}
                    </span>
                  </li>
                  <li>
                    Gallery-eligible card count (last published):{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {versionDoc != null
                        ? versionDoc.cardCount.toLocaleString()
                        : "—"}
                    </span>
                  </li>
                  {lastAt ? (
                    <li>
                      Last publish:{" "}
                      <span className="text-foreground">{lastAt}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={busy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void onConfirm();
              }}
            >
              {busy ? "Publishing…" : "Publish catalog"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
