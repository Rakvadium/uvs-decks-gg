"use client";

import Link from "next/link";
import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function FooterActionButton({
  action,
  defaultFullWidth = false,
}: {
  action: SidebarFooterAction;
  defaultFullWidth?: boolean;
}) {
  const {
    label,
    href,
    onClick,
    icon: Icon,
    iconPosition = "left",
    variant = "outline",
    size = "sm",
    className,
    disabled,
    fullWidth,
  } = action;
  const isFullWidth = fullWidth ?? defaultFullWidth;

  const content = (
    <>
      {Icon && iconPosition === "left" ? <Icon className="h-4 w-4" /> : null}
      <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      {Icon && iconPosition === "right" ? <Icon className="h-4 w-4" /> : null}
    </>
  );

  if (href) {
    return (
      <Button
        asChild
        variant={variant}
        size={size}
        className={cn(isFullWidth && "w-full justify-between", className)}
        disabled={disabled}
      >
        <Link href={href}>
          {content}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(isFullWidth && "w-full justify-between", className)}
      disabled={disabled}
    >
      {content}
    </Button>
  );
}

export function SidebarFooter({
  primaryAction,
  secondaryAction,
  align = "between",
  className,
  children,
}: SidebarFooterProps) {
  if (!children && !primaryAction && !secondaryAction) return null;

  const alignClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  }[align];

  if (children) {
    return (
      <div className={cn("flex w-full items-center gap-2", alignClass, className)}>
        {children}
      </div>
    );
  }

  const hasMultiple = !!secondaryAction && !!primaryAction;

  return (
    <div className={cn("flex w-full items-center gap-2", alignClass, className)}>
      {secondaryAction ? (
        <FooterActionButton action={secondaryAction} defaultFullWidth={false} />
      ) : null}
      {primaryAction ? (
        <FooterActionButton action={primaryAction} defaultFullWidth={!hasMultiple} />
      ) : null}
    </div>
  );
}
