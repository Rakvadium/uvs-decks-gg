import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden uppercase tracking-widest font-mono",
  {
    variants: {
      tone: {
        default:
          "rounded bg-primary/20 text-primary border-primary/40 shadow-[var(--chrome-badge-default-shadow)] hover:shadow-[var(--chrome-badge-default-shadow-hover)] hover:bg-primary/30",
        secondary:
          "rounded bg-secondary/20 text-secondary border-secondary/40 shadow-[var(--chrome-badge-secondary-shadow)] hover:shadow-[var(--chrome-badge-secondary-shadow-hover)] hover:bg-secondary/30",
        destructive:
          "rounded bg-destructive/20 text-destructive border-destructive/40 shadow-[var(--chrome-badge-destructive-shadow)] hover:shadow-[var(--chrome-badge-destructive-shadow-hover)]",
        outline:
          "rounded bg-transparent text-foreground border-border hover:border-primary/50 hover:text-primary hover:shadow-[var(--chrome-badge-outline-shadow-hover)]",
        muted:
          "rounded-full bg-muted/50 text-muted-foreground border-muted-foreground/30",
        entity:
          "rounded-none bg-gradient-to-r from-primary/10 to-secondary/10 text-foreground border-l-2 border-l-primary border-y border-y-border/50 border-r-0 backdrop-blur-sm",
        signal:
          "rounded-none bg-transparent text-primary border border-primary shadow-[var(--chrome-badge-signal-shadow)] [animation:var(--chrome-badge-signal-pulse)]",
        signalMagenta:
          "rounded-none bg-transparent text-secondary border border-secondary shadow-[var(--chrome-badge-signal-magenta-shadow)]",
        signalViolet:
          "rounded-none bg-transparent text-accent border border-accent shadow-[var(--chrome-badge-signal-violet-shadow)]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
)

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>

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
      className={cn(badgeVariants({ tone: resolvedTone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
export type { BadgeTone, BadgeVariantLegacy }
