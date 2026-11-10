import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useImportExportSidebarContext } from "./context";
import { useDeckImportExportFeature } from "./feature";

export function ImportExportSidebarExportSection() {
  const { exportText, handleCopyExport } = useImportExportSidebarContext();
  const { formatLabel } = useDeckImportExportFeature();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="chrome-label-case text-[10px] text-muted-foreground">
          Export to {formatLabel}
        </span>
        <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => void handleCopyExport()}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy
        </Button>
      </div>
      <Textarea value={exportText} readOnly className="min-h-[180px] text-[11px] leading-relaxed" />
    </div>
  );
}
