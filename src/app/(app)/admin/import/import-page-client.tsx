"use client";

import { useState, type ReactNode } from "react";
import { useAction, useMutation } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  AdminPageHeader,
  AdminSetSectionTabs,
  IngestionJobsPanel,
} from "@/components/admin";
import { toast } from "sonner";
import { getConvexErrorMessage, toastConvexError } from "@/lib/convex-error-toast";

const CLEAR_CATALOG_PHRASE = "DELETE ALL CARDS";

type AdminImportPageClientProps = {
  setCode: string;
  setName?: string;
  breadcrumbs?: ReactNode;
  searchSuffix?: string;
};

export default function AdminImportPageClient({
  setCode,
  setName,
  breadcrumbs,
  searchSuffix = "",
}: AdminImportPageClientProps) {
  const [jsonData, setJsonData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const [bulkJson, setBulkJson] = useState("");
  const [dryResult, setDryResult] = useState<{
    rowCount: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [bulkJobId, setBulkJobId] = useState<Id<"ingestionJobs"> | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [clearOpen, setClearOpen] = useState(false);
  const [clearPhrase, setClearPhrase] = useState("");
  const [clearSubmitting, setClearSubmitting] = useState(false);

  const importCards = useAction(api.admin.importUniversusCards);
  const clearCards = useAction(api.admin.clearAllCards);
  const previewBulkImportCards = useMutation(api.admin.previewBulkImportCards);
  const bulkImportCards = useAction(api.admin.bulkImportCards);

  const handleImport = async () => {
    if (!jsonData.trim()) {
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const res = await importCards({ cardsJson: jsonData });
      const msg = `Successfully imported ${res.inserted} cards (${res.failed} failed) out of ${res.totalCards} total.`;
      setResult({ success: true, message: msg });
      toast.success(msg);
    } catch (error) {
      const message = getConvexErrorMessage(error, "Import failed");
      setResult({ success: false, message });
      toastConvexError(error, "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const runClearAll = async () => {
    if (clearPhrase !== CLEAR_CATALOG_PHRASE) {
      return;
    }
    setClearSubmitting(true);
    setResult(null);
    try {
      const res = await clearCards({});
      const msg = `Deleted ${res.deletedCount} cards.`;
      setResult({ success: true, message: msg });
      toast.success(msg);
      setClearOpen(false);
      setClearPhrase("");
    } catch (error) {
      const message = getConvexErrorMessage(error, "Delete failed");
      setResult({ success: false, message });
      toastConvexError(error, "Delete failed");
    } finally {
      setClearSubmitting(false);
    }
  };

  const handleDryRun = async () => {
    if (!bulkJson.trim()) {
      return;
    }
    setBulkBusy(true);
    setDryResult(null);
    setBulkJobId(null);
    try {
      const r = await previewBulkImportCards({
        format: "json",
        data: bulkJson,
        defaultSetCode: setCode,
        defaultSetName: setName,
      });
      setDryResult(r);
    } catch (e) {
      toastConvexError(e, "Dry run failed");
      setDryResult({
        rowCount: 0,
        errors: [{ row: 0, message: getConvexErrorMessage(e, "Dry run failed") }],
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkJson.trim()) {
      return;
    }
    setBulkBusy(true);
    setBulkJobId(null);
    try {
      const { jobId } = await bulkImportCards({
        format: "json",
        data: bulkJson,
        defaultSetCode: setCode,
        defaultSetName: setName,
      });
      setBulkJobId(jobId);
      setDryResult(null);
      toast.success("Bulk import job started. Status updates below.");
    } catch (e) {
      toastConvexError(e, "Import failed");
      setDryResult({
        rowCount: 0,
        errors: [{ row: 0, message: getConvexErrorMessage(e, "Import failed") }],
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const titleSuffix = setName ? ` — ${setName}` : ` — ${setCode}`;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <AdminPageHeader
        backHref={`/admin/sets/${encodeURIComponent(setCode)}${searchSuffix}`}
        backLabel="Set overview"
        breadcrumbs={breadcrumbs}
        title={`Import${titleSuffix}`}
        description={
          <span>
            Import card data from JSON (set context: <span className="font-mono">{setCode}</span>).
            Payload may include multiple sets.
          </span>
        }
        subNav={<AdminSetSectionTabs setCode={setCode} searchSuffix={searchSuffix} />}
      />
      <div className="max-w-4xl space-y-6">
        <IngestionJobsPanel activeJobId={bulkJobId} setCode={setCode} />

        {result ? (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">JSON import</h2>
          <Textarea
            placeholder="Paste JSON card data here..."
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => void handleImport()} disabled={isImporting || !jsonData.trim()}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import cards
            </Button>
          </div>
        </div>

        <details className="rounded-lg border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Advanced — clear entire card catalog
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">
            Removes all cards in the database (all sets), then rebuilds catalog aggregates. This is
            rarely needed.
          </p>
          <Button
            className="mt-3"
            type="button"
            variant="destructive"
            onClick={() => {
              setClearPhrase("");
              setClearOpen(true);
            }}
          >
            Clear all cards…
          </Button>
        </details>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Bulk array import (ingestion job)</h2>
          <p className="text-sm text-muted-foreground">
            JSON array of card objects. Rows are prefilled with set code{" "}
            <span className="font-mono">{setCode}</span>
            {setName ? (
              <>
                {" "}
                and name <span className="font-mono">{setName}</span>
              </>
            ) : null}{" "}
            when omitted per row. Use dry run to validate before writing.
          </p>
          <Textarea
            placeholder='[ { "name": "...", "collectorNumber": "1", ... }, ... ]'
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            className="min-h-[220px] font-mono text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleDryRun()}
              disabled={bulkBusy || !bulkJson.trim()}
            >
              {bulkBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Dry run
            </Button>
            <Button
              type="button"
              onClick={() => void handleBulkImport()}
              disabled={bulkBusy || !bulkJson.trim()}
            >
              {bulkBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run bulk import
            </Button>
          </div>
          {dryResult ? (
            <Alert variant={dryResult.errors.length ? "destructive" : "default"}>
              <AlertTitle>
                Dry run: {dryResult.rowCount} row{dryResult.rowCount === 1 ? "" : "s"},{" "}
                {dryResult.errors.length} issue{dryResult.errors.length === 1 ? "" : "s"}
              </AlertTitle>
              {dryResult.errors.length > 0 ? (
                <AlertDescription>
                  <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-sm">
                    {dryResult.errors.map((err, i) => (
                      <li key={`${err.row}-${i}`}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              ) : (
                <AlertDescription>No row-level validation errors reported.</AlertDescription>
              )}
            </Alert>
          ) : null}
        </div>
      </div>

      <AlertDialog
        open={clearOpen}
        onOpenChange={(o) => {
          setClearOpen(o);
          if (!o) {
            setClearPhrase("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete every card in the database?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This runs the destructive <span className="font-mono">clearAllCards</span> action.
                  The operation is written to the admin audit log.
                </p>
                <p>
                  Type{" "}
                  <span className="font-mono text-foreground">{CLEAR_CATALOG_PHRASE}</span> to
                  confirm.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="clear-phrase">Confirmation phrase</Label>
                  <Input
                    id="clear-phrase"
                    value={clearPhrase}
                    onChange={(e) => setClearPhrase(e.target.value)}
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={clearSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={clearSubmitting || clearPhrase !== CLEAR_CATALOG_PHRASE}
              onClick={(e) => {
                e.preventDefault();
                void runClearAll();
              }}
            >
              {clearSubmitting ? "Clearing…" : "Delete all cards"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}