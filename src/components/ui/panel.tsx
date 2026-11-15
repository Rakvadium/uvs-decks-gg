import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

interface PanelProps extends React.ComponentProps<"div"> {
  asChild?: boolean
}

function Panel({ className, asChild = false, ...props }: PanelProps) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="panel"
      className={cn("rounded-surface border border-surface bg-card-tint", className)}
      {...props}
    />
  )
}

export { Panel }
export type { PanelProps }
