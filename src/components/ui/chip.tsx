import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ChipSize = "xs" | "sm"

interface ChipProps extends Omit<React.ComponentProps<typeof Button>, "variant" | "size" | "shape"> {
  selected?: boolean
  size?: ChipSize
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(({ selected, size = "sm", className, ...props }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant="outline"
    size={size}
    aria-pressed={selected}
    data-slot="chip"
    className={cn(
      "rounded-full text-foreground",
      selected &&
        "border-(--selected-border) bg-(--selected-bg) text-(--selected-fg) hover:border-(--selected-border) hover:bg-(--selected-bg) hover:text-(--selected-fg)",
      className
    )}
    {...props}
  />
))
Chip.displayName = "Chip"

export { Chip }
export type { ChipProps, ChipSize }
