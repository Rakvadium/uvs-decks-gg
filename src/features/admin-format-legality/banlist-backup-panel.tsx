"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type BanlistBackupPanelProps = {
  formatKey: string;
};

type BundleShape = {
  formatKey?: string;
  exportedAt?: number;
  cardLegality?: {
    cardId: string;
    status: string;
    copyLimitOverride?: number;
    effectiveDate?: number;
  }[];
  setLegality?: {
    setCode: string;
    isLegal: boolean;
    rotatesOutAt?: number;
  }[];
};

export function BanlistBackupPanel({ formatKey }: BanlistBackupPanelProps) {
  const bundle = useQuery(api.admin.exportFormatLegalityBundle, { formatKey });
  const importBundle = useMutation(api.admin.importFormatLegalityBundle);
  const bulkCards = useMutation(api.admin.bulkUpsertCardLegality);
  const [jsonText, setJsonText] = useState("");
  const [replaceCards, setReplaceCards] = useState(true);
  const [replaceSets, setReplaceSets] = useState(true);
  const [busy, setBusy] = useState(false);

  const download = () => {
    if (!bundle) return;
    const payload = { ...bundle, exportedAt: Date.now() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legality-${formatKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  const applyPaste = async () => {
    let parsed: BundleShape;
    try {
      parsed = JSON.parse(jsonText) as BundleShape;
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    if (parsed.formatKey !== undefined && parsed.formatKey !== formatKey) {
      toast.error(
        `Bundle formatKey "${parsed.formatKey}" does not match this page.`
      );
      return;
    }
    const cardLegality = parsed.cardLegality?.filter(
      (e) =>
        e.cardId &&
        (e.status === "legal" ||
          e.status === "banned" ||
          e.status === "restricted")
    );
    const setLegality = parsed.setLegality?.filter((e) => e.setCode);
    setBusy(true);
    try {
      const r = await importBundle({
        formatKey,
        cardLegality: cardLegality?.map((e) => ({
          cardId: e.cardId as Id<"cards">,
          status: e.status as "legal" | "banned" | "restricted",
          copyLimitOverride: e.copyLimitOverride,
          effectiveDate: e.effectiveDate,
        })),
        setLegality: setLegality?.map((e) => ({
          setCode: e.setCode,
          isLegal: e.isLegal,
          rotatesOutAt: e.rotatesOutAt,
        })),
        replaceCardLegality: replaceCards,
        replaceSetLegality: replaceSets,
      });
      toast.success(
        `Imported ${r.cardRowsWritten} card row(s), ${r.setRowsWritten} set row(s)`
      );
      setJsonText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const applyBulkCardJson = async () => {
    let entries: BundleShape["cardLegality"];
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      if (Array.isArray(parsed)) {
        entries = parsed as BundleShape["cardLegality"];
      } else if (
        parsed &&
        typeof parsed === "object" &&
        "cardLegality" in parsed &&
        Array.isArray((parsed as BundleShape).cardLegality)
      ) {
        entries = (parsed as BundleShape).cardLegality;
      } else {
        toast.error("Expected an array or an object with cardLegality[]");
        return;
      }
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    const clean = entries?.filter(
      (e) =>
        e?.cardId &&
        (e.status === "legal" ||
          e.status === "banned" ||
          e.status === "restricted")
    );
    if (!clean?.length) {
      toast.error("No valid card legality entries");
      return;
    }
    setBusy(true);
    try {
      const r = await bulkCards({
        formatKey,
        entries: clean.map((e) => ({
          cardId: e.cardId as Id<"cards">,
          status: e.status as "legal" | "banned" | "restricted",
          copyLimitOverride: e.copyLimitOverride,
          effectiveDate: e.effectiveDate,
        })),
      });
      toast.success(`Bulk upsert: ${r.applied} applied, ${r.skipped} skipped`);
      setJsonText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 px-1 pb-8">
      <div className="rounded-lg border bg-card/30 p-4 space-y-3">
        <h3 className="text-sm font-medium">Export</h3>
        <p className="text-sm text-muted-foreground">
          Snapshot of card and set legality rows for this format (Convex document
          ids for cards).
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={!bundle}
          onClick={download}
        >
          Download JSON
        </Button>
      </div>

      <div className="rounded-lg border bg-card/30 p-4 space-y-4">
        <h3 className="text-sm font-medium">Restore or merge</h3>
        <p className="text-sm text-muted-foreground">
          Paste a bundle from export or another environment. Replace wipes
          existing rows for this format in that category before applying the
          file; merge patches matching card or set keys.
        </p>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="rep-card"
              checked={replaceCards}
              onCheckedChange={(v) => setReplaceCards(v === true)}
            />
            <Label htmlFor="rep-card" className="font-normal">
              Replace all card overrides
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rep-set"
              checked={replaceSets}
              onCheckedChange={(v) => setReplaceSets(v === true)}
            />
            <Label htmlFor="rep-set" className="font-normal">
              Replace all set overrides
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="json-in">JSON</Label>
          <Textarea
            id="json-in"
            className="font-mono text-xs min-h-[200px]"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"formatKey":"…","cardLegality":[…],"setLegality":[…]}'
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || !jsonText.trim()}
            onClick={() => void applyPaste()}
          >
            Import bundle
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !jsonText.trim()}
            onClick={() => void applyBulkCardJson()}
          >
            Bulk card JSON only
          </Button>
        </div>
      </div>
    </div>
  );
}
