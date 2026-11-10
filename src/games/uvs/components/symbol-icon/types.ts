import type { SIZE_MAP } from "./constants";

export interface SymbolIconProps {
  symbol: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
  showLabel?: boolean;
}

export interface SymbolBadgeProps {
  symbol: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "xs" | "sm" | "md";
  className?: string;
}
