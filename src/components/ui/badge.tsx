import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none overflow-hidden chrome-label-case",
  {
    variants: {
      tone: {
        default:
          "rounded-md bg-primary-selected text-primary border-primary-soft shadow-[var(--chrome-badge-default-shadow)]",
        secondary:
          "rounded-md bg-secondary-selected text-[color:var(--badge-secondary,var(--secondary))] border-[color:color-mix(in_oklab,var(--badge-secondary,var(--secondary))_40%,transparent)] shadow-[var(--chrome-badge-secondary-shadow)]",
        destructive:
          "rounded-md bg-destructive-selected text-destructive border-destructive-soft shadow-[var(--chrome-badge-destructive-shadow)]",
        outline:
          "rounded-md bg-transparent text-foreground border-surface",
        success:
          "rounded-md bg-success-selected text-success border-success-soft",
        warning:
          "rounded-md bg-warning-selected text-warning border-warning-soft",
        info:
          "rounded-md bg-info-selected text-info border-info-soft",
        muted:
          "rounded-full bg-muted-soft text-muted-foreground border-muted-foreground/30",
        entity:
          "rounded-none bg-gradient-to-r from-primary/10 to-secondary/10 text-foreground border-l-2 border-l-primary border-y border-y-border/50 border-r-0 backdrop-blur-sm",
        signal:
          "rounded-none bg-transparent text-primary border border-primary shadow-[var(--chrome-badge-signal-shadow)] [animation:var(--chrome-badge-signal-pulse)]",
        signalMagenta:
          "rounded-none bg-transparent text-secondary border border-secondary shadow-[var(--chrome-badge-signal-magenta-shadow)]",
        signalViolet:
          "rounded-none bg-transparent text-accent border border-accent shadow-[var(--chrome-badge-signal-violet-shadow)]",
      },
      size: {
        sm: "h-5 px-1.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "h-(--control-h-sm) px-3 text-xs",
      },
      interactive: {
        true: "cursor-pointer transition-[color,border-color,box-shadow] duration-200",
        false: "",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        tone: "default",
        className: "hover:shadow-[var(--chrome-badge-default-shadow-hover)] hover:border-primary-strong",
      },
      {
        interactive: true,
        tone: "secondary",
        className:
          "hover:shadow-[var(--chrome-badge-secondary-shadow-hover)] hover:border-[color:color-mix(in_oklab,var(--badge-secondary,var(--secondary))_60%,transparent)]",
      },
      {
        interactive: true,
        tone: "destructive",
        className: "hover:shadow-[var(--chrome-badge-destructive-shadow-hover)] hover:border-destructive-strong",
      },
      {
        interactive: true,
        tone: "outline",
        className: "hover:border-primary-strong hover:text-primary hover:shadow-[var(--chrome-badge-outline-shadow-hover)]",
      },
    ],
    defaultVariants: {
      tone: "default",
      size: "md",
      interactive: false,
    },
  }
)

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>
type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>

type BadgeVariantLegacy =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "status"
  | "cyber"
  | "neon"
  | "neon-magenta"
  | "neon-violet"

const VARIANT_TO_TONE: Record<BadgeVariantLegacy, BadgeTone> = {
  default: "default",
  secondary: "secondary",
  destructive: "destructive",
  outline: "outline",
  status: "muted",
  cyber: "entity",
  neon: "signal",
  "neon-magenta": "signalMagenta",
  "neon-violet": "signalViolet",
}

function Badge({
  className,
  tone,
  size,
  interactive,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    variant?: BadgeVariantLegacy
    asChild?: boolean
  }) {
  const resolvedTone = tone ?? (variant ? VARIANT_TO_TONE[variant] : undefined)
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ tone: resolvedTone, size, interactive }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
export type { BadgeSize, BadgeTone, BadgeVariantLegacy }
