"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_NAV_ICON_BUTTON, MOBILE_NAV_ICON_BUTTON_ACTIVE } from "../mobile-glass";

interface MobileNavIconButtonProps extends ComponentPropsWithoutRef<"button"> {
  active?: boolean;
  label: string;
  children: ReactNode;
}

export function MobileNavIconButton({
  active = false,
  label,
  className,
  children,
  type = "button",
  ...props
}: MobileNavIconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(MOBILE_NAV_ICON_BUTTON, active && MOBILE_NAV_ICON_BUTTON_ACTIVE, className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface MobileNavBackButtonProps {
  href?: string;
  onClick?: () => void;
  label: string;
  className?: string;
}

export function MobileNavBackButton({ href, onClick, label, className }: MobileNavBackButtonProps) {
  const inner = (
    <>
      <ChevronLeft className="size-6 -ml-1" strokeWidth={2.25} />
    </>
  );
  const classes = cn(MOBILE_NAV_ICON_BUTTON, "text-primary hover:bg-primary/10", className);

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={classes}>
      {inner}
    </button>
  );
}
