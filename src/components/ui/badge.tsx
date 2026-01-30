import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden uppercase tracking-widest font-mono",
  {
    variants: {
      variant: {
        default:
          "rounded bg-primary/20 text-primary border-primary/40 shadow-[0_0_8px_-2px_var(--primary)] hover:shadow-[0_0_12px_-2px_var(--primary)] hover:bg-primary/30",
        secondary:
          "rounded bg-secondary/20 text-secondary border-secondary/40 shadow-[0_0_8px_-2px_var(--secondary)] hover:shadow-[0_0_12px_-2px_var(--secondary)] hover:bg-secondary/30",
        destructive:
          "rounded bg-destructive/20 text-destructive border-destructive/40 shadow-[0_0_8px_-2px_var(--destructive)] hover:shadow-[0_0_12px_-2px_var(--destructive)]",
        outline:
          "rounded bg-transparent text-foreground border-border hover:border-primary/50 hover:text-primary hover:shadow-[0_0_10px_-3px_var(--primary)]",
        neon:
          "rounded-none bg-transparent text-primary border border-primary shadow-[0_0_10px_var(--primary),inset_0_0_8px_var(--primary)/20] animate-pulse",
        "neon-magenta":
          "rounded-none bg-transparent text-secondary border border-secondary shadow-[0_0_10px_var(--secondary),inset_0_0_8px_var(--secondary)/20]",
        "neon-violet":
          "rounded-none bg-transparent text-accent border border-accent shadow-[0_0_10px_var(--accent),inset_0_0_8px_var(--accent)/20]",
        cyber:
          "rounded-none bg-gradient-to-r from-primary/10 to-secondary/10 text-foreground border-l-2 border-l-primary border-y border-y-border/50 border-r-0 backdrop-blur-sm",
        status:
          "rounded-full bg-muted/50 text-muted-foreground border-muted-foreground/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
