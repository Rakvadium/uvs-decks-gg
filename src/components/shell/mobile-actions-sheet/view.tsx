"use client";

import type { ReactNode } from "react";
import { MobileActionsSheetProvider } from "./context";
import { MobileActionsDraggableDrawer } from "./draggable-drawer";

interface MobileActionsSheetProps {
  children?: ReactNode;
}

export function MobileActionsSheet({ children }: MobileActionsSheetProps) {
  return (
    <MobileActionsSheetProvider>
      <MobileActionsDraggableDrawer>{children}</MobileActionsDraggableDrawer>
    </MobileActionsSheetProvider>
  );
}
