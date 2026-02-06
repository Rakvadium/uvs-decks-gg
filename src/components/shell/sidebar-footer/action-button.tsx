import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SidebarFooterAction } from "./types";

export function FooterActionButton({
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
        <Link href={href}>{content}</Link>
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
