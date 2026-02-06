import type { ReactNode } from "react";

export interface MobileFiltersSheetProps {
  children: ReactNode;
  title?: string;
  onApply?: () => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

export interface MobileFiltersButtonProps {
  onClick: () => void;
}
