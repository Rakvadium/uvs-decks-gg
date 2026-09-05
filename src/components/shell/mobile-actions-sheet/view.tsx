"use client";

import type { ReactNode } from "react";
import { MobileActionsSheetProvider } from "./context";
import { MobileActionsBottomSheet } from "./bottom-sheet";

interface MobileActionsSheetProps {
  children?: ReactNode;
}

export function MobileActionsSheet({ children }: MobileActionsSheetProps) {
  return (
    <MobileActionsSheetProvider>
      {children}
      <MobileActionsBottomSheet />
    </MobileActionsSheetProvider>
  );
}
