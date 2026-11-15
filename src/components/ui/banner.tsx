import * as React from "react"

import { cn } from "@/lib/utils"

function Banner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="banner"
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-surface border border-surface bg-muted-elevated px-3 py-2 text-xs text-foreground/80",
        className
      )}
      {...props}
    />
  )
}

export { Banner }
