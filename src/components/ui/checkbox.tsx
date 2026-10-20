"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-[color:var(--checkbox-border,var(--control-dual-border))] bg-background shadow-xs outline-none transition-[color,box-shadow,background-color,border-color] duration-200",
        "hover:border-[color:var(--checkbox-border-hover,var(--control-dual-border-strong))]",
        "dark:bg-background dark:border-[color:var(--checkbox-border,color-mix(in_oklab,var(--muted-foreground)_60%,transparent))] dark:hover:border-[color:var(--checkbox-border-hover,color-mix(in_oklab,var(--muted-foreground)_80%,transparent))]",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive-soft dark:aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&_svg]:size-3.5",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
