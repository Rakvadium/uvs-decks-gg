"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useImportExportSidebarModel, type ImportExportSidebarModel } from "./hook";

const ImportExportSidebarContext = createContext<ImportExportSidebarModel | null>(null);

export function ImportExportSidebarProvider({ children }: { children: ReactNode }) {
  const value = useImportExportSidebarModel();

  return (
    <ImportExportSidebarContext.Provider value={value}>
      {children}
    </ImportExportSidebarContext.Provider>
  );
}

export function useImportExportSidebarContext() {
  const context = useContext(ImportExportSidebarContext);

  if (!context) {
    throw new Error("useImportExportSidebarContext must be used within ImportExportSidebarProvider");
  }

  return context;
}
