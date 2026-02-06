import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { ButtonProps } from "@/components/ui/button";

export interface SidebarFooterAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export interface SidebarFooterProps {
  primaryAction?: SidebarFooterAction;
  secondaryAction?: SidebarFooterAction;
  align?: "start" | "center" | "end" | "between";
  className?: string;
  children?: ReactNode;
}
