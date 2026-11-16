"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { controlFocusClassName } from "@/components/ui/control"
import { cn } from "@/lib/utils"

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-surface transition-[border-color,box-shadow,background-color] duration-200",
        controlFocusClassName,
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-(--selected-border) data-[state=checked]:bg-(--selected-bg)",
        "data-[state=unchecked]:bg-muted-soft",
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full shadow-sm ring-0 transition-[transform,background-color]",
          "data-[state=checked]:translate-x-4 data-[state=checked]:bg-(--selected-fg)",
          "data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-muted-foreground/50"
        )}
      />
    </SwitchPrimitives.Root>
  )
}

export { Switch }
