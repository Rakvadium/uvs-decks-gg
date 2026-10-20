import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,border-color,box-shadow,opacity] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background chrome-label-case",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dim shadow-[var(--chrome-button-shadow-default)] hover:shadow-[var(--chrome-button-shadow-default-hover)] border border-primary-strong",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-dim shadow-[var(--chrome-button-shadow-destructive)] hover:shadow-[var(--chrome-button-shadow-destructive-hover)] border border-destructive-strong",
        destructiveOutline:
          "border border-destructive-strong bg-transparent text-destructive shadow-none hover:bg-destructive-wash hover:border-destructive hover:text-destructive [&_svg]:text-current focus-visible:border-destructive focus-visible:ring-destructive-soft",
        outline:
          "border border-[color:var(--control-dual-border)] bg-transparent text-primary hover:bg-[color:var(--control-dual-surface-hover)] hover:border-[color:var(--control-dual-border-strong)] hover:text-primary hover:shadow-[var(--chrome-button-shadow-outline-hover)] [&_svg]:text-current",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-dim border border-secondary-strong hover:shadow-[var(--chrome-button-shadow-secondary-hover)]",
        ghost:
          "hover:bg-accent-selected hover:text-foreground border border-transparent hover:border-accent-soft",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-transparent text-primary border-2 border-primary hover:bg-primary-wash shadow-[var(--chrome-button-shadow-neon)] hover:shadow-[var(--chrome-button-shadow-neon-hover)]",
        "neon-magenta": "bg-transparent text-secondary border-2 border-secondary hover:bg-secondary-wash shadow-[var(--chrome-button-shadow-neon-magenta)] hover:shadow-[var(--chrome-button-shadow-neon-magenta-hover)]",
        cyber: "bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary-soft hover:border-primary-strong backdrop-blur-sm",
      },
      size: {
        default: "h-10 px-5 py-2.5 rounded-md has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3.5 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-8 text-base has-[>svg]:px-5",
        icon: "size-10 rounded-md",
        "icon-sm": "size-8 rounded-md",
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
