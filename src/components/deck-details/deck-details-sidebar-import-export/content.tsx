"use client";

import { ImportExportSidebarProvider } from "./context";
import { ImportExportSidebarExportSection } from "./export-section";
import { ImportExportSidebarImportSection } from "./import-section";

function ImportExportSidebarContent() {
  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <ImportExportSidebarExportSection />
      <ImportExportSidebarImportSection />
    </div>
  );
}

export function ImportExportSidebar() {
  return (
    <ImportExportSidebarProvider>
      <ImportExportSidebarContent />
    </ImportExportSidebarProvider>
  );
}
