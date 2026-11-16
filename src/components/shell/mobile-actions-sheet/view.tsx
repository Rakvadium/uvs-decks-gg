"use client";

import type { ReactNode } from "react";
import { MobileActionsSheetProvider } from "./context";
import { MobileActionsBottomSheet } from "./bottom-sheet";

interface MobileActionsSheetProps {
  children?: ReactNode;
  /** False when the chrome renders panels itself (the Menu layout's morphing panel). */
  withSheet?: boolean;
}

export function MobileActionsSheet({ children, withSheet = true }: MobileActionsSheetProps) {
  return (
    <MobileActionsSheetProvider>
      {children}
      {withSheet ? <MobileActionsBottomSheet /> : null}
    </MobileActionsSheetProvider>
  );
}
