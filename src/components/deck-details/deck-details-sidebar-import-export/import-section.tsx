import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useImportExportSidebarContext } from "./context";

const IMPORT_PLACEHOLDER = `[b]Character[/b]
1 Character Name

[b]Foundation[/b]
...`;

export function ImportExportSidebarImportSection() {
  const {
    deck,
    importText,
    setImportText,
    isImporting,
    lastImportMessage,
    handleImport,
  } = useImportExportSidebarContext();

  return (
    <div className="space-y-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Import from UVS Ultra
      </span>
      <Textarea
        value={importText}
        onChange={(event) => setImportText(event.target.value)}
        placeholder={IMPORT_PLACEHOLDER}
        className="min-h-[180px] font-mono text-[11px] leading-relaxed"
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          void handleImport();
        }}
        disabled={isImporting || !importText.trim() || !deck}
      >
        {isImporting ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-3.5 w-3.5" />
        )}
        Import Deck
      </Button>

      {lastImportMessage ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-[11px] text-primary">
          {lastImportMessage}
        </div>
      ) : null}
    </div>
  );
}
