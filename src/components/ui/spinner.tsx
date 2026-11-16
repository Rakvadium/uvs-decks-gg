import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type SpinnerSize = "sm" | "md" | "lg"

const SPINNER_SIZE: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
}

interface SpinnerProps extends Omit<React.ComponentProps<typeof Loader2>, "size"> {
  size?: SpinnerSize
}

function Spinner({ size = "sm", className, ...props }: SpinnerProps) {
  return (
    <Loader2
      data-slot="spinner"
      aria-hidden
      className={cn("shrink-0 animate-spin", SPINNER_SIZE[size], className)}
      {...props}
    />
  )
}

export { Spinner }
export type { SpinnerProps, SpinnerSize }
