"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AdminImportPageClient() {
  const [jsonData, setJsonData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const importCards = useAction(api.admin.importUniversusCards);
  const clearCards = useAction(api.admin.clearAllCards);

  const handleImport = async () => {
    if (!jsonData.trim()) return;

    setIsImporting(true);
    setResult(null);

    try {
      const res = await importCards({ cardsJson: jsonData });
      setResult({
        success: true,
        message: `Successfully imported ${res.inserted} cards (${res.failed} failed) out of ${res.totalCards} total.`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete ALL cards? This cannot be undone.")) {
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const res = await clearCards({});
      setResult({
        success: true,
        message: `Deleted ${res.deletedCount} cards.`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Delete failed",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">Import Cards</h1>
          <p className="text-muted-foreground">Import card data from JSON</p>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Textarea
            placeholder="Paste JSON card data here..."
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />

          <div className="flex gap-4">
            <Button onClick={handleImport} disabled={isImporting || !jsonData.trim()}>
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Cards
            </Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={isImporting}>
              Clear All Cards
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
