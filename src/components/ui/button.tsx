import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--chrome-button-shadow-default)] hover:shadow-[var(--chrome-button-shadow-default-hover)] border border-primary/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-[var(--chrome-button-shadow-destructive)] hover:shadow-[var(--chrome-button-shadow-destructive-hover)] border border-destructive/50",
        destructiveOutline:
          "border border-red-600/65 bg-transparent text-red-700 shadow-none hover:bg-red-500/[0.12] hover:border-red-600 hover:text-red-950 dark:border-red-500/55 dark:text-red-400 dark:hover:bg-red-500/14 dark:hover:border-red-400 dark:hover:text-red-300 [&_svg]:text-current focus-visible:border-red-600 focus-visible:ring-red-500/35 dark:focus-visible:border-red-400 dark:focus-visible:ring-red-400/35",
        outline:
          "border border-[color:var(--control-dual-border)] bg-transparent text-primary hover:bg-[color:var(--control-dual-surface-hover)] hover:border-[color:var(--control-dual-border-strong)] hover:text-primary hover:shadow-[var(--chrome-button-shadow-outline-hover)] [&_svg]:text-secondary/90",
        secondary:
          "bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-secondary/50 hover:shadow-[var(--chrome-button-shadow-secondary-hover)]",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground border border-transparent hover:border-accent/30",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        neon: "bg-transparent text-primary border-2 border-primary hover:bg-primary/10 shadow-[var(--chrome-button-shadow-neon)] hover:shadow-[var(--chrome-button-shadow-neon-hover)]",
        "neon-magenta": "bg-transparent text-secondary border-2 border-secondary hover:bg-secondary/10 shadow-[var(--chrome-button-shadow-neon-magenta)] hover:shadow-[var(--chrome-button-shadow-neon-magenta-hover)]",
        cyber: "bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/40 hover:from-primary/30 hover:to-secondary/30 hover:border-primary/60 backdrop-blur-sm",
      },
      size: {
        default: "h-10 px-5 py-2.5 rounded-md has-[>svg]:px-4",
        sm: "h-8 rounded gap-1.5 px-3.5 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-8 text-base has-[>svg]:px-5",
        icon: "size-10 rounded-md",
        "icon-sm": "size-8 rounded",
        "icon-lg": "size-12 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
