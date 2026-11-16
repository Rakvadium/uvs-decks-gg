import * as React from "react"

import { controlFieldClassName, type ControlSize } from "@/components/ui/control"
import { cn } from "@/lib/utils"

const TEXTAREA_SIZE: Record<ControlSize, string> = {
  xs: "min-h-[calc(var(--control-h-xs)*1.5)] px-2.5 py-1.5 text-base md:text-xs",
  sm: "min-h-[calc(var(--control-h-sm)*1.5)] px-3 py-1.5 text-base md:text-sm",
  md: "min-h-[calc(var(--control-h-md)*1.5)] px-3 py-2 text-base md:text-sm",
  lg: "min-h-[calc(var(--control-h-lg)*1.5)] px-4 py-3 text-base",
}

export type TextareaProps = React.ComponentProps<"textarea"> & { size?: ControlSize }

function Textarea({ className, size = "md", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(
        "flex w-full placeholder:text-muted-foreground",
        controlFieldClassName,
        TEXTAREA_SIZE[size],
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
