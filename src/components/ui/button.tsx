import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_2px_var(--primary),0_0_8px_var(--primary)/60] hover:shadow-[0_0_4px_var(--primary),0_0_14px_var(--primary),0_0_20px_var(--primary)/25] border border-primary/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-[0_0_2px_var(--destructive),0_0_8px_var(--destructive)/60] hover:shadow-[0_0_4px_var(--destructive),0_0_14px_var(--destructive),0_0_20px_var(--destructive)/25] border border-destructive/50",
        outline:
          "border border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_3px_var(--primary),0_0_10px_var(--primary)/70]",
        secondary:
          "bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-secondary/50 hover:shadow-[0_0_3px_var(--secondary),0_0_10px_var(--secondary)/70]",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground border border-transparent hover:border-accent/30",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        neon: "bg-transparent text-primary border-2 border-primary hover:bg-primary/10 shadow-[0_0_3px_var(--primary),0_0_10px_var(--primary),inset_0_0_5px_var(--primary)/30] hover:shadow-[0_0_5px_var(--primary),0_0_18px_var(--primary),0_0_28px_var(--primary)/35,inset_0_0_8px_var(--primary)/40]",
        "neon-magenta": "bg-transparent text-secondary border-2 border-secondary hover:bg-secondary/10 shadow-[0_0_3px_var(--secondary),0_0_10px_var(--secondary),inset_0_0_5px_var(--secondary)/30] hover:shadow-[0_0_5px_var(--secondary),0_0_18px_var(--secondary),0_0_28px_var(--secondary)/35,inset_0_0_8px_var(--secondary)/40]",
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

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
